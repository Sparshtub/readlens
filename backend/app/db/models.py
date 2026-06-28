import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime, date
from backend.app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True) # Clerk user ID
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    highlights = relationship("Highlight", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("ReadingAnalytics", back_populates="user", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False) # Local storage path or relative path
    file_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="documents")
    highlights = relationship("Highlight", back_populates="document", cascade="all, delete-orphan")
    pages = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan")

class DocumentPage(Base):
    __tablename__ = "document_pages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False)
    page_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    
    document = relationship("Document", back_populates="pages")

class Highlight(Base):
    __tablename__ = "highlights"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    text = Column(Text, nullable=False)
    page_index = Column(Integer, nullable=False)
    selection_coords = Column(Text, nullable=True) # Stored as JSON string
    explanation = Column(Text, nullable=True)
    translation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="highlights")
    document = relationship("Document", back_populates="highlights")

class ReadingAnalytics(Base):
    __tablename__ = "reading_analytics"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(Date, default=date.today, index=True)
    reading_time_seconds = Column(Integer, default=0)
    
    user = relationship("User", back_populates="analytics")
