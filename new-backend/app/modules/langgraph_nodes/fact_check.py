from app.modules.pipeline import run_fact_check_pipeline


def run_fact_check(state):
    try:
        text = state.get("cleaned_text")

        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        verifications = run_fact_check_pipeline(state)
    except Exception as e:
        print(f"some error occured in fact_checking:{e}")
        return {
            "status": "error",
            "error_from": "fact_checking",
            "message": f"{e}",
            }
    return {
        **state,
        "facts": verifications,
        "status": "success"
        }
