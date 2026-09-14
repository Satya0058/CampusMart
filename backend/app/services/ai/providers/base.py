from abc import ABC, abstractmethod
from typing import Union
from PIL import Image
from backend.app.services.ai.schemas import VisionDetectionResult

class BaseVisionProvider(ABC):
    """
    Standard abstract base class for computer vision providers.
    Every vision provider must return a standardized VisionDetectionResult
    with explicit domain_status (IN_DOMAIN, OUT_OF_DOMAIN, UNKNOWN),
    confidence score, and candidate objects.
    """

    @abstractmethod
    def detect(self, image_input: Union[Image.Image, bytes, str]) -> VisionDetectionResult:
        """
        Analyze an image and return detected objects, confidence, entropy, and domain status.
        """
        pass

