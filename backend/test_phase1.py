import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.db.session import SessionLocal, engine, Base
from backend.app.db import models
from backend.app.services.llm_service import llm_service

def verify_phase1_flow():
    print("==================================================")
    print("Verifying Phase 1: MVP Core Loop Backend Logic")
    print("==================================================")
    
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Setup dev user
        test_user = db.query(models.User).filter(models.User.id == "dev_user_1").first()
        if not test_user:
            test_user = models.User(id="dev_user_1", email="dev@readlens.ai")
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print("1. Dev user registered successfully.")
        else:
            print("1. Dev user already exists.")
            
        # 2. Add document with mock pages (simulating PDF upload extraction)
        doc_id = str(models.generate_uuid())
        test_doc = models.Document(
            id=doc_id,
            user_id=test_user.id,
            title="Sovereignty and the State",
            file_path="uploads/mock_politics.pdf",
            file_url=f"/api/v1/documents/files/{doc_id}.pdf"
        )
        db.add(test_doc)
        
        # Add page text to simulate parsing
        page1_content = "Democracy is a system of government where power is vested in the people, who rule either directly or through freely elected representatives. The cornerstone of democracy is the protection of human rights and civil liberties, ensuring that every citizen has an equal voice."
        db_page1 = models.DocumentPage(
            document_id=doc_id,
            page_index=1,
            content=page1_content
        )
        db.add(db_page1)
        db.commit()
        print(f"2. Saved document and parsed text for Page 1: \"{page1_content[:40]}...\"")
        
        # 3. Simulate text highlight & prompt LLM explanation/translation
        highlight_text = "power is vested in the people, who rule either directly or through freely elected representatives"
        print(f"3. User highlighted text snippet: \"{highlight_text}\"")
        print("   Running LLM Service to generate explanation & Hindi translation...")
        
        explanation, translation = llm_service.generate_explanation_and_translation(highlight_text)
        print(f"   [LLM Explanation]: {explanation}")
        print(f"   [LLM Translation]: {translation}")
        
        # Save highlight to database
        db_hl = models.Highlight(
            document_id=doc_id,
            user_id=test_user.id,
            text=highlight_text,
            page_index=1,
            selection_coords='{"x": 120, "y": 300}',
            explanation=explanation,
            translation=translation
        )
        db.add(db_hl)
        db.commit()
        print("   Highlight saved to database successfully.")
        
        # 4. Simulate page chat companion
        chat_question = "How is power distributed in a democracy according to this page?"
        print(f"4. User asked chat query: \"{chat_question}\"")
        print("   Running chat grounding service...")
        
        chat_answer = llm_service.chat_with_page(
            question=chat_question,
            page_content=page1_content,
            page_index=1,
            title=test_doc.title
        )
        print(f"   [AI Companion Response]:\n{chat_answer}")
        
        # 5. Simulate reading analytics heartbeat
        print("5. Recording 45 seconds of reading heartbeat...")
        today = date = models.datetime.utcnow().date()
        analytics_entry = db.query(models.ReadingAnalytics).filter(
            models.ReadingAnalytics.user_id == test_user.id,
            models.ReadingAnalytics.date == today
        ).first()
        
        if analytics_entry:
            analytics_entry.reading_time_seconds += 45
        else:
            analytics_entry = models.ReadingAnalytics(
                user_id=test_user.id,
                date=today,
                reading_time_seconds=45
            )
            db.add(analytics_entry)
        db.commit()
        db.refresh(analytics_entry)
        print(f"   Successfully accumulated today's reading time: {analytics_entry.reading_time_seconds} seconds.")
        
        # 6. Verify Dashboard Metrics calculation
        print("6. Pulling dashboard metrics calculation...")
        total_hl = db.query(models.Highlight).filter(models.Highlight.user_id == test_user.id).count()
        total_doc = db.query(models.Document).filter(models.Document.user_id == test_user.id).count()
        print(f"   Dashboard stats count: Documents={total_doc}, Highlights={total_hl}, Today's Time={analytics_entry.reading_time_seconds}s")
        
        # Clean up database insertions
        db.delete(db_hl)
        db.delete(db_page1)
        db.delete(test_doc)
        db.commit()
        print("7. Test database entities cleaned up.")
        print("==================================================")
        print("Phase 1 backend verification: PASSED!")
        print("==================================================")
        
    except Exception as e:
        print(f"Phase 1 verification FAILED: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    verify_phase1_flow()
