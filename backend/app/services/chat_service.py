from langchain_core.vectorstores import InMemoryVectorStore
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import StateGraph, MessagesState
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
import os
from dotenv import load_dotenv
import numpy as np
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage
from langgraph.graph import END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
import uuid


# Load environment variables
load_dotenv()
openrouter_token = os.getenv("API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")

class ChatService:
    def __init__(self, content_summary: str, content_perspective: str):
        self.llm = ChatOpenAI(
            model="anthropic/claude-3-haiku",  # Free Claude 3 Haiku model on OpenRouter
            openai_api_key=openrouter_token,
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0.7
        )
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=openai_api_key,
            model="text-embedding-3-small"
        )
        self.vector_store = self._initialize_vector_store(content_summary, content_perspective)
        self.graph = self._build_graph()
        self.content_summary = content_summary
        self.content_perspective = content_perspective

    def _initialize_vector_store(self, content_summary: str, content_perspective: str):
        vector_store = InMemoryVectorStore(self.embeddings)
        custom_context = f"This is the summary of the article - {content_summary} and this is the opposite perspective for the article - {content_perspective}"
        docs = [Document(page_content=custom_context, metadata={"source": "custom_input"})]

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        all_splits = text_splitter.split_documents(docs)
        vector_store.add_documents(documents=all_splits)
        return vector_store

    def _build_graph(self):
        # Move all the graph building logic here
        graph_builder = StateGraph(MessagesState)

        @tool(response_format="content_and_artifact")
        def retrieve(query: str):
            """Retrieve information related to a query."""
            article_aware_query = f"{query} related to the article's content"
            retrieved_docs = self.vector_store.similarity_search(article_aware_query, k=2)
            serialized = "\n\n".join(
                (f"Source: {doc.metadata}\n" f"Content: {doc.page_content}")
                for doc in retrieved_docs
            )
            return serialized, retrieved_docs

        # Step 1: Generate an AIMessage that may include a tool-call to be sent.
        def query_or_respond(state: MessagesState):
            """Generate tool call for retrieval or respond."""
            llm_with_tools = self.llm.bind_tools([retrieve])
            response = llm_with_tools.invoke(state["messages"])
            # MessagesState appends messages to state instead of overwriting
            return {"messages": [response]}


        # Step 2: Execute the retrieval.
        tools = ToolNode([retrieve])


        # Step 3: Generate a response using the retrieved content.
        def generate(state: MessagesState):
            """Generate answer."""
            # Get generated ToolMessages
            recent_tool_messages = []
            for message in reversed(state["messages"]):
                if message.type == "tool":
                    recent_tool_messages.append(message)
                else:
                    break
            tool_messages = recent_tool_messages[::-1]

            # Format into prompt
            docs_content = "\n\n".join(doc.content for doc in tool_messages)
            system_message_content = (
                "You are an assistant for question-answering tasks. "
                f"When the user refers to 'the article', they are ALWAYS talking about the context passed below as the Retrieved Context. "
                "NEVER EVER EVER ask for clarification about which article the user is talking about or NEVER EVER tell the user to specify about the article, "
                "if you don't understand what article the user is referring to, always take in consideration the Retrieved Context and talk about it. "
                "talk about the main essence of the Retrieved Context.\n"
                "If the user asks what article are we talking about, always refer to the main point of the Retrieved Context."
                "If the question relates to the article's content, summary, or opposing perspective, "
                f"you MUST prioritize the Retrieved context given below, over other sources.\n"
                "Don't include the retrieved context reference in your response, just give the response as if the user already knows about what you're referring to."
                "If you don't know the answer, say that you don't know. "
                "Use three sentences maximum and keep the answer concise."
                "\n\n"
                f"Retrieved Context:\n{docs_content}"
            )
            conversation_messages = [
                message
                for message in state["messages"]
                if message.type in ("human", "system")
                or (message.type == "ai" and not message.tool_calls)
            ]
            prompt = [SystemMessage(system_message_content)] + conversation_messages 

            # Run
            response = self.llm.invoke(prompt)
            return {"messages": [response]}

        graph_builder.add_node(query_or_respond)
        graph_builder.add_node(tools)
        graph_builder.add_node(generate)

        graph_builder.set_entry_point("query_or_respond")
        graph_builder.add_conditional_edges(
            "query_or_respond",
            tools_condition,
            {END: END, "tools": "tools"},
        )
        graph_builder.add_edge("tools", "generate")
        graph_builder.add_edge("generate", END)


        memory = MemorySaver()
        return graph_builder.compile(checkpointer=memory)

    
    def generate_response(self, user_question: str, thread_id=None):
        # Use provided thread_id or create a new one if this is a new conversation
        if thread_id is None:
            thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}
        
        result = self.graph.invoke(
            {"messages": [{"role": "user", "content": user_question}]},
            config=config,
        )
        # Return both the response and the thread_id
        return result["messages"][-1], thread_id

# Usage example:
def create_chat_service(content_summary: str, content_perspective: str) -> ChatService:
    return ChatService(content_summary, content_perspective)
