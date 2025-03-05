


import os
import sys
import json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ai_service import AIService

def test_opposite_perspective():
    api_key = os.environ.get('HF_API_KEY', None)  # set this as an environment variable
    ai_service = AIService(api_key=api_key)
    
    print("=" * 80)
    print("OPPOSITE PERSPECTIVE GENERATOR")
    print("=" * 80)
    print("Enter or paste the article text (press Enter twice when done):")
    
    lines = []
    while True:
        line = input()
        if not line:
            break
        lines.append(line)
    
    article_text = "\n".join(lines)
    
    print("\nGenerating comprehensive opposite perspective...\n")
    # Get the opposite perspective (as a dictionary)
    result = ai_service.get_opposite_perspective(article_text)
    
    print("\n" + "=" * 80)
    print("ANALYSIS RESULTS")
    print("=" * 80)
    
    if "error" in result:
        print(f"Error: {result['error']}")
        if "raw_response" in result:
            print("\nRaw response:")
            print(result["raw_response"])
        return
    
    # Convert the dictionary result to a formatted string with double curly braces.
    formatted_result = ai_service.format_result(result)
    
    print(formatted_result)
    
    # Optionally, you could also save the formatted result as a file.
    save = input("\nWould you like to save the results to a file? (y/n): ")
    if save.lower() == 'y':
        filename = input("Enter filename (default: perspective_analysis.json): ") or "perspective_analysis.json"
        with open(filename, 'w') as f:
            # Save the formatted string output.
            f.write(formatted_result)
        print(f"Results saved to {filename}")

if __name__ == "__main__":
    test_opposite_perspective()