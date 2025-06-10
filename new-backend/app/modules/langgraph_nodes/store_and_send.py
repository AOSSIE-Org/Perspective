from utils.vector_store import save_to_vector_db


def store_and_send(state):
    # to store data in vector db
    """
    Stores selected data from the input state in a vector database and returns a success status.
    
    Extracts the "text", "perspective", and "facts" fields from the provided state dictionary, stores them in a vector database, and returns a dictionary indicating successful completion.
    """
    save_to_vector_db({
        "text": state["text"],
        "perspective": state["perspective"],
        "facts": state["facts"]
    })
    #  sending to frontend
    return {"status": "success"}
