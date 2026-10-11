
import json

from app.ai.llm import llm


def analyze_job_description(job_title: str, job_description: str) -> dict:
    prompt = f"""
You are an expert technical recruiter and interview planner.

Analyze the following job description.

Job title:
{job_title}

Job description:
{job_description}

Return ONLY a valid JSON object with these fields:
{{
    "job_role": "The main role",
    "seniority_level": "Entry-level, Mid-level, or Senior-level",
    "required_skills": ["skill 1", "skill 2"],
    "important_topics": ["topic 1", "topic 2"],
    "interview_focus": ["focus area 1", "focus area 2"],
    "difficulty_level": "Easy, Medium, or Hard"
}}

Use the job description as the source of truth. Do not invent company-specific requirements.
Do not include Markdown code fences.
"""

    response = llm.invoke(prompt)
    result = json.loads(response.content)

    return result
