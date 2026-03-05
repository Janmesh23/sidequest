import chromadb
from chromadb.config import Settings
import os
from typing import List, Dict

class VectorStore:
    def __init__(self):
        self.persist_path = os.getenv("CHROMA_PERSIST_PATH", "./chroma_db")
        self.client = chromadb.PersistentClient(path=self.persist_path)
        self.collection_name = "document_chunks"
        self.collection = self.client.get_or_create_collection(name=self.collection_name)

    def add_chunks(self, chunks: List[Dict], embeddings: List[List[float]]):
        """
        Adds chunks and their embeddings to the vector database.
        """
        ids = [f"chunk_{i}_{doc['metadata']['source']}" for i, doc in enumerate(chunks)]
        texts = [chunk["text"] for chunk in chunks]
        metadatas = [chunk["metadata"] for chunk in chunks]
        
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

    def search(self, query_embedding: List[float], user_id: str, top_k: int = 5) -> Dict:
        """
        Searches the vector database for the most similar chunks.
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"user_id": user_id} if user_id else None
        )
        return results

    def delete_by_document_id(self, document_id: str, user_id: str):
        """
        Deletes all chunks associated with a specific document ID and user.
        """
        self.collection.delete(
            where={
                "$and": [
                    {"document_id": document_id},
                    {"user_id": user_id}
                ]
            }
        )

    def delete_by_filename(self, filename: str, user_id: str):
        """
        Keep as fallback, but prefer document_id.
        """
        self.collection.delete(
            where={
                "$and": [
                    {"source": filename},
                    {"user_id": user_id}
                ]
            }
        )

# Singleton instance
vector_store = VectorStore()
