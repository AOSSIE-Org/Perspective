from datetime import datetime, timedelta
from app.services.chat_service import create_chat_service
from typing import Dict, Tuple, Optional
from fastapi import HTTPException, Depends
from app.db.database import SessionLocal, get_db
from app.db.models import ChatSession, ChatMessage
from sqlalchemy.orm import Session

class ChatManager:
    def __init__(self):
        self.chat_services: Dict[str, Tuple[any, datetime]] = {}
        self.MAX_INACTIVE_TIME = timedelta(hours=24)
        self.MAX_SESSIONS = 1000

    def cleanup_old_sessions(self):
        """Remove chat sessions that haven't been accessed recently"""
        current_time = datetime.now()
        urls_to_remove = [
            url for url, (_, last_accessed) in self.chat_services.items()
            if current_time - last_accessed > self.MAX_INACTIVE_TIME
        ]
        for url in urls_to_remove:
            del self.chat_services[url]

    def initialize_chat(self, url: str, summary: str, perspective: str, machine_id: str) -> dict:
        """Initialize a new chat session"""
        self.cleanup_old_sessions()
        
        # Create database session
        db = SessionLocal()
        try:
            # Create new session
            new_session = ChatSession(
                url=url,
                summary=summary,
                perspective=perspective,
                machine_id=machine_id
            )
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
            session_id = new_session.id
            
            # Initialize chat service
            chat_service = create_chat_service(summary, perspective)
            self.chat_services[url] = (chat_service, datetime.now())
            
            return {"status": "initialized", "session_id": session_id}
            
        finally:
            db.close()

    def get_chat_response(self, url: str, question: str, thread_id: Optional[str] = None, machine_id: Optional[str] = None) -> dict:
        """Get response for a chat message"""
        self.cleanup_old_sessions()
        
        if url not in self.chat_services:
            raise HTTPException(status_code=404, detail="Chat session not found")
            
        db = SessionLocal()
        
        try:
            # Get session
            session = db.query(ChatSession).filter(
                ChatSession.url == url,
                ChatSession.machine_id == machine_id
            ).first()
            
            if not session:
                raise HTTPException(status_code=404, detail="Chat session not found")
            
            # Update last accessed time
            session.last_accessed = datetime.utcnow()
            
            # Store user message
            user_message = ChatMessage(
                session_id=session.id,
                thread_id=thread_id,
                is_ai=0,
                message=question
            )
            db.add(user_message)
            
            # Get AI response
            chat_service, _ = self.chat_services[url]
            response, thread_id = chat_service.generate_response(question, thread_id)
            
            # Store AI response
            ai_message = ChatMessage(
                session_id=session.id,
                thread_id=thread_id,
                is_ai=1,
                message=response.content
            )
            db.add(ai_message)
            
            db.commit()
            
            return {"response": response.content, "thread_id": thread_id}
            
        finally:
            db.close()
            
    def get_chat_history(self, url: str, machine_id: str) -> list:
        """Get chat history for a URL and machine ID"""
        db = SessionLocal()
        
        try:
            session = db.query(ChatSession).filter(
                ChatSession.machine_id == machine_id,
                ChatSession.url == url
            ).first()
            
            if not session:
                return []
                
            messages = db.query(ChatMessage).filter(
                ChatMessage.session_id == session.id
            ).order_by(ChatMessage.timestamp).all()
            
            return [
                {
                    "isAI": msg.is_ai == 1,
                    "message": msg.message,
                    "timestamp": msg.timestamp.isoformat()
                }
                for msg in messages
            ]
            
        finally:
            db.close()

# Create a singleton instance
chat_manager = ChatManager() 