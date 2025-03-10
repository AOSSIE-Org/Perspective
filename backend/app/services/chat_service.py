from langchain_core.vectorstores import InMemoryVectorStore
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from huggingface_hub import InferenceClient
import bs4
from langchain import hub
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph, MessagesState
from typing_extensions import List, TypedDict
from langchain_openai import OpenAIEmbeddings
from langchain.chat_models import init_chat_model
import langchain
import requests
import os
import json
from dotenv import load_dotenv
import numpy as np
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage
from langgraph.graph import END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver

# Load environment variables
load_dotenv()
openrouter_token = os.getenv("API_KEY")
hf_token = os.getenv("HF_TOKEN")
# OpenRouter API call function


def generate_chat_response(content_summary, content_perspective, user_question):
    llm = init_chat_model("gpt-4o-mini", model_provider="openai")


    embeddings = HuggingFaceEndpointEmbeddings(
        repo_id="sentence-transformers/all-MiniLM-L6-v2",
        huggingfacehub_api_token=hf_token,
        task="feature-extraction"
    )
    print("embeddings\n\n", embeddings)
    vector_store = InMemoryVectorStore(embeddings)

    custom_context = f"{content_summary} {content_perspective}"
    docs = [Document(page_content=custom_context,
                    metadata={"source": "custom_input"})]

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200)
    all_splits = text_splitter.split_documents(docs)

    # Index chunks
    _ = vector_store.add_documents(documents=all_splits)

    # Define prompt for question-answering
    prompt = hub.pull("rlm/rag-prompt")

    # Compile application and test
    graph_builder = StateGraph(MessagesState)

    @tool(response_format="content_and_artifact")
    def retrieve(query: str):
        """Retrieve information related to a query."""
        retrieved_docs = vector_store.similarity_search(query, k=2)
        serialized = "\n\n".join(
            (f"Source: {doc.metadata}\n" f"Content: {doc.page_content}")
            for doc in retrieved_docs
        )
        return serialized, retrieved_docs

    # Step 1: Generate an AIMessage that may include a tool-call to be sent.
    def query_or_respond(state: MessagesState):
        """Generate tool call for retrieval or respond."""
        llm_with_tools = llm.bind_tools([retrieve])
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
            "Use the following pieces of retrieved context to answer "
            "the question. If you don't know the answer, say that you "
            "don't know. Use three sentences maximum and keep the "
            "answer concise."
            "\n\n"
            f"{docs_content}"
        )
        conversation_messages = [
            message
            for message in state["messages"]
            if message.type in ("human", "system")
            or (message.type == "ai" and not message.tool_calls)
        ]
        prompt = [SystemMessage(system_message_content)] + conversation_messages

        # Run
        response = llm.invoke(prompt)
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
    graph = graph_builder.compile(checkpointer=memory)

    # Specify an ID for the thread
    config = {"configurable": {"thread_id": "abc123"}}

    input_message = user_question

    # Get the final result instead of streaming each step
    result = graph.invoke(
        {"messages": [{"role": "user", "content": input_message}]},
        config=config,
    )
    # Print only the final message
    result["messages"][-1].pretty_print()

class ChatService:
    def __init__(self, content_summary: str, content_perspective: str):
        self.llm = init_chat_model("gpt-4o-mini", model_provider="openai")
        self.embeddings = HuggingFaceEndpointEmbeddings(
            repo_id="sentence-transformers/all-MiniLM-L6-v2",
            huggingfacehub_api_token=hf_token,
            task="feature-extraction"
        )
        self.vector_store = self._initialize_vector_store(content_summary, content_perspective)
        self.graph = self._build_graph()

    def _initialize_vector_store(self, content_summary: str, content_perspective: str):
        vector_store = InMemoryVectorStore(self.embeddings)
        custom_context = f"{content_summary} {content_perspective}"
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
            retrieved_docs = self.vector_store.similarity_search(query, k=2)
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
                "Use the following pieces of retrieved context to answer "
                "the question. If you don't know the answer, say that you "
                "don't know. Use three sentences maximum and keep the "
                "answer concise."
                "\n\n"
                f"{docs_content}"
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

    def generate_response(self, user_question: str):
        config = {"configurable": {"thread_id": "abc123"}}
        result = self.graph.invoke(
            {"messages": [{"role": "user", "content": user_question}]},
            config=config,
        )
        return result["messages"][-1]

# Usage example:
def create_chat_service(content_summary: str, content_perspective: str) -> ChatService:
    return ChatService(content_summary, content_perspective)
