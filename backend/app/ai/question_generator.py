
import json

from app.ai.llm import llm


def generate_interview_questions(
    job_title: str,
    job_description: str,
    job_analysis: dict,
    difficulty: str,
    number_of_questions: int = 10,
) -> list[dict]:
    prompt = f"""
You are an expert technical interviewer.

Generate exactly {number_of_questions} interview questions for this role.

Job title:
{job_title}

Job description:
{job_description}

AI job analysis:
{json.dumps(job_analysis, indent=2)}

Requested difficulty:
{difficulty}

Return ONLY a valid JSON array. Every array item must have:
- question_text: a clear interview question
- question_type: technical, conceptual, or problem_solving
- difficulty: easy, medium, or hard

Requirements:
1. Focus on skills and topics relevant to this job.
2. Avoid duplicate questions.
3. Use the requested difficulty as the target.
4. Make questions clear and suitable for an interview.
5. Do not include answers or explanations.
6. Do not wrap the JSON in Markdown code fences.

Example format:
[
    {{
        "question_text": "Explain the difference between an array and a linked list.",
        "question_type": "conceptual",
        "difficulty": "medium"
    }}
]
"""

    response = llm.invoke(prompt)
    questions = json.loads(response.content)

    if not isinstance(questions, list):
        raise ValueError("AI response must be a JSON array")

    if len(questions) != number_of_questions:
        raise ValueError(
            f"Expected {number_of_questions} questions, "
            f"but received {len(questions)}"
        )

    allowed_types = {"technical", "conceptual", "problem_solving"}
    allowed_difficulties = {"easy", "medium", "hard"}

    for question in questions:
        if not isinstance(question, dict):
            raise ValueError("Each question must be a JSON object")

        if not isinstance(question.get("question_text"), str):
            raise ValueError("Each question must have question_text")

        question["question_text"] = question["question_text"].strip()

        if not question["question_text"]:
            raise ValueError("Question text cannot be empty")

        if question.get("question_type") not in allowed_types:
            question["question_type"] = "technical"

        if question.get("difficulty") not in allowed_difficulties:
            question["difficulty"] = difficulty.lower()

    return questions
