def error_handler(input):
    print("Error detected!")
    print(f"From: {input.get('error_from')}")
    print(f"Message: {input.get('message')}")

    return {
        "status": "stopped_due_to_error",
        "from": [input.get("error_from")],
        "error": [input.get("message")],
    }
