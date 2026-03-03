# 🎯 SideQuest: Modern RAG System with Citations

Welcome to your project! This README serves as your master documentation for building a production-grade **Retrieval-Augmented Generation (RAG)** system from scratch.

---

## 🚀 The Vision
The goal is to build an AI orchestrator that can "read" large volumes of documents (legal contracts, research papers, books) and answer user queries with **mathematical precision** and **verifiable citations**.

### Why RAG?
Standard LLMs have limited context windows and can hallucinate. RAG solves this by:
1. **Retrieving** only the relevant parts of a document.
2. **Augmenting** the LLM's prompt with that context.
3. **Generating** an answer grounded *only* in that specific data.

---

## 🏗️ Technical Architecture

### 1. The Ingestion Pipeline
- **Document Parsing**: Reading complex PDFs and extracting text using `PyMuPDF`.
- **Intelligent Chunking**: Splitting text into overlapping segments (e.g., 500 characters) so context isn't lost at the boundaries.
- **Embedding**: Converting text into 1536-dimensional vectors (using OpenAI's `text-embedding-3-small`) to capture semantic meaning.
- **Vector Storage**: Storing these vectors in **ChromaDB** for lightning-fast similarity searching.

### 2. The Query Pipeline
- **Semantic Search**: Converting the user's question into a vector and finding the "nearest" chunks in the database.
- **Context Stuffing**: Injecting the retrieved chunks into a system prompt.
- **LLM Reasoning**: Using GPT-4 or Claude 3.5 to synthesize the answer.

### 3. The Citations Engine (The Key Feature)
- **Metadata Tracking**: Every chunk "knows" its page number and source file.
- **Inline Citation Logic**: Prompting the LLM to include references like `[Source: Page 42]` directly in the text.

---

## 🗺️ The Implementation Plan

### Phase 1: Foundation (Backend)
- [ ] Set up a Python environment with FastAPI.
- [ ] Implement a basic script to parse a PDF and store it in ChromaDB.
- [ ] Create a "Search" endpoint that returns the most relevant chunks for a query.

### Phase 2: Intelligence (The Brain)
- [ ] Integrate LangChain to connect ChromaDB and OpenAI/Anthropic APIs.
- [ ] Refine the system prompt to enforce grounded answers and citations.
- [ ] Implement metadata extraction to track page numbers.

### Phase 3: Interface (Frontend)
- [ ] Create a Next.js application with a "Premium" aesthetic (Dark mode, Glassmorphism).
- [ ] Build a file upload zone for new documents.
- [ ] Implement a chat interface that displays citations as clickable cards.

---

## 🛠️ Recommended Tech Stack
- **Backend**: Python, FastAPI, LangChain.
- **Database**: ChromaDB (Vector Store).
- **Frontend**: Next.js, Tailwind CSS, TypeScript.
- **Models**: OpenAI (Embeddings + GPT-4o).

---

## 📚 Learning Path
1. **Week 1**: Master Embeddings & Vector Search.
2. **Week 2**: Build the Ingestion Pipeline (PDF -> Chunks -> DB).
3. **Week 3**: Logic Layer (RAG & Citations).
4. **Week 4**: UI/UX & Deployment.
