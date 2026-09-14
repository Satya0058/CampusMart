import numpy as np
from PIL import Image
from typing import Tuple, Union
import io
from backend.app.services.ai.schemas import ImageQualityResult

class ImageQualityAnalyzer:
    """
    Evaluates physical image quality metrics without using mock data:
    - Blur / defocus detection via Laplacian variance
    - Luminance / exposure (underexposure / washed out)
    - Contrast via standard deviation
    - Minimum physical resolution check
    """

    MIN_DIMENSION: int = 200
    MIN_DIMENSION: int = 120
    MIN_AREA_PIXELS: int = 25000
    BLUR_THRESHOLD: float = 45.0       # Variance of Laplacian below this is blurry
    MIN_BRIGHTNESS: float = 25.0       # Mean luminance below this is too dark
    MAX_BRIGHTNESS: float = 242.0      # Mean luminance above this is overexposed/washed out
    MIN_CONTRAST: float = 15.0         # Standard deviation below this is low contrast/blank

    @classmethod
    def analyze(cls, image_input: Union[Image.Image, bytes, str]) -> ImageQualityResult:
        """
        Analyze image quality and return an ImageQualityResult.
        """
        try:
            if isinstance(image_input, Image.Image):
                img = image_input
            elif isinstance(image_input, bytes):
                img = Image.open(io.BytesIO(image_input))
            elif isinstance(image_input, str):
                img = Image.open(image_input)
            else:
                return ImageQualityResult(
                    score=0.0,
                    blur_score=0.0,
                    brightness_score=0.0,
                    contrast_score=0.0,
                    resolution_ok=False,
                    is_acceptable=False,
                    reason="Invalid image input format."
                )

            # Ensure RGB
            img = img.convert("RGB")
            width, height = img.size

            # Check resolution: allow portrait/landscape crops as long as min dimension >= 120 and area >= 25k px
            if min(width, height) < cls.MIN_DIMENSION or (width * height) < cls.MIN_AREA_PIXELS:
                return ImageQualityResult(
                    score=0.20,
                    blur_score=0.0,
                    brightness_score=0.0,
                    contrast_score=0.0,
                    resolution_ok=False,
                    is_acceptable=False,
                    reason=f"Resolution is too low ({width}x{height}px). Minimum required dimension is {cls.MIN_DIMENSION}px."
                )

            # Convert to grayscale array for analytical processing
            gray = img.convert("L")
            arr = np.array(gray, dtype=np.float32)

            # 1. Blur Detection using Laplacian Variance (discrete 4-neighbor difference)
            lap = arr[:-2, 1:-1] + arr[2:, 1:-1] + arr[1:-1, :-2] + arr[1:-1, 2:] - 4.0 * arr[1:-1, 1:-1]
            blur_var = float(np.var(lap))

            # 2. Exposure / Mean intensity [0, 255]
            mean_lum = float(np.mean(arr))

            # 3. Contrast / Standard deviation
            std_contrast = float(np.std(arr))

            # Evaluate issues
            is_blurry = blur_var < cls.BLUR_THRESHOLD
            is_underexposed = mean_lum < cls.MIN_BRIGHTNESS
            is_overexposed = mean_lum > cls.MAX_BRIGHTNESS
            is_low_contrast = std_contrast < cls.MIN_CONTRAST

            # Normalized component scores [0.0, 1.0]
            # Laplacian variance: 0 to 200+
            norm_sharpness = min(1.0, max(0.0, blur_var / 150.0))
            # Brightness: ideal around 128
            norm_brightness = 1.0 - min(1.0, abs(mean_lum - 128.0) / 128.0)
            # Contrast: ideal std >= 50
            norm_contrast = min(1.0, max(0.0, std_contrast / 50.0))

            composite_score = round(0.4 * norm_sharpness + 0.3 * norm_brightness + 0.3 * norm_contrast, 2)

            # Determine acceptance and failure reasons
            failure_reasons = []
            if is_blurry:
                failure_reasons.append(f"Image is too blurry (sharpness score {blur_var:.1f} < {cls.BLUR_THRESHOLD}).")
            if is_underexposed:
                failure_reasons.append(f"Image is severely underexposed/too dark (brightness {mean_lum:.1f}/255).")
            if is_overexposed:
                failure_reasons.append(f"Image is severely overexposed/washed out (brightness {mean_lum:.1f}/255).")
            if is_low_contrast:
                failure_reasons.append("Image lacks visual contrast or is a blank screen.")

            is_acceptable = len(failure_reasons) == 0
            if not is_acceptable:
                # Lower composite score if rejected
                composite_score = min(composite_score, 0.35)
                reason_str = " ".join(failure_reasons)
            else:
                reason_str = "Image clarity, lighting, and resolution meet campus listing standards."

            return ImageQualityResult(
                score=composite_score,
                blur_score=round(blur_var, 2),
                brightness_score=round(mean_lum, 2),
                contrast_score=round(std_contrast, 2),
                resolution_ok=True,
                is_acceptable=is_acceptable,
                reason=reason_str
            )

        except Exception as e:
            return ImageQualityResult(
                score=0.0,
                blur_score=0.0,
                brightness_score=0.0,
                contrast_score=0.0,
                resolution_ok=False,
                is_acceptable=False,
                reason=f"Failed to process image quality: {str(e)}"
            )

