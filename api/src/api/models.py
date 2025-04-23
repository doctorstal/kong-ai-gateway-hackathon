from typing import Any, Literal
from pydantic import BaseModel


## Knowledge Base ##
class KnowledgeItem(BaseModel):
    id: str
    title: str
    content: str
    category: str
    relevance_score: float | None = None
    tags: list[str] | None = None


class ConfigMessageRequest(BaseModel):
    content: str
    metadata: dict[str, Any] | None = None


class ConfigMessageResponse(BaseModel):
    config: dict[str, Any] | None = None


class ActionItem(BaseModel):
    name: str
    description: str


class Configuration(BaseModel):
    knowledge_base: list[KnowledgeItem]
    actions: list[ActionItem]
