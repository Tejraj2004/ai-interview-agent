
import json

from app.ai.llm import llm


def generate_report_feedback(
    interview_title: str,
    answer_summaries: list[dict],
) -> dict:
    prompt = f"""
You are an expert technical interviewer preparing a final interview report.

Job role:
{interview_title}

Candidate answer evaluations:
{json.dumps(answer_summaries, indent=2)}

Analyze the candidate's performance across all the answers.

Return ONLY a valid JSON object with exactly these fields:
{{
    "strengths": "Summarize the candidate's demonstrated strengths.",
    "weaknesses": "Summarize the candidate's knowledge gaps.",
    "recommendations": "Give specific, actionable improvement steps."
}}

Guidelines:
- Base your conclusions only on the supplied questions, answers, and scores.
- Identify recurring patterns rather than overreacting to one answer.
- Be constructive and specific.
- Do not invent skills or experience.
- Do not include Markdown code fences.
"""

    response = llm.invoke(prompt)
    result = json.loads(response.content)

    required_fields = {
        "strengths",
        "weaknesses",
        "recommendations",
    }

    if not isinstance(result, dict):
        raise ValueError("AI report must be a JSON object")

    if not required_fields.issubset(result.keys()):
        raise ValueError("AI report is missing required fields")

    for field in required_fields:
        if not isinstance(result[field], str) or not result[field].strip():
            raise ValueError(f"{field} must contain non-empty text")

    return result
