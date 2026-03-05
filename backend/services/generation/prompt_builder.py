from typing import List, Dict

class PromptBuilder:
    def build_rag_prompt(self, question: str, context_chunks: List[Dict]) -> str:
        """
        Constructs a prompt for Gemini that enforces grounded answering and citations.
        """
        context_text = ""
        for i, chunk in enumerate(context_chunks):
            page = chunk['metadata'].get('page_number', 'N/A')
            source = chunk['metadata'].get('source', 'Unknown')
            context_text += f"\n[SOURCE {i+1} | Page {page} | File: {source}]\n{chunk['text']}\n"

        prompt = f"""
You are SideQuest AI, a premium document analysis assistant. Your goal is to provide deep, narrative-style insights based on the provided documents.

STYLE GUIDELINES:
- **Tone:** Professional, sophisticated, yet conversational. Sound like a mentor or an industry analyst.
- **Narrative over Bullets:** Weave the information into clear, flowing paragraphs instead of dry lists.
- **High Impact:** Highlight key achievements, numbers, and dates where relevant.
- **Natural Citations:** Include [Page X] citations naturally at the end of relevant sentences.

CRITICAL RULES:
1. ONLY use the provided context below. Do not use outside knowledge.
2. For every claim you make, cite the source using the format: [Page X].
3. If the answer is not in the context, say "I cannot find this information in the provided document."

CONTEXT:
{context_text}

USER QUESTION:
{question}

NARRATIVE ANSWER:
"""
        return prompt

# Singleton instance
prompt_builder = PromptBuilder()
