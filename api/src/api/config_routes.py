from fastapi import APIRouter, HTTPException
from .routes import DbHandle, KnowledgeItem, MessageResponse

from .utils import log
from .models import Configuration, ConfigMessageRequest, ConfigMessageResponse

logger = log.get_logger(__name__)

config_router = APIRouter()


@config_router.get("/current", response_model=Configuration)
async def get_configuration(db: DbHandle) -> Configuration:
    return db.get_configuration()


@config_router.post("/current", response_model=MessageResponse)
async def set_configuration(request: Configuration, db: DbHandle) -> bool:
    if db.set_configuration(request):
        return MessageResponse("Succesfully updated configuration!")
    else:
        raise HTTPException(status_code=500, detail="Failed to delete chat")


@config_router.post("/messages", response_model=ConfigMessageResponse)
async def add_configuration(
    request: ConfigMessageRequest,
    db: DbHandle,
) -> ConfigMessageResponse:
    """Configuration request"""
    if not request or not request.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    return ConfigMessageResponse()
