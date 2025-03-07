from langchain_core.vectorstores import InMemoryVectorStore
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from huggingface_hub import InferenceClient
import bs4
from langchain import hub
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph
from typing_extensions import List, TypedDict
from langchain_openai import OpenAIEmbeddings
from langchain.chat_models import init_chat_model
import langchain
import requests
import os
import json
from dotenv import load_dotenv
import numpy as np

# Load environment variables
load_dotenv()
openrouter_token = os.getenv("API_KEY")
hf_token = os.getenv("HF_TOKEN")
# OpenRouter API call function


def generate_with_openrouter(messages, context=None):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {openrouter_token}",
        "Content-Type": "application/json"
    }

    # Convert LangChain messages to OpenRouter format
    openrouter_messages = []
    if context:
        openrouter_messages.append({"role": "system", "content": context})

    for msg in messages.messages:
        role = "user" if msg.type == "human" else "assistant"
        openrouter_messages.append({"role": role, "content": msg.content})

    payload = {
        "model": "openai/gpt-3.5-turbo",  # Can change to any OpenRouter model
        "messages": openrouter_messages
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))

    if response.status_code != 200:
        raise Exception(f"OpenRouter Error: {
                        response.status_code} - {response.text}")

    return response.json()["choices"][0]["message"]["content"]


embeddings = HuggingFaceEndpointEmbeddings(
    repo_id="sentence-transformers/all-MiniLM-L6-v2",
    huggingfacehub_api_token=hf_token,
    task="feature-extraction"
)
print("embeddings\n\n", embeddings)
vector_store = InMemoryVectorStore(embeddings)

custom_context = """
Task decomposition is a technique where complex tasks are broken down into simpler subtasks.
This approach helps AI systems handle complicated problems more effectively by dividing them
into manageable components. For example, planning a trip might involve subtasks like booking
flights, reserving hotels, and creating an itinerary.
"""
docs = [Document(page_content=custom_context,
                 metadata={"source": "custom_input"})]

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, chunk_overlap=200)
all_splits = text_splitter.split_documents(docs)

# Index chunks
_ = vector_store.add_documents(documents=all_splits)

# Define prompt for question-answering
prompt = hub.pull("rlm/rag-prompt")


# Define state for application
class State(TypedDict):
    question: str
    context: List[Document]
    answer: str


# Define application steps
def retrieve(state: State):
    retrieved_docs = vector_store.similarity_search(state["question"])
    return {"context": retrieved_docs}


def generate(state: State):
    docs_content = "\n\n".join(doc.page_content for doc in state["context"])
    messages = prompt.invoke(
        {"question": state["question"], "context": docs_content})
    response = generate_with_openrouter(messages, context=docs_content)
    return {"answer": response}


# Compile application and test
graph_builder = StateGraph(State).add_sequence([retrieve, generate])
graph_builder.add_edge(START, "retrieve")
graph = graph_builder.compile()

response = graph.invoke({"question": "What is Task Decomposition?"})
print(response["answer"])
