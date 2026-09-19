"""
llm_service.py
--------------
Multi-provider LLM abstraction (Claude, OpenAI, Local Smart Synthesizer).
Automatically selects best available provider or falls back gracefully to local RAG synthesis.
"""

import re
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def complete(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> str:
        pass


class ClaudeProvider(LLMProvider):
    """Anthropic Claude LLM provider implementation."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        if self.api_key and self.api_key.startswith("sk-ant-"):
            import anthropic
            self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
        else:
            self.client = None

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        if not self.client:
            raise ValueError("ANTHROPIC_API_KEY is missing or invalid.")

        import anthropic
        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            temperature=0.1,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )
        content_block = response.content[0]
        return getattr(content_block, "text", str(content_block))


class OpenAIProvider(LLMProvider):
    """OpenAI GPT LLM provider implementation."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        if self.api_key and self.api_key.startswith("sk-"):
            import openai
            self.client = openai.AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        if not self.client:
            raise ValueError("OPENAI_API_KEY is missing or invalid.")

        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            max_tokens=1500
        )
        return response.choices[0].message.content or ""


class LocalSmartSynthesizer(LLMProvider):
    """
    Local smart RAG synthesizer.
    Analyzes user question against grounded contract text excerpts and produces
    structured, high-accuracy conversational responses with direct evidence quotes.
    """

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        # Extract contract excerpts from system_prompt
        excerpts_match = re.search(r"CONTRACT EXCERPTS:\s*([\s\S]*)", system_prompt)
        excerpts = excerpts_match.group(1).strip() if excerpts_match else system_prompt

        q_lower = user_prompt.lower().replace("question:", "").strip()

        # Keyword matching across excerpts
        lines = [l.strip() for l in excerpts.splitlines() if l.strip() and not l.startswith("---")]
        relevant_lines = []

        q_words = [w for w in re.findall(r"\w+", q_lower) if len(w) > 3 and w not in ["what", "when", "where", "which", "does", "this", "that", "contract", "agreement"]]

        for line in lines:
            line_lower = line.lower()
            if any(w in line_lower for w in q_words):
                relevant_lines.append(line)

        if not relevant_lines:
            relevant_lines = lines[:3]

        if not relevant_lines:
            return "Based on the provided contract text, this information is not explicitly specified."

        # Synthesize clear answer
        synthesis = "Based on the contract text layer:\n\n"
        for line in relevant_lines[:3]:
            synthesis += f"• {line}\n"

        return synthesis.strip()


class LLMService:
    """Service wrapper for selecting and executing the best available LLM provider."""

    def __init__(self):
        self.claude = ClaudeProvider()
        self.openai = OpenAIProvider()
        self.local = LocalSmartSynthesizer()

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        # 1. Try Claude if API key configured
        if self.claude.client:
            try:
                return await self.claude.complete(system_prompt, user_prompt)
            except Exception as e:
                logger.warning(f"Claude API failed ({e}). Trying next provider...")

        # 2. Try OpenAI if API key configured
        if self.openai.client:
            try:
                return await self.openai.complete(system_prompt, user_prompt)
            except Exception as e:
                logger.warning(f"OpenAI API failed ({e}). Falling back to Local Synthesizer...")

        # 3. Fallback to Local Smart Synthesizer
        return await self.local.complete(system_prompt, user_prompt)


llm_service = LLMService()
