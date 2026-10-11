
import json

from app.ai.llm import llm


def evaluate_answer(
    question_text: str,
    answer_text: str,
) -> dict:
    prompt = f"""
You are an experienced technical interviewer.

Evaluate the candidate's answer to the interview question.

Question:
{question_text}

Candidate's answer:
{answer_text}

Score each category from 0 to 10:
- technical_score: technical depth and clarity
- communication_score: organization and clarity of explanation
- correctness_score: factual and conceptual correctness

Return ONLY a valid JSON object with exactly these fields:
{{
    "technical_score": 8,
    "communication_score": 7,
    "correctness_score": 9,
    "feedback": "Explain strengths, missing details, and improvements."
}}

Guidelines:
- Use numeric scores between 0 and 10.
- Evaluate the answer fairly based on the question.
- Do not award full marks if important details are missing.
- Give constructive, specific feedback.
- Do not include Markdown code fences.
"""

    response = llm.invoke(prompt)
    result = json.loads(response.content)

    required_fields = {
        "technical_score",
        "communication_score",
        "correctness_score",
        "feedback",
    }

    if not isinstance(result, dict):
        raise ValueError("AI response must be a JSON object")

    if not required_fields.issubset(result.keys()):
        raise ValueError("AI response is missing required fields")

    for field in (
        "technical_score",
        "communication_score",
        "correctness_score",
    ):
        score = result[field]

        if isinstance(score, bool) or not isinstance(score, (int, float)):
            raise ValueError(f"{field} must be a number")

        if not 0 <= score <= 10:
            raise ValueError(f"{field} must be between 0 and 10")

        result[field] = float(score)

    if not isinstance(result["feedback"], str):
        raise ValueError("Feedback must be text")

    return result
