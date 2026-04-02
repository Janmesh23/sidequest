import os
import time
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from dotenv import load_dotenv

load_dotenv()

class Embedder:
    def __init__(self):
        self.api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        # Ensure we use an embedding model string for huggingface
        self.model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        
        if not self.api_token:
            print("WARNING: HUGGINGFACEHUB_API_TOKEN not found in environment variables. HuggingFace Hub may look for it globally.")
            
        self.embeddings = HuggingFaceEndpointEmbeddings(
            model=self.model_name,
            huggingfacehub_api_token=self.api_token
        )

    def embed_text(self, text: str) -> list[float]:
        """
        Generates an embedding for a piece of text.
        """
        return self.embeddings.embed_query(text)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """
        Generates embeddings for a list of document chunks using batching to avoid rate limits.
        """
        batch_size = 20  # Batch size for api limits
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            print(f"Embedding batch {i//batch_size + 1} of {(len(texts)-1)//batch_size + 1}...")
            
            try:
                embeddings = self.embeddings.embed_documents(batch)
                all_embeddings.extend(embeddings)
            except Exception as e:
                print("Rate limit or Error hit! Waiting 10s before retry...", e)
                time.sleep(10)
                embeddings = self.embeddings.embed_documents(batch)
                all_embeddings.extend(embeddings)
            
            if i + batch_size < len(texts):
                print("Rate limit breather (2s)...")
                time.sleep(2)
                
        return all_embeddings

# Singleton instance
embedder = Embedder()
