from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String(255), index=True)
    url = Column(String(1000))
    summary = Column(Text)
    perspective = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with messages
    messages = relationship("ChatMessage", back_populates="session")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    thread_id = Column(String(255), index=True)
    is_ai = Column(Integer, default=0)  # 0 for user, 1 for AI
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with session
    session = relationship("ChatSession", back_populates="messages")
