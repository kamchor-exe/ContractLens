import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import anthropic
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMProvider(ABC):
    """Abstract base class for LLM providers in ContractLens."""

    @abstractmethod
    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format_json: bool = True
    ) -> str:
        """Execute completion and return text response."""
        pass

class ClaudeProvider(LLMProvider):
    """Anthropic Claude LLM provider implementation."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        if self.api_key and self.api_key != "your_anthropic_api_key_here":
            self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
        else:
            self.client = None

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format_json: bool = True
    ) -> str:
        if not self.client:
            raise ValueError(
                "ANTHROPIC_API_KEY is not configured. Please set a valid Anthropic API key in backend/.env"
            )

        messages = [{"role": "user", "content": user_prompt}]
        
        # Use Claude 3.5 Sonnet model
        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            temperature=0.1,
            system=system_prompt,
            messages=messages
        )

        content_block = response.content[0]
        if hasattr(content_block, "text"):
            return content_block.text
        return str(content_block)

class LocalProvider(LLMProvider):
    """Stubbed interface for local LLM models (for post-MVP evaluation)."""

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format_json: bool = True
    ) -> str:
        raise NotImplementedError(
            "LocalProvider interface is stubbed for post-MVP model evaluation. "
            "Set LLM_PROVIDER=claude in backend/.env to use CloudProvider."
        )

class LLMService:
    """Service wrapper for selecting and calling configured LLMProvider."""

    def __init__(self):
        provider_name = settings.LLM_PROVIDER.lower()
        if provider_name == "local":
            self.provider = LocalProvider()
        else:
            self.provider = ClaudeProvider()

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        return await self.provider.complete(system_prompt, user_prompt)

llm_service = LLMService()
