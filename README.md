#  SideQuest — AI-Powered Document Intelligence System

> Upload any document. Ask anything. Get answers with proof.

SideQuest is a full-stack AI application that allows users to upload large documents — legal contracts, books, research papers, manuals — and have an intelligent conversation with them. Every response is grounded strictly in the uploaded document and comes with precise citations pointing back to the exact page and section the answer was derived from.

---

##  Table of Contents

- [What This Project Does](#what-this-project-does)
- [The Core Problem It Solves](#the-core-problem-it-solves)
- [How It Works — The RAG Architecture](#how-it-works--the-rag-architecture)
- [System Architecture Diagram](#system-architecture-diagram)
- [Pipeline Deep Dive](#pipeline-deep-dive)
  - [Stage 1 — Document Ingestion](#stage-1--document-ingestion)
  - [Stage 2 — Embedding Generation](#stage-2--embedding-generation)
  - [Stage 3 — Vector Storage](#stage-3--vector-storage)
  - [Stage 4 — Query Processing](#stage-4--query-processing)
  - [Stage 5 — Answer Generation with Citations](#stage-5--answer-generation-with-citations)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key Technical Concepts Explained](#key-technical-concepts-explained)
- [The Citations System](#the-citations-system)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [Future Roadmap](#future-roadmap)

---

## What This Project Does

SideQuest lets users:

1. **Upload** a large document (PDF, DOCX, TXT) of any size — a 500-page legal contract, a full textbook, a government report.
2. **Ask questions** in plain English about the content of that document.
3. **Receive accurate, grounded answers** — not hallucinated guesses — with explicit citations like *"This answer is based on Page 42, Section 3.1 — Liability Clauses."*
4. **Verify every claim** the AI makes by referencing the exact portion of the document it pulled the answer from.

This is not a general-purpose chatbot. The AI is strictly constrained to answer only from the document provided. If the answer is not in the document, it says so.

---

## The Core Problem It Solves

### Why can't you just paste a big document into ChatGPT?

Large Language Models (LLMs) like GPT-4 or Claude have a **context window** — a hard limit on how much text they can process at one time. A typical context window is around 128,000–200,000 tokens (roughly 90,000–150,000 words). A single legal document or textbook can far exceed this.

Even when a document *fits*, several problems arise:

| Problem | Description |
|---|---|
| **Lost in the middle** | LLMs perform worse on information buried in the middle of very long inputs. They tend to recall the beginning and end well, but lose middle content. |
| **No citations** | A raw LLM will answer confidently but won't tell you *where* in the document the information came from. |
| **Hallucination risk** | Without grounding, the LLM mixes document content with its general training knowledge, producing answers that sound right but aren't from your document. |
| **Cost** | Sending 100,000 tokens on every user query is extremely expensive at API pricing rates. |

**RAG (Retrieval-Augmented Generation) solves all of these** by only ever sending the *relevant* parts of the document to the LLM — retrieved on demand, per question.

---

## How It Works — The RAG Architecture

RAG stands for **Retrieval-Augmented Generation**. It is the industry-standard architecture for building document Q&A systems. The pipeline has two major phases:

### Phase A — Ingestion (happens once, when a document is uploaded)

```
Raw Document (PDF/DOCX/TXT)
        │
        ▼
  [Document Parser]       ← Extracts raw text, preserves page numbers
        │
        ▼
  [Text Chunker]          ← Splits document into overlapping chunks (~500 words each)
        │
        ▼
  [Embedding Model]       ← Converts each chunk into a vector (list of numbers)
        │
        ▼
  [Vector Database]       ← Stores all vectors + metadata (page, section, chunk text)
```

### Phase B — Query (happens every time a user asks a question)

```
User's Question
        │
        ▼
  [Embedding Model]       ← Converts question into a vector
        │
        ▼
  [Vector Database]       ← Finds the top-5 most semantically similar chunks
        │
        ▼
  [Re-ranker] (optional)  ← Re-orders chunks by true relevance
        │
        ▼
  [LLM — GPT-4 / Claude]  ← Receives: Question + Top chunks → Generates answer
        │
        ▼
  [Response Builder]      ← Attaches citations (page, section) to the answer
        │
        ▼
  Answer + Citations → User
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│   [Upload Document]          [Chat Interface]                   │
│         │                         │                            │
└─────────┼─────────────────────────┼────────────────────────────┘
          │ POST /upload            │ POST /query
          ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI)                         │
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────────────────┐    │
│  │  Ingestion       │      │  Query Handler               │    │
│  │  Service         │      │                              │    │
│  │                  │      │  1. Embed question           │    │
│  │  1. Parse doc    │      │  2. Search vector DB         │    │
│  │  2. Chunk text   │      │  3. Re-rank results          │    │
│  │  3. Embed chunks │      │  4. Call LLM with context    │    │
│  │  4. Store in DB  │      │  5. Return answer+citations  │    │
│  └────────┬─────────┘      └──────────────┬───────────────┘    │
└───────────┼────────────────────────────────┼────────────────────┘
            │                                │
            ▼                                ▼
┌───────────────────────┐      ┌─────────────────────────────┐
│   VECTOR DATABASE     │◄─────│   EMBEDDING MODEL           │
│   (ChromaDB /         │      │   (OpenAI text-embedding-3  │
│    Pinecone)          │      │    or Cohere / BGE)         │
│                       │      └─────────────────────────────┘
│  Stores:              │
│  - Chunk text         │      ┌─────────────────────────────┐
│  - Vector             │      │   LLM API                   │
│  - page_number        │      │   (GPT-4o / Claude 3.5)     │
│  - section_title      │      │                             │
│  - document_id        │      │  Receives question +        │
│  - chunk_index        │      │  retrieved chunks,          │
└───────────────────────┘      │  returns grounded answer    │
                               └─────────────────────────────┘
```

---

## Pipeline Deep Dive

### Stage 1 — Document Ingestion

**What happens:** The uploaded file is parsed to extract raw text while preserving structural metadata like page numbers, headings, and section titles.

**Tools used:** `PyMuPDF` (for PDFs), `python-docx` (for DOCX), `Unstructured.io` (for complex layouts, scanned docs with OCR).

**Why it matters:** The quality of text extraction directly determines answer quality. A poorly parsed document (where tables become garbled text, or columns get merged) will produce wrong answers. Special handling is needed for:
- Multi-column layouts
- Tables and figures
- Footnotes and headers
- Scanned/image-based PDFs (requires OCR via Tesseract or AWS Textract)

**Output of this stage:** A structured list of text blocks, each tagged with its page number and approximate section.

---

### Stage 2 — Text Chunking

**What happens:** The full document text is split into smaller, overlapping pieces called **chunks**. Each chunk is typically 300–600 words long, with a 50–100 word overlap between adjacent chunks.

**Why chunking is necessary:**
- Embedding models have their own token limits (typically 512–8192 tokens)
- Smaller, focused chunks retrieve more precisely than large blocks
- Overlap prevents answers from being split across two chunks and missed

**Chunking strategies used:**

| Strategy | Description | Best For |
|---|---|---|
| **Recursive Character Splitting** | Splits on paragraph → sentence → word boundaries in order | General documents |
| **Semantic Chunking** | Uses embeddings to split at meaning boundaries, not character counts | Books, articles |
| **Document-Aware Splitting** | Respects headings, sections, and page breaks | Legal docs, manuals |

**Metadata stored per chunk:**
```json
{
  "chunk_id": "doc123_chunk_047",
  "document_id": "doc123",
  "document_name": "employment_contract.pdf",
  "page_number": 12,
  "section_title": "Section 4 — Termination Clauses",
  "chunk_index": 47,
  "text": "The employee may be terminated with cause if..."
}
```

---

### Stage 3 — Embedding Generation

**What happens:** Each text chunk is converted into a **vector embedding** — a list of floating-point numbers (typically 1536 numbers for OpenAI's model) that encodes the semantic meaning of the text.

**What is an embedding?**

Think of it this way: every piece of text gets plotted as a point in a 1536-dimensional space. Texts that mean similar things end up near each other in that space. "Can the contract be terminated early?" and "Early termination of the agreement" will be very close together, even though they share no exact words.

This is fundamentally different from keyword search (which would find nothing if the exact word "terminated" isn't in the query). Embedding search finds *meaning matches*.

**Embedding models used:**

| Model | Dimensions | Best For |
|---|---|---|
| `text-embedding-3-small` (OpenAI) | 1536 | General use, cost-effective |
| `text-embedding-3-large` (OpenAI) | 3072 | Higher accuracy, more expensive |
| `embed-english-v3.0` (Cohere) | 1024 | Strong retrieval performance |
| `BAAI/bge-large-en` (open source) | 1024 | Self-hosted, no API cost |

**Important:** The same embedding model must be used for both document chunks and user queries. Mixing models will produce meaningless results.

---

### Stage 4 — Vector Storage & Retrieval

**What happens:** All chunk vectors + their metadata are stored in a **vector database**. When a user asks a question, the question is also embedded, and a similarity search finds the top-K most relevant chunks.

**Similarity metric used:** Cosine Similarity — measures the angle between two vectors. A score of 1.0 = identical meaning. A score of 0.0 = completely unrelated.

**Vector databases compared:**

| Database | Type | Best For |
|---|---|---|
| **ChromaDB** | Local / embedded | Development, small projects |
| **Pinecone** | Cloud, managed | Production, large-scale |
| **Weaviate** | Self-hosted / cloud | Advanced filtering + hybrid search |
| **FAISS** | Local library (Meta) | High-performance local search |
| **pgvector** | PostgreSQL extension | Teams already using Postgres |

**This project uses:** ChromaDB for development, Pinecone for production.

**Retrieval process:**
1. User question → embedding vector
2. Cosine similarity search against all stored chunk vectors
3. Return top-5 chunks with highest similarity scores
4. Filter out any chunks below a minimum score threshold (to avoid retrieving irrelevant content)

---

### Stage 5 — Answer Generation with Citations

**What happens:** The top retrieved chunks + the user's question are assembled into a carefully engineered prompt and sent to the LLM. The LLM generates an answer using *only* the provided chunks.

**The Prompt Structure:**
```
SYSTEM:
You are a document analysis assistant. Answer the user's question
using ONLY the context provided below. Do not use any outside knowledge.
For every claim you make, cite the exact source chunk using the format:
[Page X, Section: Y].
If the answer is not present in the context, say:
"This information is not available in the provided document."

CONTEXT:
[Chunk 1 — Page 12, Section 4: "The employee may be terminated..."]
[Chunk 2 — Page 13, Section 4: "Notice period of 30 days is required..."]
[Chunk 3 — Page 8, Section 2: "The contract is governed by Indian law..."]

USER QUESTION:
What is the notice period for termination?
```

**Example LLM Response:**
```
The notice period for termination is 30 days [Page 13, Section 4].
This applies to both voluntary resignation and employer-initiated
termination, unless terminated for cause [Page 12, Section 4],
in which case immediate termination without notice is permitted.
```

**Why this works:** The LLM is an excellent *reasoner and writer*. By constraining it to only the retrieved chunks, we eliminate hallucination while leveraging its ability to synthesize, compare, and explain information clearly.

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.11+ | Core language |
| **FastAPI** | 0.110+ | REST API framework |
| **LangChain** | 0.2+ | RAG orchestration framework |
| **LlamaIndex** | 0.10+ | Document parsing + metadata extraction |
| **PyMuPDF (fitz)** | 1.23+ | PDF text extraction with page numbers |
| **python-docx** | 1.1+ | DOCX file parsing |
| **Unstructured** | 0.13+ | Complex document parsing + OCR |
| **ChromaDB** | 0.5+ | Local vector database |
| **OpenAI SDK** | 1.30+ | Embeddings + LLM API calls |
| **Pydantic** | 2.0+ | Data validation and schemas |
| **Uvicorn** | 0.29+ | ASGI server for FastAPI |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 18+ | UI framework |
| **Next.js** | 14+ | React framework with routing |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 3+ | Styling |
| **Shadcn/UI** | latest | Pre-built component library |
| **React-PDF** | 7+ | Render PDF alongside chat |
| **Axios** | 1.6+ | HTTP requests to backend |
| **Zustand** | 4+ | Lightweight state management |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Pinecone** | Production vector database |
| **OpenAI API** | Embeddings (`text-embedding-3-small`) + LLM (`gpt-4o`) |
| **AWS S3 / Cloudinary** | Document file storage |
| **Docker** | Containerization |
| **Railway / Render** | Backend deployment |
| **Vercel** | Frontend deployment |

---

## Project Structure

```
SideQuest/
│
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── upload.py          # POST /upload — document ingestion endpoint
│   │   │   ├── query.py           # POST /query — question answering endpoint
│   │   │   └── documents.py       # GET /documents — list uploaded docs
│   │   └── middleware/
│   │       ├── auth.py
│   │       └── rate_limiter.py
│   │
│   ├── services/
│   │   ├── ingestion/
│   │   │   ├── parser.py          # Document parsing (PDF, DOCX, TXT)
│   │   │   ├── chunker.py         # Text chunking strategies
│   │   │   └── embedder.py        # Chunk → vector conversion
│   │   │
│   │   ├── retrieval/
│   │   │   ├── vector_store.py    # ChromaDB / Pinecone interface
│   │   │   ├── retriever.py       # Similarity search logic
│   │   │   └── reranker.py        # Optional cross-encoder re-ranking
│   │   │
│   │   └── generation/
│   │       ├── llm_client.py      # OpenAI / Anthropic API wrapper
│   │       ├── prompt_builder.py  # Assembles context + question into prompt
│   │       └── citation_parser.py # Extracts and formats citations from response
│   │
│   ├── models/
│   │   ├── document.py            # Document schema
│   │   ├── chunk.py               # Chunk + metadata schema
│   │   └── query.py               # Query request/response schema
│   │
│   └── utils/
│       ├── file_handler.py        # Upload validation, temp file management
│       └── logger.py
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Home / upload page
│   │   ├── chat/[docId]/
│   │   │   └── page.tsx           # Chat interface for a specific document
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── DocumentUploader.tsx   # Drag-and-drop file upload
│   │   ├── ChatWindow.tsx         # Message thread UI
│   │   ├── MessageBubble.tsx      # Single message with inline citations
│   │   ├── CitationCard.tsx       # Expandable citation with source text
│   │   ├── PDFViewer.tsx          # Side-by-side PDF viewer
│   │   └── LoadingStates.tsx      # Skeleton loaders
│   │
│   ├── lib/
│   │   ├── api.ts                 # API call functions
│   │   └── types.ts               # TypeScript interfaces
│   │
│   └── store/
│       └── chatStore.ts           # Zustand state for chat history
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Key Technical Concepts Explained

### What is a Vector?
A vector is simply a list of numbers. The sentence *"The contract expires in 2025"* might become `[0.23, -0.81, 0.44, 0.09, ...]` (1536 numbers total). These numbers are not random — they are learned by the embedding model to encode meaning. Every unique piece of text maps to a unique point in 1536-dimensional space.

### What is Cosine Similarity?
It's the mathematical way to measure how "close" two vectors are. It returns a number between -1 and 1. In practice for text:
- **0.95+** → Near-identical meaning
- **0.80–0.95** → Very related topic
- **0.60–0.80** → Loosely related
- **Below 0.60** → Likely irrelevant

When a user asks a question, the system finds all chunks with cosine similarity above ~0.75 to the question vector.

### What is Chunking Overlap?
When splitting a document, adjacent chunks share some text at their boundaries. Example with 50-word overlap:

```
Chunk 1: "...words 1 through 500... [words 451-500 are overlap]"
Chunk 2: "[words 451-500 repeated] ...words 501 through 950..."
```

This ensures that a sentence spanning a chunk boundary isn't lost. Without overlap, a critical answer sitting at the edge of two chunks would be partially retrieved and incomplete.

### What is Prompt Engineering?
The practice of crafting the exact instructions and format sent to the LLM to produce reliable, structured output. In this project, the prompt:
- Tells the LLM to only use provided context
- Instructs it to cite sources inline
- Defines the exact citation format `[Page X, Section Y]`
- Tells it what to say when the answer isn't in the document

Small changes to this prompt have large effects on answer quality and citation accuracy.

### What is Re-ranking?
After the vector search returns the top-10 most similar chunks, a second, more accurate (but slower) model called a **cross-encoder** re-reads the question and each chunk together and assigns a refined relevance score. The top-5 after re-ranking are sent to the LLM. This two-step approach (fast vector search → precise re-ranking) gives both speed and accuracy.

---

## The Citations System

Citations are the most important differentiator of this project. Here is exactly how they are implemented:

### Step 1 — Metadata Injection at Ingestion Time
When chunks are created, every chunk carries:
```python
metadata = {
    "page_number": 42,
    "section_title": "Clause 7 — Intellectual Property",
    "document_name": "nda_agreement.pdf",
    "chunk_index": 103,
    "char_start": 48200,
    "char_end": 49100
}
```

### Step 2 — Context Block Construction
Before calling the LLM, retrieved chunks are formatted as labeled blocks:
```
[SOURCE 1 | Page 42 | Section: Clause 7 — Intellectual Property]
All intellectual property created by the employee during the term
of employment belongs exclusively to the employer...

[SOURCE 2 | Page 43 | Section: Clause 7 — Intellectual Property]
This includes code, designs, written materials, and inventions
conceived during working hours or using company resources...
```

### Step 3 — LLM Citation Instruction
The system prompt instructs: *"When using information from a source block, cite it immediately after the sentence using the format [Page X, Section: Y]."*

### Step 4 — Citation Parsing
The raw LLM response is parsed by `citation_parser.py` to extract all `[Page X, Section: Y]` markers, match them back to their original chunk text, and structure the final API response:

```json
{
  "answer": "All IP created during employment belongs to the employer [Page 42, Section: Clause 7]. This includes code and designs made using company resources [Page 43, Section: Clause 7].",
  "citations": [
    {
      "id": 1,
      "page": 42,
      "section": "Clause 7 — Intellectual Property",
      "excerpt": "All intellectual property created by the employee...",
      "document": "nda_agreement.pdf"
    },
    {
      "id": 2,
      "page": 43,
      "section": "Clause 7 — Intellectual Property",
      "excerpt": "This includes code, designs, written materials...",
      "document": "nda_agreement.pdf"
    }
  ]
}
```

The frontend renders citations as clickable footnotes that highlight the relevant passage in the PDF viewer.

---

## API Reference

### POST `/upload`
Upload and process a document.

**Request:** `multipart/form-data`
```
file: <PDF, DOCX, or TXT file>
```

**Response:**
```json
{
  "document_id": "doc_a1b2c3",
  "document_name": "contract.pdf",
  "total_pages": 58,
  "total_chunks": 312,
  "status": "ready"
}
```

---

### POST `/query`
Ask a question about an uploaded document.

**Request:**
```json
{
  "document_id": "doc_a1b2c3",
  "question": "What is the notice period for termination?",
  "top_k": 5
}
```

**Response:**
```json
{
  "answer": "The notice period for termination is 30 days [Page 13, Section 4]...",
  "citations": [
    {
      "id": 1,
      "page": 13,
      "section": "Section 4 — Termination",
      "excerpt": "A notice period of 30 days is required...",
      "document": "contract.pdf",
      "similarity_score": 0.91
    }
  ],
  "model_used": "gpt-4o",
  "tokens_used": 1842
}
```

---

### GET `/documents`
List all previously uploaded documents.

**Response:**
```json
{
  "documents": [
    {
      "document_id": "doc_a1b2c3",
      "document_name": "contract.pdf",
      "uploaded_at": "2025-03-04T10:30:00Z",
      "total_pages": 58,
      "status": "ready"
    }
  ]
}
```

---

## Environment Variables

```env
# .env

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4o

# Vector Database
VECTOR_DB_PROVIDER=chroma           # "chroma" for local, "pinecone" for production
PINECONE_API_KEY=pcsk-...
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=SideQuest

# File Storage
FILE_STORAGE_PROVIDER=local         # "local" or "s3"
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=SideQuest-uploads

# App Config
MAX_FILE_SIZE_MB=50
DEFAULT_CHUNK_SIZE=500
DEFAULT_CHUNK_OVERLAP=50
DEFAULT_TOP_K=5
MIN_SIMILARITY_THRESHOLD=0.70
```

---

## Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- An OpenAI API key (get from `platform.openai.com`)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/SideQuest.git
cd SideQuest
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env         # Fill in your API keys
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### 4. Open the App
Navigate to `http://localhost:3000` in your browser.

### 5. Test the Pipeline
```bash
# Run the backend test suite
cd backend
pytest tests/

# Test a quick RAG query via curl
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"document_id": "doc_test", "question": "What is the contract duration?"}'
```

---

## Future Roadmap

| Feature | Description | Priority |
|---|---|---|
| **Multi-document search** | Query across multiple uploaded documents simultaneously | High |
| **Hybrid Search** | Combine vector similarity with keyword BM25 search for better retrieval | High |
| **Streaming responses** | Stream the LLM answer token by token for faster perceived response | Medium |
| **Conversation memory** | Follow-up questions that reference earlier answers in the same session | Medium |
| **OCR support** | Handle scanned, image-based PDFs via Tesseract or AWS Textract | Medium |
| **Document comparison** | "How does Contract A differ from Contract B on this clause?" | Low |
| **Table extraction** | Special handling for tables, converting them to queryable structured data | Low |
| **Fine-tuned re-ranker** | Train a domain-specific re-ranking model on legal or medical text | Low |
| **User authentication** | Multi-user support with private document namespaces | High |
| **Export to PDF** | Export full Q&A session with citations as a report | Low |

---

## Why This Architecture Scales

The ingestion pipeline (chunking + embedding) runs **once per document**, not per query. Storing vectors in a dedicated vector database means:

- A 1,000-page document is chunked into ~2,000 chunks, embedded once, and stored permanently.
- Every query only triggers: 1 embedding call + 1 vector search + 1 LLM call.
- Adding a 100th document does not slow down queries about document #1.
- The vector search across 100,000 chunks still returns in under 50ms on production databases.

This is why RAG systems are used in production at companies serving millions of users — the architecture is inherently efficient and horizontally scalable.

---

## Acknowledgements

Built on top of:
- [LangChain](https://python.langchain.com) — RAG orchestration
- [LlamaIndex](https://www.llamaindex.ai) — Document intelligence
- [ChromaDB](https://www.trychroma.com) — Local vector store
- [Pinecone](https://www.pinecone.io) — Production vector database
- [OpenAI](https://openai.com) — Embeddings and language model

---
