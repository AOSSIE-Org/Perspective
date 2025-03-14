
import json
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from dotenv import load_dotenv
import os

# Import our custom free LLM
from app.services.chat_deepseek import ChatDeepseek
# Import our Tavily helper (if you want to use it when available)
from app.services.tavily_helper import tavily_search

load_dotenv()
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")


class State(TypedDict):
    article_text: str
    resources: list
    reliability: dict


graph_builder = StateGraph(State)

def collect_resources(state: State) -> State:
    """
    Node 1: Call the Tavily API via our helper to gather external resources.
    If Tavily returns an error (e.g. query too long), set resources to an empty list.
    """
    query = state["article_text"]
 
    if len(query) > 400:
        query = query[:400]
    

    search_results = tavily_search(query, TAVILY_API_KEY, max_results=5)
    
    resources = []
    if not search_results or "HTTPError" in search_results or "RequestException" in search_results:
        print(f"Error in search results: {search_results}")
        resources = []
    else:
        try:
         
            if isinstance(search_results, str):
                search_results = json.loads(search_results)

            resources = search_results.get("results", [])
            if not isinstance(resources, list):
                print(f"Unexpected 'results' type: {type(resources)}")
                resources = []
        except Exception as e:
            print(f"Error parsing Tavily response: {e}")
            resources = []
    state["resources"] = resources
    return state



llm = ChatDeepseek(model="deepseek/deepseek-r1-zero:free")

def compare_article(state: State) -> State:
    article = state["article_text"]
    resources = state.get("resources", [])
    
    prompt = (
        "You are an expert fact-checking assistant. "
        "Evaluate the reliability of the following article by comparing its content to the external resources provided. "
        "Output ONLY a valid JSON object with two keys: 'true_percentage' and 'fake_percentage'. "
        "These keys should have integer values between 0 and 100 that sum up to 100, reflecting the article's reliability "
        "(a higher true_percentage indicates more reliability). "
        "Do not include any explanations or additional text before or after the JSON. "
        "Just return the raw JSON object.\n\n"
        "Article text:\n" + article + "\n\n"
    )
    
    if resources and len(resources) > 0:
        prompt += "External resources:\n" + json.dumps(resources, indent=2) + "\n\n"
    else:
        prompt += "No external resources available; base your evaluation solely on the article text.\n\n"
    
    prompt += "Example output format: {\"true_percentage\": 75, \"fake_percentage\": 25}\n"
    prompt += "Remember: Provide ONLY the JSON object, nothing else."
    
    # Invoke the LLM with the prompt.
    response = llm.invoke([
        {"role": "system", "content": "You are an expert fact-checker who responds only with JSON."},
        {"role": "user", "content": prompt}
    ])
    print(response)
    
   
    try:
        
        reliability = json.loads(response)
    except json.JSONDecodeError:
        try:
          
            import re
            json_pattern = r'\{.*?\}'
            match = re.search(json_pattern, response, re.DOTALL)
            
            if match:
                json_str = match.group(0)
                reliability = json.loads(json_str)
            else:
                
                print(f"No JSON pattern found in response: {response}")
                reliability = {"true_percentage": 50, "fake_percentage": 50}
        except Exception as e:
            print(f"Error extracting JSON: {e}, response: {response}")
            reliability = {"true_percentage": 50, "fake_percentage": 50}
    
   
    if "true_percentage" not in reliability or "fake_percentage" not in reliability:
        print(f"Missing required keys in reliability object: {reliability}")
        reliability = {"true_percentage": 50, "fake_percentage": 50}
    
 
    try:
        reliability["true_percentage"] = int(reliability["true_percentage"])
        reliability["fake_percentage"] = int(reliability["fake_percentage"])
    except (ValueError, TypeError):
        print(f"Error converting reliability values to integers: {reliability}")
        reliability = {"true_percentage": 50, "fake_percentage": 50}
    
    state["reliability"] = reliability
    return state





graph_builder.add_node("collect_resources", collect_resources)
graph_builder.add_node("compare_article", compare_article)

graph_builder.add_edge(START, "collect_resources")
graph_builder.add_edge("collect_resources", "compare_article")
graph_builder.add_edge("compare_article", END)


memory = MemorySaver()
graph = graph_builder.compile(checkpointer=memory)

def run_fact_check(article_text: str) -> State:
    """
    Executes the LangGraph pipeline:
      1. Collects external resources.
      2. Compares the article with these resources (or uses training data if none).
      3. Returns a reliability metric as a JSON object.
    """
    initial_state: State = {
        "article_text": article_text,
        "resources": [],
        "reliability": {}
    }
    config = {"configurable": {"thread_id": "default"}}
    final_state = graph.invoke(initial_state, config)
    print("end")
    return final_state
