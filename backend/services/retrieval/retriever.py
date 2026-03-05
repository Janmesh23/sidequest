from services.retrieval.vector_store import vector_store
from services.ingestion.embedder import embedder
from typing import List, Dict

class Retriever:
    def retrieve(self, query: str, user_id: str, top_k: int = 5) -> List[Dict]:
        """
        Orchestrates the retrieval process: embed query -> search vector DB -> format results.
        """
        # 1. Embed the query
        query_embedding = embedder.embed_text(query)
        
        # 2. Search the vector store
        results = vector_store.search(query_embedding, user_id=user_id, top_k=top_k)
        
        # 3. Format the results
        formatted_results = []
        if results['documents']:
            for i in range(len(results['documents'][0])):
                formatted_results.append({
                    "text": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "id": results['ids'][0][i],
                    "distance": results['distances'][0][i] if 'distances' in results else None
                })
        
        return formatted_results

# Singleton instance
retriever = Retriever()
