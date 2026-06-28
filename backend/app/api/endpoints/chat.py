from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.app.db import models
from backend.app.api.deps import get_current_active_user
from backend.app.db.session import get_db
from backend.app.services.llm_service import llm_service

router = APIRouter()

class ChatRequest(BaseModel):
    document_id: str
    page_index: int
    question: str

class ChatResponse(BaseModel):
    answer: str

@router.post("/", response_model=ChatResponse)
def chat_with_document(
    request: ChatRequest,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify document exists and belongs to user
    doc = db.query(models.Document).filter(
        models.Document.id == request.document_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Get page content
    page = db.query(models.DocumentPage).filter(
        models.DocumentPage.document_id == request.document_id,
        models.DocumentPage.page_index == request.page_index
    ).first()
    
    # If no content found on page, fallback to empty string
    page_content = page.content if page else ""
    
    answer = llm_service.chat_with_page(
        question=request.question,
        page_content=page_content,
        page_index=request.page_index,
        title=doc.title
    )
    
    return ChatResponse(answer=answer)
