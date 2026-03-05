from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
import shutil
import os
import uuid
from services.ingestion.parser import parser
from services.ingestion.chunker import chunker
from services.ingestion.embedder import embedder
from services.ingestion.status_manager import status_manager
from services.retrieval.vector_store import vector_store

router = APIRouter()

UPLOAD_DIR = "./temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def process_document_background(doc_id: str, file_path: str, filename: str, user_id: str):
    try:
        status_manager.set_status(doc_id, "parsing", user_id=user_id)
        # 1. Parse document
        parsed_pages = parser.parse_file(file_path)
        
        status_manager.set_status(doc_id, "chunking", user_id=user_id)
        # 2. Chunk text
        chunks = chunker.split_documents(parsed_pages)
        
        # Add document_id and user_id to metadata for filtering
        for chunk in chunks:
            chunk["metadata"]["user_id"] = user_id
            chunk["metadata"]["document_id"] = doc_id
        
        status_manager.set_status(doc_id, f"embedding (0/{len(chunks)})", user_id=user_id)
        # 3. Generate embeddings
        chunk_texts = [c["text"] for c in chunks]
        embeddings = embedder.embed_documents(chunk_texts)
        
        status_manager.set_status(doc_id, "indexing", user_id=user_id)
        # 4. Store in Vector DB
        vector_store.add_chunks(chunks, embeddings)
        
        status_manager.set_status(doc_id, "ready", {"total_chunks": len(chunks)}, user_id=user_id)
        print(f"Background task complete for {filename}")
    except Exception as e:
        print(f"Error in background processing: {e}")
        status_manager.set_status(doc_id, f"failed: {str(e)}")
    finally:
        # Cleanup temp file
        if os.path.exists(file_path):
            os.remove(file_path)

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Header

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    x_user_id: str = Header(...)
):
    doc_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{file.filename}")
    
    try:
        # 1. Save file locally immediately
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. Register initial status
        status_manager.set_status(doc_id, "uploaded", {"filename": file.filename}, user_id=x_user_id)
        
        # 3. Start background processing
        background_tasks.add_task(process_document_background, doc_id, file_path, file.filename, x_user_id)
        
        return {
            "document_id": doc_id,
            "filename": file.filename,
            "status": "processing"
        }
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))
