from typing import List, Dict

class PromptBuilder:
    def build_rag_prompt(self, question: str, context_chunks: List[Dict]) -> str:
        """
        Constructs a prompt for Gemini that enforces grounded, systematic answering.
        """
        context_text = ""
        for i, chunk in enumerate(context_chunks):
            page = chunk['metadata'].get('page_number', 'N/A')
            source = chunk['metadata'].get('source', 'Unknown')
            # Formatting the context so the AI clearly sees the source/page mapping
            context_text += f"\n--- SOURCE {i+1} (File: {source}, Page: {page}) ---\n{chunk['text']}\n"

        prompt = f"""
You are SideQuest AI, an expert document analysis assistant. Your goal is to provide highly accurate, direct answers based on the provided documents.

STYLE GUIDELINES:
- **Direct & Concise:** Answer exactly what is asked. Provide NO extra information, NO filler text, and NO conversational pleasantries.
- **High Impact:** **Highlight the most important parts** of your answer using Markdown bolding to make it very clear to read.
- **Format:** Your entire response must be professional and straight to the point.

CRITICAL RULES:
1. ONLY use the provided context below. Do not use outside knowledge.
2. Provide the answer to the question first. At the very end of your response, and only at the end, append the exact citation in the format: [Page X].
3. If the user mentions multiple PDFs but some are missing from the context, explicitly state which ones were not found.
4. If the answer is not in the context, say "I cannot find this information in the provided document."

CONTEXT:
{context_text}

USER QUESTION:
{question}

ANSWER:
"""
        return prompt

# Singleton instance
prompt_builder = PromptBuilder()