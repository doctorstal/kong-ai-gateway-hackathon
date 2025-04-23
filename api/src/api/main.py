from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from opperai import Opper
import logging
import time

from .clients.couchbase import CouchbaseChatClient
from .routes import router
from .utils import log
from . import conf

log.init(conf.get_log_level())
logger = log.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing API services...")
    
    # Initialize Couchbase client
    cb_conf = conf.get_couchbase_conf()
    app.state.db = CouchbaseChatClient(
        url=cb_conf.url,
        username=cb_conf.username,
        password=cb_conf.password,
        bucket_name=cb_conf.bucket,
        scope=cb_conf.scope
    )
    
    # Attempt to connect with a retry loop
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to Couchbase (startup attempt {attempt}/{max_retries})")
            app.state.db.connect()
            
            # Test that we can actually perform operations
            try:
                # Wait for query service to be ready
                app.state.db.await_up(max_retries=10, initial_delay=2.0, max_delay=10.0)
                logger.info("✅ Couchbase connection established and ready")
                break
            except Exception as e:
                logger.warning(f"Couchbase services not fully ready: {str(e)}")
                if attempt == max_retries:
                    logger.warning("Starting API without confirmed Couchbase connection - will retry on requests")
        except Exception as e:
            logger.error(f"Failed to connect to Couchbase on startup (attempt {attempt}): {str(e)}")
            if attempt < max_retries:
                wait_time = min(30, 2 ** attempt)  # Exponential backoff
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                logger.warning("Starting API without confirmed Couchbase connection - will retry on requests")
    
    # Initialize Opper
    app.state.opper = Opper(api_key=conf.get_opper_api_key())
    logger.info("✅ API services initialized")

    yield
    
    # Cleanup
    if hasattr(app.state, 'db') and app.state.db:
        app.state.db.close()
        logger.info("Closed Couchbase connection")

app = FastAPI(
    title="Customer Support Chat API",
    version="1.0.0",
    docs_url="/docs",
    lifespan=lifespan
)
app.include_router(router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def main():
    if not conf.validate():
        raise ValueError("Invalid configuration.")

    http_conf = conf.get_http_conf()
    logger.info(f"Starting API on port {http_conf.port}")
    uvicorn.run(
        "api.main:app",
        host=http_conf.host,
        port=http_conf.port,
        reload=http_conf.autoreload,
        log_level="debug" if http_conf.debug else "info",
        log_config=None
    )
