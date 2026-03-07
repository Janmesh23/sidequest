from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

# Fix for ChromaDB "unable to infer type for attribute chroma_server_nofile"
# This must be set before any ChromaDB imports occur.
os.environ["CHROMA_SERVER_NOFILE"] = "65535"

# Load environment variables (Override system env with .env)
load_dotenv(override=True)

from api.routes import upload, query, documents

app = FastAPI(
    title="SideQuest API",
    description="AI-Powered Document Intelligence System",
    version="1.0.0"
)

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url] if frontend_url != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(upload, tags=["Ingestion"])
app.include_router(query, tags=["Retrieval"])
app.include_router(documents, tags=["Management"])

@app.get("/")
async def root():
    return {"message": "Welcome to SideQuest API. Documents meet Intelligence."}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)