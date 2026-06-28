from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    id: str
    email: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    created_at: datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentBase(BaseModel):
    title: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str
    user_id: str
    file_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Highlight Schemas
class HighlightBase(BaseModel):
    document_id: str
    text: str
    page_index: int
    selection_coords: Optional[str] = None

class HighlightCreate(HighlightBase):
    pass

class HighlightUpdate(BaseModel):
    explanation: Optional[str] = None
    translation: Optional[str] = None

class Highlight(HighlightBase):
    id: str
    user_id: str
    explanation: Optional[str] = None
    translation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# JWT Token Schema
class TokenData(BaseModel):
    user_id: str
    email: Optional[str] = None
