from typing import Union
from PIL import Image
from backend.app.services.ai.providers.gemini_provider import GeminiVisionProvider
from backend.app.services.ai.schemas import VisionDetectionResult, DomainStatus

class ObjectDetector:
    """
    Facade for object detection directly utilizing GeminiVisionProvider.
    Ensures safe error handling routing unidentifiable or failed detections to REVIEW.
    """

    _provider = None

    @classmethod
    def get_provider(cls):
        if cls._provider is None:
            cls._provider = GeminiVisionProvider()
        return cls._provider

    @classmethod
    def set_provider(cls, provider):
        """Allows injecting mock or alternative providers for unit testing."""
        cls._provider = provider

    @classmethod
    def detect(cls, image_input: Union[Image.Image, bytes, str]) -> VisionDetectionResult:
        try:
            return cls.get_provider().detect(image_input)
        except Exception as e:
            return VisionDetectionResult(
                primary_object="Unknown Object",
                confidence=0.0,
                domain_status=DomainStatus.UNKNOWN,
                is_confident=False,
                reason=f"Detection failure: {str(e)}"
            )
