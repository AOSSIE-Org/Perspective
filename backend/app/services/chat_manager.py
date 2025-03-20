from datetime import datetime, timedelta
from app.services.chat_service import create_chat_service
from typing import Dict, Tuple, Optional
from fastapi import HTTPException

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

    def initialize_chat(self, url: str, summary: str, perspective: str) -> dict:
        """Initialize a new chat session"""
        self.cleanup_old_sessions()

        # If max sessions reached, remove oldest session
        if len(self.chat_services) >= self.MAX_SESSIONS:
            oldest_url = min(self.chat_services.items(), key=lambda x: x[1][1])[0]
            del self.chat_services[oldest_url]

        chat_service = create_chat_service(summary, perspective)
        self.chat_services[url] = (chat_service, datetime.now())
        return {"status": "initialized"}

    def get_chat_response(self, url: str, question: str) -> dict:
        """Get response for a chat message"""
        self.cleanup_old_sessions()

        if url not in self.chat_services:
            raise HTTPException(status_code=404, detail="Chat session not found")

        chat_service, _ = self.chat_services[url]
        # Update last accessed time
        self.chat_services[url] = (chat_service, datetime.now())

        response, thread_id = chat_service.generate_response(question)
        return {"response": response, "thread_id": thread_id}

# Create a singleton instance
chat_manager = ChatManager() 