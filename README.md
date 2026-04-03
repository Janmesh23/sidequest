# SideQuest — AI-Powered Document Intelligence System

> Upload any document. Ask anything. Get answers with proof.

SideQuest is a full-stack AI application that allows users to upload large documents and have an intelligent conversation with them. Every response is grounded strictly in the uploaded document and comes with precise citations. 

---

## How It Works — The RAG Architecture

SideQuest uses a **Retrieval-Augmented Generation (RAG)** pipeline:
1. **Ingestion**: Documents are parsed, chunked, and embedded into a Vector Database.
2. **Retrieval**: User queries are embedded to find the most semantically relevant document chunks.
3. **Generation**: The top chunks are passed to the open-source LLM (`meta-llama/Llama-3.1-8B-Instruct` via Hugging Face) to generate grounded answers with citations.
4. **Summarization**: Queries are dynamically summarized into concise conversation titles.

### Architecture Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                       NEXT.JS FRONTEND                      │
│                                                             │
│   [Document Upload]               [Chat Workspace]          │
│          │                               │                  │
└──────────┼───────────────────────────────┼──────────────────┘
     POST /upload                    POST /query
           │                               │
           ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND                       │
│                                                             │
│   ┌───────────────┐              ┌─────────────────────┐    │
│   │   Ingestion   │              │   Retrieval Flow    │    │
│   │               │              │                     │    │
│   │ 1. Parse File │              │ 1. Embed Question   │    │
│   │ 2. Chunk text │              │ 2. Find top vectors │    │
│   │ 3. Embed      │              │ 3. Build Prompt     │    │
│   │ 4. Store      │              │ 4. Query LLM        │    │
│   └──────┬────────┘              └─────────┬───────────┘    │
└──────────┼─────────────────────────────────┼────────────────┘
           │                                 │
           ▼                                 ▼
┌─────────────────────┐           ┌───────────────────────────┐
│     ChromaDB        │◄──────────│      Hugging Face         │
│  (Vector Storage)   │           │   (Llama 3.1 8B Model)    │
└─────────────────────┘           └───────────────────────────┘
```

---

## Tech Stack

- **Frontend**: Next.js, React, CSS Modules (Google Outfit typography)
- **Backend**: FastAPI, Python
- **AI Models**: Hugging Face Hub (Llama 3.1 8B Instruct)
- **Vector Database**: ChromaDB

---

## Environment Variables

Create a `.env` file in your `backend` directory:

```env
# Hugging Face Configuration
HUGGINGFACEHUB_API_TOKEN=hf_...
LLM_MODEL=meta-llama/Llama-3.1-8B-Instruct

# Frontend Connection
FRONTEND_URL=http://localhost:3000
```

---

## Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- An active Hugging Face API Token (Free tier works!)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Ensure you configure your .env file
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Open the App
Navigate to `http://localhost:3000` in your browser. 
To begin, navigate to the **Library** tab via the sidebar and upload an informative document to use as context!

---

## Future Roadmap

- [ ] Google OAuth Integration & Account Authentication
- [ ] OCR Support for scanned PFDs and Images 

