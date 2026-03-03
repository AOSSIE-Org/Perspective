import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/config";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useChat(threadId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const sendMessage = useCallback(
    async (text: string, provider: string = "groq") => {
      if (!threadId || !text.trim()) return;

      const userMsg: ChatMessage = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);

      try {
        const res = await fetch(`${API_BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            thread_id: threadId,
            provider,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.error) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: `⚠️ ${data.error}` },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: data.answer },
            ]);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Something went wrong. Please try again." },
          ]);
        }
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Network error. Please check your connection." },
        ]);
      } finally {
        setSending(false);
      }
    },
    [threadId],
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, sendMessage, sending, clearMessages };
}