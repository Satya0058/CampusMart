import os
import io
from typing import Union, Optional, List
from PIL import Image

from backend.app.services.ai.schemas import (
    SafetyAnalysisRequest,
    SafetyAnalysisResponse,
    DecisionType,
    DomainStatus,
    PolicyCategory,
    RiskLevel,
    PipelineStageInfo,
    ImageQualityResult,
    VisionDetectionResult,
    PolicyEvaluationResult,
    ConsistencyResult
)
from backend.app.services.ai.image_quality import ImageQualityAnalyzer
from backend.app.services.ai.object_detector import ObjectDetector
from backend.app.services.ai.policy_engine import CampusPolicyEngine
from backend.app.services.ai.consistency_checker import ConsistencyChecker

class SafetyService:
    """
    Orchestrates the 6-stage CampusMart AI Safety Intelligence pipeline:
    1. Image Validation
    2. Image Quality Analysis
    3. General Vision Understanding & Domain Classification
    4. Campus Policy Evaluation
    5. Multimodal Image/Text Consistency Verification
    6. Final Risk Synthesis
    """

    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit
    ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP"}

    @classmethod
    def analyze_listing(
        cls,
        image_input: Union[Image.Image, bytes, str],
        title: Optional[str] = "",
        description: Optional[str] = "",
        category: Optional[str] = ""
    ) -> SafetyAnalysisResponse:
        stages: List[PipelineStageInfo] = []

        try:
            # ─────────────────────────────────────────────────────────────
            # STAGE 1: IMAGE VALIDATION
            # ─────────────────────────────────────────────────────────────
            pil_img = None
            if isinstance(image_input, Image.Image):
                pil_img = image_input.convert("RGB")
            elif isinstance(image_input, str):
                if not os.path.exists(image_input):
                    return cls._create_review_response(
                        reason=f"Image file not found: {image_input}",
                        stages=[PipelineStageInfo(stage="image_validation", status="failed", message="Image file does not exist on server.")]
                    )
                file_size = os.path.getsize(image_input)
                if file_size > cls.MAX_FILE_SIZE_BYTES:
                    return cls._create_review_response(
                        reason="Image file exceeds 10MB limit.",
                        stages=[PipelineStageInfo(stage="image_validation", status="failed", message="File size too large.")]
                    )
                try:
                    raw_img = Image.open(image_input)
                    pil_img = raw_img.convert("RGB")
                except Exception as img_err:
                    return cls._create_review_response(
                        reason=f"Invalid or corrupted image format: {str(img_err)}",
                        stages=[PipelineStageInfo(stage="image_validation", status="failed", message="Corrupted image file.")]
                    )
            elif isinstance(image_input, bytes):
                if len(image_input) > cls.MAX_FILE_SIZE_BYTES:
                    return cls._create_review_response(
                        reason="Image file exceeds 10MB limit.",
                        stages=[PipelineStageInfo(stage="image_validation", status="failed", message="File size too large.")]
                    )
                try:
                    raw_img = Image.open(io.BytesIO(image_input))
                    pil_img = raw_img.convert("RGB")
                except Exception as img_err:
                    return cls._create_review_response(
                        reason=f"Invalid image bytes: {str(img_err)}",
                        stages=[PipelineStageInfo(stage="image_validation", status="failed", message="Cannot parse image bytes.")]
                    )
            else:
                return cls._create_review_response(
                    reason="Unsupported image payload format.",
                    stages=[PipelineStageInfo(stage="image_validation", status="failed", message="Unsupported payload.")]
                )

            stages.append(PipelineStageInfo(
                stage="image_validation",
                status="passed",
                message=f"Image verified ({pil_img.width}x{pil_img.height}px, RGB format)."
            ))

            # ─────────────────────────────────────────────────────────────
            # STAGE 2: IMAGE QUALITY ANALYSIS
            # ─────────────────────────────────────────────────────────────
            quality: ImageQualityResult = ImageQualityAnalyzer.analyze(pil_img)
            if not quality.is_acceptable:
                stages.append(PipelineStageInfo(
                    stage="image_quality",
                    status="failed",
                    message=quality.reason or "Image quality standard not met."
                ))
                return SafetyAnalysisResponse(
                    decision=DecisionType.REVIEW,
                    object_detected="Unclear / Blurry Image",
                    object_confidence=0.0,
                    domain_status=DomainStatus.UNKNOWN,
                    policy_category=PolicyCategory.UNKNOWN,
                    policy_confidence=0.0,
                    image_quality_score=quality.score,
                    consistency_score=0.0,
                    risk_level=RiskLevel.MEDIUM,
                    reason=f"Image quality check failed: {quality.reason}. Please upload a well-lit, sharply focused photo of your item.",
                    stages=stages
                )

            stages.append(PipelineStageInfo(
                stage="image_quality",
                status="passed",
                message=f"Image quality passed (Score: {quality.score:.2f}, Sharpness: {quality.blur_score:.1f})."
            ))

            # ─────────────────────────────────────────────────────────────
            # STAGE 3: GENERAL VISION UNDERSTANDING & DOMAIN CLASSIFICATION
            # ─────────────────────────────────────────────────────────────
            vision_res: VisionDetectionResult = ObjectDetector.detect(pil_img)

            # ─────────────────────────────────────────────────────────────
            # STAGE 3: ZERO-TOLERANCE CAMPUS POLICY EVALUATION
            # ─────────────────────────────────────────────────────────────
            policy_res: PolicyEvaluationResult = CampusPolicyEngine.evaluate(
                candidate_label=vision_res.primary_object,
                confidence=vision_res.confidence,
                secondary_candidates=vision_res.secondary_objects,
                title=title,
                category=category,
                description=description
            )

            # Strict Block on Prohibited Weapons / Pyrotechnics / Hazards
            if policy_res.category == PolicyCategory.PROHIBITED:
                stages.append(PipelineStageInfo(
                    stage="policy_check",
                    status="failed",
                    message=f"VIOLATION: {policy_res.reason}"
                ))
                return SafetyAnalysisResponse(
                    decision=DecisionType.BLOCK,
                    object_detected=vision_res.primary_object,
                    object_confidence=vision_res.confidence,
                    domain_status=vision_res.domain_status,
                    policy_category=PolicyCategory.PROHIBITED,
                    policy_confidence=0.95,
                    image_quality_score=quality.score,
                    consistency_score=0.0,
                    risk_level=RiskLevel.HIGH,
                    reason=policy_res.reason,
                    stages=stages
                )

            # Strict Block on Unsupported Food & Beverages
            if policy_res.category == PolicyCategory.UNSUPPORTED:
                stages.append(PipelineStageInfo(
                    stage="policy_check",
                    status="failed",
                    message=f"UNSUPPORTED: {policy_res.reason}"
                ))
                return SafetyAnalysisResponse(
                    decision=DecisionType.BLOCK,
                    object_detected=vision_res.primary_object,
                    object_confidence=vision_res.confidence,
                    domain_status=vision_res.domain_status,
                    policy_category=PolicyCategory.UNSUPPORTED,
                    policy_confidence=0.90,
                    image_quality_score=quality.score,
                    consistency_score=0.0,
                    risk_level=RiskLevel.HIGH,
                    reason=policy_res.reason,
                    stages=stages
                )

            # ─────────────────────────────────────────────────────────────
            # STAGE 4: DOMAIN CLASSIFICATION & CONFIDENCE CHECK
            # ─────────────────────────────────────────────────────────────
            # Check for OUT_OF_DOMAIN (digital graphics, landscapes, selfies, animals, vehicles)
            if vision_res.domain_status == DomainStatus.OUT_OF_DOMAIN:
                stages.append(PipelineStageInfo(
                    stage="domain_check",
                    status="failed",
                    message=vision_res.reason or "Image is out-of-domain (scenery, selfie, animal, or vehicle)."
                ))
                return SafetyAnalysisResponse(
                    decision=DecisionType.REVIEW,
                    object_detected=vision_res.primary_object,
                    object_confidence=vision_res.confidence,
                    domain_status=DomainStatus.OUT_OF_DOMAIN,
                    policy_category=PolicyCategory.UNKNOWN,
                    policy_confidence=0.0,
                    image_quality_score=quality.score,
                    consistency_score=0.0,
                    risk_level=RiskLevel.MEDIUM,
                    reason=f"Out-of-domain image detected: {vision_res.reason}. CampusMart listings must showcase an exchangeable student item.",
                    stages=stages
                )

            # Check for UNKNOWN or LOW_CONFIDENCE
            if vision_res.domain_status == DomainStatus.UNKNOWN or not vision_res.is_confident:
                stages.append(PipelineStageInfo(
                    stage="domain_check",
                    status="warning",
                    message=vision_res.reason or "Unrecognized or ambiguous item in image."
                ))
                return SafetyAnalysisResponse(
                    decision=DecisionType.REVIEW,
                    object_detected=vision_res.primary_object,
                    object_confidence=vision_res.confidence,
                    domain_status=DomainStatus.UNKNOWN,
                    policy_category=PolicyCategory.UNKNOWN,
                    policy_confidence=0.0,
                    image_quality_score=quality.score,
                    consistency_score=0.0,
                    risk_level=RiskLevel.MEDIUM,
                    reason=vision_res.reason or "The item could not be reliably identified. Submitted for manual student safety review.",
                    stages=stages
                )
            has_user_context = bool((title and title.strip()) or (category and category.strip() and category != "Others"))

            # Check if neither visual model nor user text matched an allowed category
            if policy_res.category == PolicyCategory.UNKNOWN:
                stages.append(PipelineStageInfo(
                    stage="domain_check",
                    status="warning",
                    message="Item details required to verify campus category."
                ))
                prompt_reason = (
                    "Physical item photo detected. Please enter the Item Name and select Category (e.g. Stationery, Fashion, Books) to complete verification."
                    if not has_user_context else
                    policy_res.reason
                )
                return SafetyAnalysisResponse(
                    decision=DecisionType.REVIEW,
                    object_detected=vision_res.primary_object,
                    object_confidence=vision_res.confidence,
                    domain_status=DomainStatus.IN_DOMAIN,
                    policy_category=PolicyCategory.UNKNOWN,
                    policy_confidence=0.50,
                    image_quality_score=quality.score,
                    consistency_score=0.50,
                    risk_level=RiskLevel.MEDIUM,
                    reason=prompt_reason,
                    stages=stages
                )

            display_object = (title.strip() if title and title.strip() else vision_res.primary_object)

            stages.append(PipelineStageInfo(
                stage="domain_check",
                status="passed",
                message=f"Verified campus physical item '{display_object}'."
            ))
            stages.append(PipelineStageInfo(
                stage="policy_check",
                status="passed",
                message=f"Item adheres to policy '{policy_res.policy_name}'."
            ))

            # ─────────────────────────────────────────────────────────────
            # STAGE 5: IMAGE/TEXT CONSISTENCY CHECK
            # ─────────────────────────────────────────────────────────────
            consistency: ConsistencyResult = ConsistencyChecker.check_consistency(
                vision_result=vision_res,
                policy_result=policy_res,
                title=title,
                description=description,
                category=category
            )

            if not consistency.is_consistent:
                stages.append(PipelineStageInfo(
                    stage="consistency_check",
                    status="failed",
                    message=consistency.mismatch_reason or "Discrepancy detected between image and title."
                ))
                return SafetyAnalysisResponse(
                    decision=DecisionType.REVIEW,
                    object_detected=display_object,
                    object_confidence=vision_res.confidence,
                    domain_status=DomainStatus.IN_DOMAIN,
                    policy_category=policy_res.category,
                    policy_confidence=0.85,
                    image_quality_score=quality.score,
                    consistency_score=consistency.score,
                    risk_level=RiskLevel.MEDIUM,
                    reason=consistency.mismatch_reason or "Listing title does not match uploaded item.",
                    stages=stages
                )

            stages.append(PipelineStageInfo(
                stage="consistency_check",
                status="passed",
                message="Listing text is consistent with the verified image."
            ))

            # ─────────────────────────────────────────────────────────────
            # STAGE 6: FINAL RISK SYNTHESIS -> APPROVE
            # ─────────────────────────────────────────────────────────────
            effective_conf = max(vision_res.confidence, 0.92 if has_user_context else vision_res.confidence)
            return SafetyAnalysisResponse(
                decision=DecisionType.APPROVE,
                object_detected=display_object,
                object_confidence=effective_conf,
                domain_status=DomainStatus.IN_DOMAIN,
                policy_category=PolicyCategory.ALLOWED,
                policy_confidence=0.95,
                image_quality_score=quality.score,
                consistency_score=consistency.score,
                risk_level=RiskLevel.LOW,
                reason=f"Verified: Uploaded item is an approved campus {category or 'student'} item ('{display_object}') with valid quality and details.",
                stages=stages
            )

        except Exception as exc:
            # Fallback to REVIEW on any unexpected error - NEVER approve on crash
            stages.append(PipelineStageInfo(
                stage="system_execution",
                status="failed",
                message=f"Pipeline error: {str(exc)}"
            ))
            return cls._create_review_response(
                reason="AI safety verification encountered an unexpected error. Submitted for manual student safety review.",
                stages=stages
            )

    @classmethod
    def _create_review_response(cls, reason: str, stages: List[PipelineStageInfo]) -> SafetyAnalysisResponse:
        return SafetyAnalysisResponse(
            decision=DecisionType.REVIEW,
            object_detected="Unverified Item",
            object_confidence=0.0,
            domain_status=DomainStatus.UNKNOWN,
            policy_category=PolicyCategory.UNKNOWN,
            policy_confidence=0.0,
            image_quality_score=0.0,
            consistency_score=0.0,
            risk_level=RiskLevel.MEDIUM,
            reason=reason,
            stages=stages
        )

