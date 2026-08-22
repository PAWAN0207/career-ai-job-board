from app.services.gemini import generate_response


prompt = "Explain what a Data Scientist does in one simple sentence."


response = generate_response(prompt)


print("\nGemini Response:")
print(response)