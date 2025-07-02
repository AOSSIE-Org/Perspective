# from app.utils.vector_store import save_to_vector_db
from app.modules.vector_store.chunk_rag_data import chunk_rag_data


def store_and_send(state):
    # to store data in vector db
    try:
        print(state)
        chunks = chunk_rag_data(state)
        # save_to_vector_db({
        #     **state
        # })
    except Exception as e:
        print(f"some error occured in store_and_send:{e}")
        return {
            "status": "error",
            "error_from": "store_and_send",
            "message": f"{e}",
        }
    #  sending to frontend
    return {
        **state,
        "status": "success"
        }
