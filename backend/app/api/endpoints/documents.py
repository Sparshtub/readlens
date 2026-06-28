import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from pypdf import PdfReader
from backend.app.db import models, schemas
from backend.app.api.deps import get_current_active_user
from backend.app.db.session import get_db

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.Document)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported in Phase 0.")
        
    doc_title = title or file.filename.rsplit('.', 1)[0]
    
    # Save the file locally
    file_id = str(models.generate_uuid())
    file_extension = file.filename.split('.')[-1]
    saved_filename = f"{file_id}.{file_extension}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)
    
    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    # Set public access path/url for local delivery
    # We will configure FastAPI static files at /files/
    file_url = f"/api/v1/documents/files/{saved_filename}"
    
    db_doc = models.Document(
        id=file_id,
        user_id=current_user.id,
        title=doc_title,
        file_path=saved_path,
        file_url=file_url
    )
    
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    return db_doc

@router.get("/", response_model=List[schemas.Document])
def list_documents(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Document).filter(models.Document.user_id == current_user.id).all()

@router.get("/{document_id}", response_model=schemas.Document)
def get_document(
    document_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Remove file from disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass
            
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
