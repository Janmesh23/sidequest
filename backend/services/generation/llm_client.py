import os
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from dotenv import load_dotenv

load_dotenv()

class LLMClient:
    def __init__(self):
        self.api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        self.model_name = os.getenv("LLM_MODEL", "meta-llama/Llama-3.1-8B-Instruct")
        
        if not self.api_token:
            print("WARNING: HUGGINGFACEHUB_API_TOKEN not found in environment variables. HuggingFace Hub may look for it globally.")

        self.llm = HuggingFaceEndpoint(
            repo_id=self.model_name,
            task="text-generation",
            max_new_tokens=512,
            temperature=0.7,
            top_p=0.9,
            top_k=50,
            repetition_penalty=1.1,
            do_sample=True,
            huggingfacehub_api_token=self.api_token,
        )  
        self.client = ChatHuggingFace(llm=self.llm)

    async def generate_answer(self, prompt: str) -> str:
        """
        Generates a response from the Hugging Face model based on the provided prompt.
        """
        response = await self.client.ainvoke(prompt)
        content = response.content
        
        # Handle cases where content is a list of structured chunks
        if isinstance(content, list):
            text_parts = []
            for part in content:
                if isinstance(part, str):
                    text_parts.append(part)
                elif isinstance(part, dict) and 'text' in part:
                    text_parts.append(part['text'])
            return "".join(text_parts)
            
        return str(content)

# Singleton instance
llm_client = LLMClient()
