from app.utils.fact_check_utils import run_fact_check_pipeline


def run_fact_check(state):
    try:
        text = state.get("cleaned_text")

        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        verifications, error_message = run_fact_check_pipeline(state)

        if error_message:
            print(f"some error occured in fact_checking:{error_message}")
            return {
                "status": "error",
                "error_from": "fact_checking",
                "message": f"{error_message}",
            }

    except Exception as e:
        print(f"some error occured in fact_checking:{e}")
        return {
            "status": "error",
            "error_from": "fact_checking",
            "message": f"{e}",
        }
    return {**state, "facts": verifications, "status": "success"}
