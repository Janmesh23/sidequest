import logging
import traceback
from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel
from services.retrieval.retriever import retriever
from services.generation.prompt_builder import prompt_builder
from services.generation.llm_client import llm_client

# Setup professional logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    top_k: int = 5

class TitleRequest(BaseModel):
    question: str

@router.post("/query/title")
async def generate_title(request: TitleRequest):
    """Generates a highly concise title using the LLM"""
    try:
        prompt = f"System: Generate a very short, concise title (maximum 3 to 4 words) summarizing the following query. Do not use quotes, punctuation, or any introductory filler text.\n\nQuery: {request.question}\n\nTitle:"
        answer = await llm_client.generate_answer(prompt)
        # Clean up common AI artifacts
        cleaned_title = answer.replace('"', '').replace("'", '').replace('Title:', '').strip().capitalize()
        if len(cleaned_title) > 40:
            cleaned_title = cleaned_title[:40] + "..."
        return {"title": cleaned_title}
    except Exception as e:
        logger.error(f"Title generation failed: {e}")
        return {"title": "New Chat"}

@router.post("/query")
async def query_document(request: QueryRequest, x_user_id: str = Header(...)):
    """
    Orchestrates the RAG (Retrieval-Augmented Generation) flow:
    1. Retrieve relevant document chunks for the specific user.
    2. Build a narrative-focused prompt.
    3. Generate a sophisticated answer using the LLM.
    """
    try:
        logger.info(f"--- QUERY START --- User: {x_user_id} | Q: {request.question[:50]}...")

        # 1. Retrieve relevant chunks with User Isolation
        context_chunks = retriever.retrieve(request.question, user_id=x_user_id, top_k=request.top_k)
        
        if not context_chunks:
            logger.info(f"No context found for User: {x_user_id}")
            return {
                "answer": "I couldn't find any relevant information in your uploaded documents. Try rephrasing or uploading more context!",
                "citations": []
            }

        logger.info(f"Retrieved {len(context_chunks)} source chunks")

        # 2. Build the optimized Narrative Prompt
        full_prompt = prompt_builder.build_rag_prompt(request.question, context_chunks)
        
        # 3. Generate the answer via LLM (Gemini)
        logger.info("Calling LLM for narrative generation...")
        answer = await llm_client.generate_answer(full_prompt)
        
        logger.info("AI Generation successful")
        
        return {
            "answer": answer,
            "citations": [c['metadata'] for c in context_chunks]
        }

    except Exception as e:
        err_msg = str(e)
        logger.error(f"!!! QUERY ERROR: {err_msg}")
        
        # ⚠️ Handle API Quota Exhaustion (429) specifically
        if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
             raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI Quota Reached. Your free tier limit has been exceeded. Please try again later."
            )
        
        # For other errors, log the traceback for the developer
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error: {err_msg}"
        )
