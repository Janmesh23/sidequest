from typing import Dict, List, Optional
from .database import SessionLocal, engine, Base
from .models import Document

# Create tables on startup
Base.metadata.create_all(bind=engine)

class StatusManager:
    def set_status(self, doc_id: str, status: str, details: Dict = None, user_id: str = "user_1"):
        db = SessionLocal()
        try:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if not doc:
                doc = Document(id=doc_id, status=status, user_id=user_id)
                db.add(doc)
            else:
                doc.status = status
            
            if details:
                if "filename" in details:
                    doc.filename = details["filename"]
                if "total_chunks" in details:
                    doc.total_chunks = details["total_chunks"]
                # Store other details in metadata_json
                doc.metadata_json = details
            
            db.commit()
        except Exception as e:
            print(f"StatusManager error: {e}")
            db.rollback()
        finally:
            db.close()

    def get_status(self, doc_id: str) -> Optional[Dict]:
        db = SessionLocal()
        try:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            return doc.to_dict() if doc else {"status": "not_found"}
        finally:
            db.close()

    def get_all_statuses(self, user_id: str = None) -> List[Dict]:
        db = SessionLocal()
        try:
            query = db.query(Document)
            if user_id:
                query = query.filter(Document.user_id == user_id)
            docs = query.order_by(Document.created_at.desc()).all()
            return [doc.to_dict() for doc in docs]
        finally:
            db.close()

status_manager = StatusManager()
