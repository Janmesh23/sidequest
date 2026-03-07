# SideQuest Documentation

SideQuest is a RAG-based document intelligence system that allows users to upload documents and query them with AI-powered answers that feature narrative tone and inline citations.

## Backend Structure

The backend is built with FastAPI and handles document ingestion, vector storage, and AI-driven retrieval.

### Core Modules
- **main.py**: The entry point of the API, configures middleware (CORS) and includes routers.
- **requirements.txt**: Lists all Python dependencies.

### API Routes (backend/api/routes)
- **upload.py**: Handles file uploads, background processing, and initial status tracking.
- **query.py**: Orchestrates the RAG flow, from retrieval to LLM generation.
- **documents.py**: Provides endpoints for listing and deleting documents.
- **__init__.py**: Exports the routers for easy import in main.py.

### Ingestion Services (backend/services/ingestion)
- **parser.py**: Extracts text from PDF and DOCX files.
- **chunker.py**: Splits extracted text into manageable, overlapping tokens.
- **embedder.py**: Converts text chunks into mathematical vectors using Gemini.
- **database.py**: Manages SQLite connection and SQLAlchemy sessions.
- **models.py**: Defines the database schema for document metadata.
- **status_manager.py**: Tracks the lifecycle of document processing (processing, completed, failed).

### Retrieval Services (backend/services/retrieval)
- **vector_store.py**: Interacts with ChromaDB for saving and searching chunks.
- **retriever.py**: Performs semantic searches filtered by user_id and document_id.

### Generation Services (backend/services/generation)
- **prompt_builder.py**: Constructs the final narrative-style prompt for the LLM.
- **llm_client.py**: Wraps the Gemini API for answering questions based on context.

## Frontend Structure

The frontend is a Next.js application designed with a premium, glassmorphic UI.

### Core Files
- **src/auth.ts**: Configures NextAuth for session management and JWT strategy.
- **src/middleware.ts**: Protects routes and ensures only authenticated users can access the dashboard.
- **src/utils/api.ts**: Axios-based client for communicating with the backend API.

### Components (src/components)
- **layout/Shell.tsx**: The main application layout, handling the sidebar and user session.
- **views/Library.tsx**: The document management view (uploading, listing, deleting).
- **views/Chat.tsx**: The AI chat interface with markdown rendering and history.

### Styling
- **src/app/globals.css**: Global CSS variables and glassmorphism definitions.
- **src/components/**/*.module.css**: Scoped styles for individual components.

## Cloud Deployment
The project is configured for a professional cloud environment:
- **render.yaml**: Defines the backend infrastructure (FastAPI on Render.com).
- **Persistent Storage**: Uses Render Disks to persist the SQLite database and ChromaDB vectors.
- **Environment Driven**: All URLs and secrets are managed via environment variables on Render and Vercel.
