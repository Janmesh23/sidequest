from fastapi import APIRouter, HTTPException
from services.ingestion.status_manager import status_manager
from services.ingestion.database import SessionLocal
from services.ingestion.models import Document
from services.retrieval.vector_store import vector_store

router = APIRouter()

from fastapi import APIRouter, HTTPException, Header
@router.get("/documents")
async def list_documents(x_user_id: str = Header(...)):
    return status_manager.get_all_statuses(user_id=x_user_id)

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, x_user_id: str = Header(...)):
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id, Document.user_id == x_user_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found or access denied")
        
        # 1. Delete from Vector Store
        vector_store.delete_by_document_id(document_id, user_id=x_user_id)
        
        # 2. Delete from Database
        db.delete(doc)
        db.commit()
        
        return {"status": "deleted", "document_id": document_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
