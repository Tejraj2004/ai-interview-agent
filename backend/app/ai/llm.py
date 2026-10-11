
from langchain_groq import ChatGroq

from app.config import GROQ_API_KEY, GROQ_MODEL


if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY is missing from the .env file"
    )


llm = ChatGroq(
    model=GROQ_MODEL,
    api_key=GROQ_API_KEY,
    temperature=0.2,
    max_retries=2,
    timeout=60,
)
