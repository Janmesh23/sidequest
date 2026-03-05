import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

class LLMClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("LLM_MODEL", "gemini-1.5-flash")
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
            
        self.client = ChatGoogleGenerativeAI(
            model=self.model_name,
            google_api_key=self.api_key,
            temperature=0,
            convert_system_message_to_human=True
        )

    async def generate_answer(self, prompt: str) -> str:
        """
        Generates a response from the Gemini model based on the provided prompt.
        """
        response = await self.client.ainvoke(prompt)
        content = response.content
        
        # Handle cases where content is a list of structured chunks (common in newer LangChain/Gemini versions)
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
