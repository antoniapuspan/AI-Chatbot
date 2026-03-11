from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI


SYSTEM_PROMPT = (
    "You are an internal corporate IT helpdesk assistant.\n"
    "You must generate:\n"
    "1. Clear step-by-step troubleshooting instructions.\n"
    "2. Whether the issue should be escalated to Level 2 or Level 3 support.\n"
    "3. A confidence score (0-100).\n\n"
    "Return JSON ONLY in this format:\n"
    "{\n"
    '  "steps": ["Step 1", "Step 2", "Step 3"],\n'
    '  "escalate": true/false,\n'
    '  "level": "L1 | L2 | L3",\n'
    '  "confidence": number\n'
    "}"
)

LOG_FILE = Path(__file__).resolve().parent.parent / "logs.txt"


class SolveRequest(BaseModel):
    issue_type: str = Field(..., min_length=1)
    answers: dict[str, Any]


class SolveResponse(BaseModel):
    steps: list[str]
    escalate: bool
    level: str
    confidence: int


app = FastAPI(title="Internal IT Helpdesk AI Assistant", version="1.0.0")

# Allow frontend on local files or localhost ports during MVP development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set.")
    return OpenAI(api_key=api_key)


def _normalize_response(raw: dict[str, Any]) -> SolveResponse:
    steps = raw.get("steps", [])
    if not isinstance(steps, list):
        steps = ["Collect more details and retry troubleshooting."]

    cleaned_steps = [str(step) for step in steps if str(step).strip()]
    if not cleaned_steps:
        cleaned_steps = ["Collect more details and retry troubleshooting."]

    escalate = bool(raw.get("escalate", False))
    level = str(raw.get("level", "L1")).upper()
    if level not in {"L1", "L2", "L3"}:
        level = "L1"

    try:
        confidence = int(raw.get("confidence", 0))
    except (TypeError, ValueError):
        confidence = 0
    confidence = max(0, min(100, confidence))

    # Safety rule: low confidence must be escalated.
    if confidence < 70:
        escalate = True
        if level == "L1":
            level = "L2"

    return SolveResponse(
        steps=cleaned_steps,
        escalate=escalate,
        level=level,
        confidence=confidence,
    )


def _log_interaction(
    issue_type: str,
    answers: dict[str, Any],
    ai_response: SolveResponse,
) -> None:
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "issue_type": issue_type,
        "answers": answers,
        "ai_response": ai_response.model_dump(),
        "confidence": ai_response.confidence,
        "escalation": ai_response.escalate,
    }
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")


@app.post("/solve", response_model=SolveResponse)
def solve_issue(payload: SolveRequest) -> SolveResponse:
    client = _get_openai_client()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    user_content = json.dumps(
        {
            "issue_type": payload.issue_type,
            "answers": payload.answers,
        }
    )

    try:
        completion = client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.2,
        )
        content = completion.choices[0].message.content or "{}"
        raw_response = json.loads(content)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate solution: {exc}",
        ) from exc

    final_response = _normalize_response(raw_response)
    _log_interaction(payload.issue_type, payload.answers, final_response)
    return final_response
