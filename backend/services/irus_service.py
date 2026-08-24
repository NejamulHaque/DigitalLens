import httpx
import os

class IrusAIService:
    def __init__(self):
        self.base_url = os.getenv("IRUS_AI_BASE_URL", "https://irus-ai.onrender.com")
        self.api_key = os.getenv("IRUS_AI_API_KEY")
    
    async def chat(self, message: str, context: str = None, conversation_id: str = None):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "message": message,
                    "context": context,
                    "conversation_id": conversation_id
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def search(self, query: str):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/search",
                json={"query": query},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def generate_image(self, prompt: str):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/image",
                json={"prompt": prompt},
                timeout=60.0
            )
            response.raise_for_status()
            return response.json()

irus_service = IrusAIService()