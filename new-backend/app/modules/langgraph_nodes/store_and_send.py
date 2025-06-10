from utils.vector_store import save_to_vector_db


def store_and_send(state):
    # to store data in vector db
    save_to_vector_db({
        "text": state["text"],
        "perspective": state["perspective"],
        "facts": state["facts"]
    })
    #  sending to frontend
    return {"status": "success"}
