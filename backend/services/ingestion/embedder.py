import os
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()

class Embedder:
    def __init__(self):
        # We use a fast, lightweight local model that runs entirely on the host
        self.model_name = os.getenv("HF_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
            
        self.embeddings = HuggingFaceEmbeddings(
            model_name=self.model_name
        )

    def embed_text(self, text: str) -> list[float]:
        """
        Generates an embedding for a piece of text locally.
        """
        return self.embeddings.embed_query(text)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """
        Generates embeddings for a list of document chunks.
        Since we are using local embeddings, we don't need artificial rate limiting.
        """
        # We can just process them locally without fear of API quotas
        all_embeddings = self.embeddings.embed_documents(texts)
        return all_embeddings

# Singleton instance
embedder = Embedder()
