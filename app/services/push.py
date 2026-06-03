import logging
from typing import Optional, Dict, Any
import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(token: Optional[str], title: str, body: str, data: Dict[str, Any] = None) -> bool:
    """Send a single push notification via Expo's push service."""
    if not token:
        return False
    payload = {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default",
        "priority": "high",
        "data": data or {},
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                EXPO_PUSH_URL,
                json=payload,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
            )
        if resp.status_code == 200:
            result = resp.json()
            status = result.get("data", {}).get("status")
            if status == "error":
                logger.warning("Expo push error for token %s: %s", token[:12], result["data"].get("message"))
                return False
            logger.info("Push sent to %s", token[:12])
            return True
        logger.warning("Expo push HTTP %s: %s", resp.status_code, resp.text[:200])
        return False
    except Exception as e:
        logger.error("Push send failed: %s", e)
        return False
