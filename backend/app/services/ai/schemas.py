from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DecisionType(str, Enum):
    APPROVE = "APPROVE"
    REVIEW = "REVIEW"
    BLOCK = "BLOCK"
    PENDING = "PENDING"

class DomainStatus(str, Enum):
    IN_DOMAIN = "IN_DOMAIN"
    OUT_OF_DOMAIN = "OUT_OF_DOMAIN"
    UNKNOWN = "UNKNOWN"

class PolicyCategory(str, Enum):
    ALLOWED = "ALLOWED"
    UNSUPPORTED = "UNSUPPORTED"
    PROHIBITED = "PROHIBITED"
    UNKNOWN = "UNKNOWN"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class ImageValidationResult(BaseModel):
    is_valid: bool = True
    mime_type: Optional[str] = None
    width: int = 0
    height: int = 0
    file_size_bytes: int = 0
    error_message: Optional[str] = None

class ImageQualityResult(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    blur_score: float = 0.0 # higher means sharper
    brightness_score: float = 0.0 # 0 to 255 mean intensity
    contrast_score: float = 0.0 # standard deviation
    resolution_ok: bool = True
    is_acceptable: bool = True
    reason: Optional[str] = None

class VisionCandidate(BaseModel):
    label: str
    confidence: float
    category_hint: Optional[str] = None

class VisionDetectionResult(BaseModel):
    primary_object: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    domain_status: DomainStatus
    secondary_objects: List[VisionCandidate] = []
    raw_label: Optional[str] = None
    entropy: Optional[float] = None
    is_confident: bool = True
    reason: Optional[str] = None

class PolicyEvaluationResult(BaseModel):
    category: PolicyCategory
    policy_name: str
    is_allowed: bool
    risk_level: RiskLevel
    reason: str
    violation_code: Optional[str] = None

class ConsistencyResult(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    is_consistent: bool = True
    matched_terms: List[str] = []
    mismatch_reason: Optional[str] = None

class PipelineStageInfo(BaseModel):
    stage: str
    status: str # "passed", "warning", "failed"
    message: str

class SafetyAnalysisRequest(BaseModel):
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    title: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = ""

class SafetyAnalysisResponse(BaseModel):
    decision: DecisionType
    object_detected: str
    object_confidence: float
    domain_status: DomainStatus
    policy_category: PolicyCategory
    policy_confidence: float
    image_quality_score: float
    consistency_score: float
    risk_level: RiskLevel
    reason: str
    stages: List[PipelineStageInfo] = []
    metadata: Dict[str, Any] = {}

