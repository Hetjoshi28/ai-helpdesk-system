import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print("Initializing client...")
client = genai.Client(api_key=GEMINI_API_KEY)

print("Sending request...")
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Respond with a quick hello.',
)
print("Response:", response.text)
print("Done!")
