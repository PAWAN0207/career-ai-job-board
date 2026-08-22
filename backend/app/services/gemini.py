from google import genai
from dotenv import load_dotenv
import os


# Load environment variables
load_dotenv()


# Get Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not set in the environment."
    )


# Create Gemini client
client = genai.Client(
    api_key=GEMINI_API_KEY
)


def generate_response(prompt: str) -> str:
    """
    Generate a text response using Gemini.
    """

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    if not response.text:
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    return response.text.strip()