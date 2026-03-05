from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict
import os

class Chunker:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = int(os.getenv("CHUNK_SIZE", chunk_size))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", chunk_overlap))
        
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            is_separator_regex=False,
        )

    def split_documents(self, documents: List[Dict]) -> List[Dict]:
        """
        Splits parsed document pages into smaller chunks while preserving metadata.
        """
        chunks = []
        for doc in documents:
            text_chunks = self.splitter.split_text(doc["text"])
            for i, chunk_text in enumerate(text_chunks):
                chunks.append({
                    "text": chunk_text,
                    "metadata": {
                        **doc["metadata"],
                        "chunk_index": i
                    }
                })
        return chunks

# Singleton instance
chunker = Chunker()
