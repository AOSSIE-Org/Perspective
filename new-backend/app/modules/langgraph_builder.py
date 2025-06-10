from langgraph.graph import StateGraph
from app.modules.langgraph_nodes import (
    sentiment,
    fact_check,
    generate_perspective,
    judge,
    store_and_send
    )


def build_langgraph():
    """
    Constructs and compiles a state graph workflow for sequential text processing tasks.
    
    The workflow consists of sentiment analysis, fact checking, perspective generation, and judgment steps, with conditional reruns based on a score threshold. The process concludes by storing and sending the results. Returns the compiled graph ready for execution.
    """
    graph = StateGraph()

    graph.add_node(
                    "sentiment_analysis",
                    sentiment.run_sentiment
                    )
    graph.add_node(
                    "fact_checking",
                    fact_check.run_fact_check
                    )
    graph.add_node(
                    "generate_perspective",
                    generate_perspective.generate_perspective
                    )
    graph.add_node(
                    "judge_perspective",
                    judge.judge_perspective
                    )
    graph.add_node(
                    "store_and_send",
                    store_and_send.store_and_send
                    )

    graph.set_entry_point(
                    "sentiment_analysis"
                    )
    graph.add_edge(
                    "sentiment_analysis",
                    "fact_checking"
                    )
    graph.add_edge(
                    "fact_checking",
                    "generate_perspective"
                    )
    graph.add_edge(
                    "generate_perspective",
                    "judge_perspective"
                    )

    graph.add_conditional_edges(
        "judge_perspective",
        lambda state: "rerun" if state.get("score", 0) < 70 else "pass",
        {
            "rerun": "generate_perspective",
            "pass": "store_and_send"
        }
    )

    graph.set_finish_point("store_and_send")

    return graph.compile()
