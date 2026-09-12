import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")

llm = ChatGroq(
    model="openai/gpt-oss-20b",
    api_key=groq_api_key,
    temperature=0
)


def test_groq():
    response = llm.invoke("Say hello in one short sentence.")
    return response.content