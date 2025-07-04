# from app.utils.vector_store import save_to_vector_db
from app.modules.vector_store.chunk_rag_data import chunk_rag_data
from app.modules.vector_store.embed import embed_chunks

def store_and_send(state):
    # to store data in vector db
    try:
        print(state)
        try:
            chunks = chunk_rag_data(state)
        except KeyError as e:
            raise Exception(f"Missing required data field for chunking: {e}")
        except Exception as e:
            raise Exception(f"Failed to chunk data: {e}")
        try:
            vectors = embed_chunks(chunks)
            if vectors:
                print("embedding generated successfully!")
        except Exception as e:
            raise Exception(f"failed to embed chunks: {e}")
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
