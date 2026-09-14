import os
import io
import json
import logging
from typing import Union, Optional, List
from PIL import Image
from dotenv import load_dotenv

# Automatically load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".env"))

from backend.app.services.ai.providers.base import BaseVisionProvider
from backend.app.services.ai.schemas import (
    VisionDetectionResult,
    VisionCandidate,
    DomainStatus
)

logger = logging.getLogger("CampusMart.AI.Gemini")

# Prioritized list of resilient, high-quota Gemini models
CANDIDATE_MODELS = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.7-flash",
    "gemini-3.6-flash"
]

class GeminiVisionProvider(BaseVisionProvider):
    """
    Multimodal provider utilizing the official Google GenAI SDK (google-genai).
    Features automatic fallback across high-capacity Flash models (gemini-flash-latest,
    gemini-3.5-flash, gemini-3.1-flash-lite) to prevent 429 quota exhaustion.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.preferred_model = model or os.getenv("GEMINI_MODEL")
        self.client = None

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("GeminiVisionProvider initialized successfully with GenAI client.")
            except Exception as e:
                logger.warning("Failed to initialize google-genai client: %s", str(e))
                self.client = None
        else:
            logger.info("GEMINI_API_KEY is not set. GeminiVisionProvider running in unconfigured mode.")

    def is_available(self) -> bool:
        """Returns True if the provider is fully configured with an API key and client."""
        if not self.api_key:
            self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if self.api_key:
                try:
                    from google import genai
                    self.client = genai.Client(api_key=self.api_key)
                except Exception:
                    self.client = None
        return bool(self.api_key and self.client)

    def _get_models_to_try(self) -> List[str]:
        models = []
        if self.preferred_model:
            models.append(self.preferred_model)
        for m in CANDIDATE_MODELS:
            if m not in models:
                models.append(m)
        return models

    def detect(self, image_input: Union[Image.Image, bytes, str]) -> VisionDetectionResult:
        """
        Analyze an image with Gemini Vision and return a standardized VisionDetectionResult.
        Resiliently attempts fallback models upon rate limit / 429 errors.
        """
        if not self.is_available():
            return VisionDetectionResult(
                primary_object="Unverified Item",
                confidence=0.0,
                domain_status=DomainStatus.UNKNOWN,
                is_confident=False,
                reason="GEMINI_API_KEY is not configured on the server. Submitted for manual student review."
            )

        try:
            # 1. Standardize and prepare image
            if isinstance(image_input, Image.Image):
                pil_img = image_input.convert("RGB")
            elif isinstance(image_input, bytes):
                raw_img = Image.open(io.BytesIO(image_input))
                pil_img = raw_img.convert("RGB")
            elif isinstance(image_input, str):
                if not os.path.exists(image_input):
                    return VisionDetectionResult(
                        primary_object="Unknown Object",
                        confidence=0.0,
                        domain_status=DomainStatus.UNKNOWN,
                        is_confident=False,
                        reason=f"Image file not found: {image_input}"
                    )
                raw_img = Image.open(image_input)
                pil_img = raw_img.convert("RGB")
            else:
                raise ValueError(f"Unsupported image input type: {type(image_input)}")

            # Resize to optimize upload latency and prevent quota exhaustion
            max_dimension = 1200
            if pil_img.width > max_dimension or pil_img.height > max_dimension:
                pil_img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

            img_bytes_io = io.BytesIO()
            pil_img.save(img_bytes_io, format="JPEG", quality=85)
            img_bytes = img_bytes_io.getvalue()

            # 2. Build structured prompt
            prompt = """
You are the visual safety and object recognition AI for CampusMart, a college student peer-to-peer marketplace.
Students buy, sell, rent, and exchange academic materials, electronics, stationery, cycles, lab gear, and personal student goods.

Analyze the uploaded image and classify it strictly according to these criteria:

1. primary_object: Concise, specific name of the primary item depicted in the image.
   Examples: "Scientific Calculator", "Drafting Scale", "Engineering Drafter", "Ballpoint Pens Box", "Bicycle", "Sneakers", "T-Shirt", "Physics Textbook", "Laptop", "Backpack", "Burger", "Pocket Knife", "Digital Graphic / Logo", "Person / Selfie", "Landscape / Scenery".

2. domain_status:
   - "IN_DOMAIN": Physical items exchangeable or usable by college students. This includes books, notes, stationery, drawing & drafting instruments, calculators, laptops, electronic peripherals, bicycles, lab equipment, sports gear, musical instruments, bags, and fashion/clothing.
   - "OUT_OF_DOMAIN": Images that are NOT exchangeable physical student items, including landscapes, scenery, selfies, human faces/portraits, animals/pets, digital screenshots, app icons, company logos, and motor cars/automobiles.
   - "UNKNOWN": Highly blurry, dark, ambiguous, or unrecognizable images.

