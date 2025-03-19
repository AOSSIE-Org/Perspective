// components/ChatMessage.tsx
import React from 'react';

interface ChatMessageProps {
  isAI: boolean;
  message: string;
  blogsammary: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ isAI, message }) => {
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        className={`max-w-[85%] rounded-lg p-4 ${
          isAI ? 'bg-gray-100 text-gray-800' : 'bg-indigo-600 text-white'
        }`}
      >
        <p className="text-base leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
