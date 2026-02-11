"""
langgraph_builder.py
--------------------
Module for constructing and compiling a LangGraph pipeline to process
cleaned article text through multiple NLP tasks, with error handling
and retry logic.

Workflow:
    1. Parallel analysis: sentiment analysis and fact checking tool pipeline
       (extract_claims -> plan_searches -> execute_searches -> verify_facts)
    2. Generating a counter-perspective.
    3. Judging the quality of the generated perspective.
    4. Storing results and sending.
    5. Error handling at any step if failures occur.

Core Features:
    - Uses a TypedDict (`MyState`) to define the shape of the pipeline's
      state, ensuring structured data flow between nodes.
    - Employs conditional edges to handle branching:
        * Routes to error handler if a node signals `"status": "error"`.
        * Retries perspective generation up to 3 times if judged score
          is below 70.
        * Moves to storage once retries are exhausted or score passes
          the threshold.
    - Ensures the graph terminates only after successful storage.

Functions:
    build_langgraph() -> CompiledGraph
        Creates the StateGraph, adds processing nodes, defines
        transitions, and compiles the graph for execution.
"""


from typing import List, Any
from langgraph.graph import StateGraph
from typing_extensions import TypedDict

from app.modules.langgraph_nodes import (
    sentiment,
    generate_perspective,
    judge,
    store_and_send,
    error_handler,
)


class MyState(TypedDict):
    cleaned_text: str
    facts: list[dict]
    sentiment: str
    perspective: str
    score: int
    retries: int
    status: str
    claims: List[str]
    search_queries: List[Any]
    search_results: List[Any]


def build_langgraph():
    graph = StateGraph(MyState)

    # parallel analysis runs sentiment and fact_check tool pipeline in parallel
    graph.add_node("parallel_analysis", sentiment.run_parallel_analysis)

    graph.add_node("generate_perspective", generate_perspective.generate_perspective)
    graph.add_node("judge_perspective", judge.judge_perspective)
    graph.add_node("store_and_send", store_and_send.store_and_send)
    graph.add_node("error_handler", error_handler.error_handler)

    graph.set_entry_point("parallel_analysis")

    graph.add_conditional_edges(
        "parallel_analysis",
        lambda x: (
            "error_handler" if x.get("status") == "error" else "generate_perspective"
        ),
    )

    graph.add_conditional_edges(
        "generate_perspective",
        lambda x: (
            "error_handler" if x.get("status") == "error" else "judge_perspective"
        ),
    )

    graph.add_conditional_edges(
        "judge_perspective",
        lambda state: (
            "error_handler"
            if state.get("status") == "error"
            else (
                "store_and_send"
                if state.get("retries", 0) >= 3
                else "generate_perspective"
            )
            if state.get("score", 0) < 70
            else "store_and_send"
        ),
    )

    graph.add_conditional_edges(
        "store_and_send",
        lambda x: ("error_handler" if x.get("status") == "error" else "__end__"),
    )

    graph.set_finish_point("store_and_send")

    return graph.compile()
