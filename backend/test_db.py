import os
import sys

# Add parent directory of backend to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.db.session import SessionLocal, engine, Base
from backend.app.db import models

def test_database_setup():
    print("Initializing test database...")
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create a test user if not exists
        test_user = db.query(models.User).filter(models.User.id == "test_user_1").first()
        if not test_user:
            test_user = models.User(id="test_user_1", email="test@example.com")
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"Created test user: {test_user.email}")
        else:
            print(f"Test user already exists: {test_user.email}")
            
        # Create a test document
        test_doc = models.Document(
            user_id=test_user.id,
            title="ReadLens Introduction PDF",
            file_path="uploads/test_intro.pdf",
            file_url="/api/v1/documents/files/test_intro.pdf"
        )
        db.add(test_doc)
        db.commit()
        db.refresh(test_doc)
        print(f"Created test document: {test_doc.title} (ID: {test_doc.id})")
        
        # Create a test highlight
        test_hl = models.Highlight(
            document_id=test_doc.id,
            user_id=test_user.id,
            text="Read anything. Understand everything.",
            page_index=1,
            selection_coords='{"x": 100, "y": 200}',
            explanation="The core tagline of ReadLens AI app.",
            translation="कुछ भी पढ़ें। सब कुछ समझें।"
        )
        db.add(test_hl)
        db.commit()
        db.refresh(test_hl)
        print(f"Created test highlight: '{test_hl.text}' with translation and explanation.")
        
        # Verify queries and relations
        user_docs = test_user.documents
        print(f"Verified relations: User {test_user.id} has {len(user_docs)} document(s).")
        for doc in user_docs:
            print(f"  - Document: {doc.title} with {len(doc.highlights)} highlight(s).")
            for hl in doc.highlights:
                print(f"    - Highlight: '{hl.text}' -> Exp: '{hl.explanation}'")
                
        # Clean up test insertions
        db.delete(test_hl)
        db.delete(test_doc)
        db.commit()
        print("Database cleanup completed successfully.")
        print("Database verification: PASSED!")
        
    except Exception as e:
        print(f"Database verification FAILED: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_database_setup()
