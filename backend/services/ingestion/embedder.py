import os
import time
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

class Embedder:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
            
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=self.model_name,
            google_api_key=self.api_key
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
        batch_size = 20  # More conservative batch size for strict free tier quotas
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            print(f"Embedding batch {i//batch_size + 1} of {(len(texts)-1)//batch_size + 1}...")
            
            try:
                embeddings = self.embeddings.embed_documents(batch)
                all_embeddings.extend(embeddings)
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    print("Rate limit hit! Waiting 30s before retry...")
                    time.sleep(30)
                    embeddings = self.embeddings.embed_documents(batch)
                    all_embeddings.extend(embeddings)
                else:
                    raise e
            
            # Use a longer breather to stay well within the RPM limits
            if i + batch_size < len(texts):
                print("Rate limit breather (6s)...")
                time.sleep(6)
                
        return all_embeddings

# Singleton instance
embedder = Embedder()
