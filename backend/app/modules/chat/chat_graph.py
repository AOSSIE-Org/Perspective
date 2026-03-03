"""
chat_graph.py
-------------
LangGraph-based conversational agent with persistent memory.
"""

from typing import Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import SystemMessage, HumanMessage
from typing_extensions import TypedDict
from app.llm_config import get_llm
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


class ChatState(TypedDict):
    messages: Annotated[list, add_messages]


_memory = MemorySaver()


def _chatbot_node(state: ChatState, config: dict):
    provider = config.get("configurable", {}).get("provider", "groq")
    llm = get_llm(provider=provider, temperature=0.7)
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


_graph = StateGraph(ChatState)
_graph.add_node("chatbot", _chatbot_node)
_graph.add_edge(START, "chatbot")
_graph.add_edge("chatbot", END)
chat_app = _graph.compile(checkpointer=_memory)


async def initialize_chat_thread(thread_id: str, analysis_result: dict) -> None:
    perspective_obj = analysis_result.get("perspective", {})
    if hasattr(perspective_obj, "model_dump"):
        p = perspective_obj.model_dump()
    elif hasattr(perspective_obj, "dict"):
        p = perspective_obj.dict()
    elif isinstance(perspective_obj, dict):
        p = perspective_obj
    else:
        p = {"perspective": str(perspective_obj)}

    facts = analysis_result.get("facts", [])
    facts_text = "\n".join(
        f"- {f.get('claim', 'N/A')}: {f.get('status', '?')} -- {f.get('reason', '')}"
        for f in facts
    ) or "No facts were verified."

    citations = analysis_result.get("web_search_citations", [])
    citations_text = "\n".join(
        f"- {c.get('title', 'Untitled')} ({c.get('url', '')})"
        for c in citations
    ) or "No citations available."

    summary = analysis_result.get("article_summary", "No summary available.")
    sentiment = analysis_result.get("sentiment", "unknown")
    perspective_text = p.get("perspective", "")

    system_content = (
        "You are an AI assistant helping the user understand and discuss a "
        "news article that has been analyzed. Here is the full analysis:\n\n"
        f"**Article Summary:**\n{summary}\n\n"
        f"**Detected Sentiment:** {sentiment}\n\n"
        f"**Counter-Perspective:**\n{perspective_text}\n\n"
        f"**Fact-Check Results:**\n{facts_text}\n\n"
        f"**Web Search Citations:**\n{citations_text}\n\n"
        "Guidelines:\n"
        "- Answer questions using this context.\n"
        "- Be balanced and cite facts when relevant.\n"
        "- Be transparent if something is not covered.\n"
        "- Keep responses concise but thorough."
    )

    config = {"configurable": {"thread_id": thread_id, "provider": "groq"}}
    await chat_app.ainvoke(
        {"messages": [SystemMessage(content=system_content)]}, config=config
    )
    logger.info(f"Chat thread {thread_id} initialised with article context.")


async def send_chat_message(
    thread_id: str, message: str, provider: str = "groq"
) -> str:
    config = {"configurable": {"thread_id": thread_id, "provider": provider}}
    result = await chat_app.ainvoke(
        {"messages": [HumanMessage(content=message)]}, config=config
    )
    ai_msg = result["messages"][-1]
    return ai_msg.content if hasattr(ai_msg, "content") else str(ai_msg)