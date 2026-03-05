from sqlalchemy import Column, String, Integer, DateTime, JSON
from .database import Base
import datetime
import uuid

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, nullable=False, default="user_1") # Default for legacy docs
    filename = Column(String)
    status = Column(String) # e.g., uploaded, parsing, chunking, embedding, indexing, ready, failed
    total_chunks = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    metadata_json = Column(JSON, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "status": self.status,
            "total_chunks": self.total_chunks,
            "created_at": self.created_at.isoformat(),
            "metadata": self.metadata_json
        }