3. policy_category:
   - "ALLOWED": Standard harmless student goods (stationery, drafting tools, books, electronics, bicycles, fashion, sports gear, accessories).
   - "UNSUPPORTED": Food, prepared meals, snacks, beverages, medicines, live animals, commercial services.
   - "PROHIBITED": Weapons, firearms, knives, blades, explosives, fireworks, vaping/tobacco items, narcotics, hazardous chemicals.
   - "UNKNOWN": Ambiguous, unfamiliar, or out-of-domain images.

4. confidence: Floating point number from 0.0 to 1.0 indicating confidence in the primary object identification.

5. reason: A concise factual sentence explaining what was identified and why.

Return ONLY a valid JSON object matching this schema:
{
  "primary_object": "string",
  "domain_status": "IN_DOMAIN" | "OUT_OF_DOMAIN" | "UNKNOWN",
  "policy_category": "ALLOWED" | "UNSUPPORTED" | "PROHIBITED" | "UNKNOWN",
  "confidence": float,
  "reason": "string"
}
"""

            from google.genai import types

            image_part = types.Part.from_bytes(
                data=img_bytes,
                mime_type="image/jpeg"
            )

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )

            # 3. Model execution with automatic fallback
            last_error = None
            models_to_try = self._get_models_to_try()

            for model_name in models_to_try:
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=[image_part, prompt],
                        config=config
                    )

                    response_text = (response.text or "").strip()
                    if response_text.startswith("```json"):
                        response_text = response_text[7:]
                    if response_text.endswith("```"):
                        response_text = response_text[:-3]
                    response_text = response_text.strip()

                    parsed_data = json.loads(response_text)

                    # 4. Map to domain schema
                    raw_domain = str(parsed_data.get("domain_status", "")).upper()
                    if "IN_DOMAIN" in raw_domain:
                        domain_status = DomainStatus.IN_DOMAIN
                    elif "OUT_OF_DOMAIN" in raw_domain:
                        domain_status = DomainStatus.OUT_OF_DOMAIN
                    else:
                        domain_status = DomainStatus.UNKNOWN

                    confidence = float(parsed_data.get("confidence", 0.90))
                    confidence = max(0.0, min(1.0, confidence))
                    is_confident = (confidence >= 0.50 and domain_status != DomainStatus.UNKNOWN)

                    primary_object = str(parsed_data.get("primary_object", "Campus Item")).strip()
                    reason = str(parsed_data.get("reason", "Analyzed via Google Gemini Vision.")).strip()

                    logger.info("Gemini detection succeeded using model '%s': %s", model_name, primary_object)

                    return VisionDetectionResult(
                        primary_object=primary_object,
                        confidence=confidence,
                        domain_status=domain_status,
                        is_confident=is_confident,
                        reason=reason
                    )

                except Exception as model_err:
                    err_str = str(model_err)
                    last_error = model_err
                    # If quota exhausted (429), model unavailable (503), or not found (404), fall back to next model
                    if any(code in err_str for code in ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE", "404", "NOT_FOUND"]):
                        logger.warning("Gemini model '%s' unavailable/quota hit. Trying next fallback model...", model_name)
                        continue
                    else:
                        logger.error("Gemini model '%s' error: %s", model_name, err_str)
                        break

            # If all models failed or were rate-limited, provide a clean friendly reason
            friendly_reason = "AI vision service is temporarily busy. Please enter your item details to complete review."
            if last_error:
                err_text = str(last_error)
                if "429" in err_text or "RESOURCE_EXHAUSTED" in err_text:
                    friendly_reason = "Gemini API rate limit reached. Please wait a moment or enter item details below for review."
                elif "503" in err_text:
                    friendly_reason = "Google AI service temporarily unavailable. Please retry shortly."

            return VisionDetectionResult(
                primary_object="Unverified Item",
                confidence=0.0,
                domain_status=DomainStatus.UNKNOWN,
                is_confident=False,
                reason=friendly_reason
            )

        except Exception as e:
            logger.error("Gemini Vision detection exception: %s", str(e), exc_info=True)
            return VisionDetectionResult(
                primary_object="Unverified Item",
                confidence=0.0,
                domain_status=DomainStatus.UNKNOWN,
                is_confident=False,
                reason="AI vision scan error. Please upload a clear photo or enter item details."
            )
