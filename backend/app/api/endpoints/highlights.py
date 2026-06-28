from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db import models, schemas
from backend.app.api.deps import get_current_active_user
from backend.app.db.session import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Highlight)
def create_highlight(
    highlight: schemas.HighlightCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify document exists and belongs to user
    doc = db.query(models.Document).filter(
        models.Document.id == highlight.document_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db_highlight = models.Highlight(
        document_id=highlight.document_id,
        user_id=current_user.id,
        text=highlight.text,
        page_index=highlight.page_index,
        selection_coords=highlight.selection_coords
    )
    
    db.add(db_highlight)
    db.commit()
    db.refresh(db_highlight)
    return db_highlight

@router.get("/", response_model=List[schemas.Highlight])
def list_highlights(
    document_id: Optional[str] = None,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Highlight).filter(models.Highlight.user_id == current_user.id)
    if document_id:
        query = query.filter(models.Highlight.document_id == document_id)
    return query.all()

@router.delete("/{highlight_id}")
def delete_highlight(
    highlight_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    highlight = db.query(models.Highlight).filter(
        models.Highlight.id == highlight_id,
        models.Highlight.user_id == current_user.id
    ).first()
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
        
    db.delete(highlight)
    db.commit()
    return {"message": "Highlight deleted successfully"}
