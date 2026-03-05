import fitz  # PyMuPDF
import os
from typing import List, Dict

class DocumentParser:
    def parse_pdf(self, file_path: str) -> List[Dict]:
        """
        Parses a PDF file and extracts text with page numbers.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        doc = fitz.open(file_path)
        extracted_data = []
        
        for page_num, page in enumerate(doc):
            text = page.get_text()
            extracted_data.append({
                "text": text,
                "metadata": {
                    "page_number": page_num + 1,
                    "source": os.path.basename(file_path)
                }
            })
            
        doc.close()
        return extracted_data

    def parse_file(self, file_path: str) -> List[Dict]:
        """
        Generic parse method that routes to specific parsers based on extension.
        """
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return self.parse_pdf(file_path)
        elif ext == ".txt":
            # Simple text parser
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            return [{"text": text, "metadata": {"page_number": 1, "source": os.path.basename(file_path)}}]
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

# Singleton instance
parser = DocumentParser()
