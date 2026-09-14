import os
import sys
import unittest
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.services.ai import (
    SafetyService,
    ImageQualityAnalyzer,
    CampusPolicyEngine,
    ConsistencyChecker,
    DecisionType,
    DomainStatus,
    PolicyCategory,
    RiskLevel,
    VisionDetectionResult,
    VisionCandidate
)

class TestCampusMartAISafety(unittest.TestCase):
    """
    Comprehensive verification suite for CampusMart AI Safety Intelligence.
    Ensures non-closed-set classification, strict review routing,
    decoupled policy evaluation, multimodal consistency, and backend safeguards.
    """

    @classmethod
    def setUpClass(cls):
        cls.test_dir = os.path.join(PROJECT_ROOT, "backend", "tests", "test_images")
        os.makedirs(cls.test_dir, exist_ok=True)

        # 1. High quality sharp checkerboard image
        cls.sharp_img_path = os.path.join(cls.test_dir, "sharp_sample.png")
        img = Image.new("RGB", (400, 400), (240, 240, 240))
        draw = ImageDraw.Draw(img)
        for i in range(0, 400, 40):
            for j in range(0, 400, 40):
                if (i // 40 + j // 40) % 2 == 0:
                    draw.rectangle([i, j, i + 40, j + 40], fill=(20, 20, 20))
        img.save(cls.sharp_img_path)

        # 2. Severely blurry image
        cls.blurry_img_path = os.path.join(cls.test_dir, "blurry_sample.png")
        blurry_img = img.filter(ImageFilter.GaussianBlur(25))
        blurry_img.save(cls.blurry_img_path)

        # 3. Severely underexposed/dark image
        cls.dark_img_path = os.path.join(cls.test_dir, "dark_sample.png")
        dark_img = Image.new("RGB", (300, 300), (10, 10, 10))
        dark_img.save(cls.dark_img_path)

        # 4. Low resolution image
        cls.low_res_img_path = os.path.join(cls.test_dir, "low_res_sample.png")
        low_res = Image.new("RGB", (100, 100), (180, 180, 180))
        low_res.save(cls.low_res_img_path)

    # ─────────────────────────────────────────────────────────────
    # 1. IMAGE QUALITY ANALYZER TESTS
    # ─────────────────────────────────────────────────────────────
    def test_sharp_image_passes_quality(self):
        result = ImageQualityAnalyzer.analyze(self.sharp_img_path)
        self.assertTrue(result.is_acceptable)
        self.assertGreaterEqual(result.blur_score, 45.0)
        self.assertGreaterEqual(result.score, 0.50)

    def test_blurry_image_fails_and_routes_to_review(self):
        result = ImageQualityAnalyzer.analyze(self.blurry_img_path)
        self.assertFalse(result.is_acceptable)
        self.assertLess(result.blur_score, 45.0)
        self.assertIn("blurry", (result.reason or "").lower())

        # SafetyService full pipeline must route blurry image to REVIEW
        resp = SafetyService.analyze_listing(self.blurry_img_path)
        self.assertEqual(resp.decision, DecisionType.REVIEW)
        self.assertIn("blurry", resp.reason.lower())

    def test_dark_image_fails_quality(self):
        result = ImageQualityAnalyzer.analyze(self.dark_img_path)
        self.assertFalse(result.is_acceptable)
        self.assertIn("underexposed", (result.reason or "").lower())

        resp = SafetyService.analyze_listing(self.dark_img_path)
        self.assertEqual(resp.decision, DecisionType.REVIEW)

    def test_low_resolution_rejected(self):
        result = ImageQualityAnalyzer.analyze(self.low_res_img_path)
        self.assertFalse(result.is_acceptable)
        self.assertFalse(result.resolution_ok)

    # ─────────────────────────────────────────────────────────────
    # 2. CAMPUS POLICY ENGINE TESTS (DECOUPLED TAXONOMY)
    # ─────────────────────────────────────────────────────────────
    def test_policy_prohibited_weapons(self):
        prohibited_items = ["Revolver", "Assault Rifle", "Cleaver", "Hunting Knife", "Explosive"]
        for item in prohibited_items:
            res = CampusPolicyEngine.evaluate(item, 0.95)
            self.assertEqual(res.category, PolicyCategory.PROHIBITED)
            self.assertFalse(res.is_allowed)
            self.assertEqual(res.risk_level, RiskLevel.HIGH)

    def test_policy_unsupported_food_and_beverage(self):
        unsupported_items = ["Cheeseburger", "Pizza", "Hotdog", "Espresso", "Beer Bottle", "Carbonated Drink"]
        for item in unsupported_items:
            res = CampusPolicyEngine.evaluate(item, 0.92)
            self.assertEqual(res.category, PolicyCategory.UNSUPPORTED)
            self.assertFalse(res.is_allowed)
            self.assertEqual(res.risk_level, RiskLevel.HIGH)

    def test_policy_allowed_student_items(self):
        allowed_items = ["Scientific Calculator", "Textbook", "Laptop Computer", "Student Backpack", "Bicycle"]
        for item in allowed_items:
            res = CampusPolicyEngine.evaluate(item, 0.90)
            self.assertEqual(res.category, PolicyCategory.ALLOWED)
            self.assertTrue(res.is_allowed)
            self.assertEqual(res.risk_level, RiskLevel.LOW)

    def test_policy_unknown_items(self):
        res = CampusPolicyEngine.evaluate("Mysterious Futuristic Orb", 0.50)
        self.assertEqual(res.category, PolicyCategory.UNKNOWN)
        self.assertFalse(res.is_allowed)
        self.assertEqual(res.risk_level, RiskLevel.MEDIUM)

    # ─────────────────────────────────────────────────────────────
    # 3. MULTIMODAL IMAGE/TEXT CONSISTENCY TESTS
    # ─────────────────────────────────────────────────────────────
    def test_consistent_listing(self):
        vision_res = VisionDetectionResult(
            primary_object="Scientific Calculator",
            confidence=0.92,
            domain_status=DomainStatus.IN_DOMAIN,
            is_confident=True
        )
        policy_res = CampusPolicyEngine.evaluate("Scientific Calculator", 0.92)

        res = ConsistencyChecker.check_consistency(
            vision_res,
            policy_res,
            title="Casio FX-991ES Plus Scientific Calculator",
            category="Calculators"
        )
        self.assertTrue(res.is_consistent)
        self.assertGreaterEqual(res.score, 0.70)

    def test_inconsistent_listing_triggers_review(self):
        vision_res = VisionDetectionResult(
            primary_object="Scientific Calculator",
            confidence=0.88,
            domain_status=DomainStatus.IN_DOMAIN,
            is_confident=True
        )
        policy_res = CampusPolicyEngine.evaluate("Scientific Calculator", 0.88)

        res = ConsistencyChecker.check_consistency(
            vision_res,
            policy_res,
            title="Engineering Mathematics Textbook Vol 2",
            category="Books"
        )
        self.assertFalse(res.is_consistent)
        self.assertLess(res.score, 0.40)
        self.assertIn("mismatch", (res.mismatch_reason or "").lower())

    def test_text_cannot_override_safety_violation(self):
        # A prohibited weapon cannot be approved by claiming it is a 'Textbook'
        vision_res = VisionDetectionResult(
            primary_object="Revolver",
            confidence=0.95,
            domain_status=DomainStatus.IN_DOMAIN,
            is_confident=True
        )
        policy_res = CampusPolicyEngine.evaluate("Revolver", 0.95)

        res = ConsistencyChecker.check_consistency(
            vision_res,
            policy_res,
            title="Computer Science Textbook",
            category="Books"
        )
        self.assertFalse(res.is_consistent)
        self.assertIn("cannot override", (res.mismatch_reason or "").lower())

    # ─────────────────────────────────────────────────────────────
    # 4. GEMINI VISION & OUT-OF-DOMAIN ROUTING TESTS
    # ─────────────────────────────────────────────────────────────
    def test_gemini_provider_unconfigured_routes_to_review(self):
        from backend.app.services.ai.providers.gemini_provider import GeminiVisionProvider
        provider = GeminiVisionProvider(api_key=None)
        res = provider.detect(self.sharp_img_path)
        self.assertEqual(res.domain_status, DomainStatus.UNKNOWN)
        self.assertEqual(res.confidence, 0.0)
        self.assertFalse(res.is_confident)
        self.assertIn("not configured", res.reason.lower())

    def test_digital_graphic_and_logo_routed_to_review(self):
        # Digital graphics and unverified images must route to REVIEW
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Digital Graphic / Logo",
                confidence=0.95,
                domain_status=DomainStatus.OUT_OF_DOMAIN,
                is_confident=True,
                reason="Digital graphic or logo is not an exchangeable physical item."
            )
            logo_path = os.path.join(self.test_dir, "test_logo.png")
            img = Image.new("RGBA", (300, 300), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            draw.rectangle([50, 50, 250, 250], fill=(12, 135, 253, 255))
            img.save(logo_path)

            resp = SafetyService.analyze_listing(logo_path)
            self.assertEqual(resp.decision, DecisionType.REVIEW)
            self.assertEqual(resp.domain_status, DomainStatus.OUT_OF_DOMAIN)

    # ─────────────────────────────────────────────────────────────
    # 5. BACKEND ENFORCEMENT & HTTP 400 ON VIOLATIONS
    # ─────────────────────────────────────────────────────────────
    def test_safety_service_blocks_weapon(self):
        # Even with high quality image, if object is a weapon, verdict must be BLOCK
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Revolver",
                confidence=0.96,
                domain_status=DomainStatus.IN_DOMAIN,
                is_confident=True
            )
            resp = SafetyService.analyze_listing(self.sharp_img_path, title="Revolver")
            self.assertEqual(resp.decision, DecisionType.BLOCK)
            self.assertEqual(resp.risk_level, RiskLevel.HIGH)

    def test_safety_service_blocks_food(self):
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Cheeseburger",
                confidence=0.94,
                domain_status=DomainStatus.IN_DOMAIN,
                is_confident=True
            )
            resp = SafetyService.analyze_listing(self.sharp_img_path, title="Fast food burger")
            self.assertEqual(resp.decision, DecisionType.BLOCK)
            self.assertEqual(resp.risk_level, RiskLevel.HIGH)

    def test_safety_service_reviews_out_of_domain(self):
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Alp",
                confidence=0.91,
                domain_status=DomainStatus.OUT_OF_DOMAIN,
                is_confident=True,
                reason="Landscape or scenery photo is not an exchangeable campus item."
            )
            resp = SafetyService.analyze_listing(self.sharp_img_path, title="Mountain view")
            self.assertEqual(resp.decision, DecisionType.REVIEW)
            self.assertEqual(resp.domain_status, DomainStatus.OUT_OF_DOMAIN)

    def test_safety_service_reviews_unknown_low_confidence(self):
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Unknown Object",
                confidence=0.22,
                domain_status=DomainStatus.UNKNOWN,
                is_confident=False,
                reason="Visual model confidence is low (22.0%)."
            )
            resp = SafetyService.analyze_listing(self.sharp_img_path, title="Some gadget")
            self.assertEqual(resp.decision, DecisionType.REVIEW)

    def test_safety_service_approves_valid_calculator(self):
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Scientific Calculator",
                confidence=0.95,
                domain_status=DomainStatus.IN_DOMAIN,
                is_confident=True
            )
            resp = SafetyService.analyze_listing(
                self.sharp_img_path, 
                title="Casio FX Scientific Calculator", 
                category="Calculators"
            )
            self.assertEqual(resp.decision, DecisionType.APPROVE)
            self.assertEqual(resp.risk_level, RiskLevel.LOW)
            self.assertGreaterEqual(resp.policy_confidence, 0.90)

    def test_safety_service_approves_stationery_drafter_scale(self):
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            # Gemini Vision recognizes drafting tools accurately
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Drawing Scale Instrument",
                confidence=0.88,
                domain_status=DomainStatus.IN_DOMAIN,
                is_confident=True
            )
            resp = SafetyService.analyze_listing(
                self.sharp_img_path,
                title="Engineering Drafter Scale",
                category="Stationery",
                description="Omega mini drafter for engineering drawing"
            )
            self.assertEqual(resp.decision, DecisionType.APPROVE)
            self.assertEqual(resp.risk_level, RiskLevel.LOW)
            self.assertIn("Drafter Scale", resp.object_detected)

    def test_safety_service_approves_pens_pack(self):
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Pencil Case / Stationery Box",
                confidence=0.90,
                domain_status=DomainStatus.IN_DOMAIN,
                is_confident=True
            )
            resp = SafetyService.analyze_listing(
                self.sharp_img_path,
                title="Hauser XO Blue Gel Pens (Pack of 10)",
                category="Stationery"
            )
            self.assertEqual(resp.decision, DecisionType.APPROVE)
            self.assertEqual(resp.risk_level, RiskLevel.LOW)

    def test_safety_service_approves_fashion_item(self):
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Hoodie / Sweatshirt",
                confidence=0.85,
                domain_status=DomainStatus.IN_DOMAIN,
                is_confident=True
            )
            resp = SafetyService.analyze_listing(
                self.sharp_img_path,
                title="Campus Oversized Hoodie",
                category="Fashion",
                description="Warm black hoodie, size L, barely worn"
            )
            self.assertEqual(resp.decision, DecisionType.APPROVE)
            self.assertEqual(resp.risk_level, RiskLevel.LOW)

    def test_safety_service_approves_bicycle(self):
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Bicycle",
                confidence=0.94,
                domain_status=DomainStatus.IN_DOMAIN,
                is_confident=True
            )
            resp = SafetyService.analyze_listing(
                self.sharp_img_path,
                title="Hero Gear Cycle 21-Speed",
                category="Sports",
                description="Good condition bicycle for campus commute"
            )
            self.assertEqual(resp.decision, DecisionType.APPROVE)
            self.assertEqual(resp.risk_level, RiskLevel.LOW)

class TestCampusMartSafetyAPI(unittest.TestCase):
    """
    Integration tests against the FastAPI application to verify that
    backend publication guardrails reject unapproved, blurry, or blocked items.
    """

    @classmethod
    def setUpClass(cls):
        import shutil
        from fastapi.testclient import TestClient
        from backend.app.main import app
        from backend.app.routers.items import UPLOAD_DIR
        from backend.app.services.auth_service import get_current_user
        from backend.app.models.user import User

        cls.client = TestClient(app)
        cls.upload_dir = UPLOAD_DIR

        # Ensure a test user exists in DB
        from backend.app.database import SessionLocal
        db = SessionLocal()
        mock_user = db.query(User).filter(User.id == 9999).first()
        if not mock_user:
            mock_user = User(
                id=9999, 
                email="student9999@campus.edu", 
                full_name="Verified Campus Student", 
                hashed_password="mock_password_hash",
                department="Computer Science & Engineering",
                year="3rd Year",
                is_verified=True
            )
            db.add(mock_user)
            db.commit()
            db.refresh(mock_user)
        db.close()

        app.dependency_overrides[get_current_user] = lambda: mock_user

        # Prepare test images in upload dir
        cls.test_sharp_name = "test_api_sharp.png"
        cls.test_blurry_name = "test_api_blurry.png"
        
        sharp_path = os.path.join(cls.upload_dir, cls.test_sharp_name)
        blurry_path = os.path.join(cls.upload_dir, cls.test_blurry_name)

        img = Image.new("RGB", (300, 300), (240, 240, 240))
        draw = ImageDraw.Draw(img)
        for i in range(0, 300, 30):
            draw.line([(i, 0), (i, 300)], fill=(10, 10, 10), width=3)
        img.save(sharp_path)

        blurry = img.filter(ImageFilter.GaussianBlur(25))
        blurry.save(blurry_path)

    def test_api_missing_image_rejected(self):
        payload = {
            "title": "Calculus Notes",
            "category": "Books",
            "description": "Semester notes",
            "condition": "Like New",
            "selling_price": 250,
            "images": []
        }
        res = self.client.post("/api/items", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Listing image is mandatory", res.json()["detail"])

    def test_api_blurry_image_rejected_at_publication(self):
        payload = {
            "title": "Calculus Textbook",
            "category": "Books",
            "description": "Used semester textbook",
            "condition": "Good",
            "selling_price": 300,
            "images": [f"/uploads/{self.test_blurry_name}"]
        }
        res = self.client.post("/api/items", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("requires manual student safety review", res.json()["detail"].lower())

    def test_api_blocked_prohibited_item_rejected(self):
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Revolver",
                confidence=0.97,
                domain_status=DomainStatus.IN_DOMAIN,
                is_confident=True
            )
            payload = {
                "title": "Prohibited Item",
                "category": "Accessories",
                "description": "Dangerous item",
                "condition": "Brand New",
                "selling_price": 5000,
                "images": [f"/uploads/{self.test_sharp_name}"]
            }
            res = self.client.post("/api/items", json=payload)
            self.assertEqual(res.status_code, 400)
            self.assertIn("blocked by CampusMart AI Safety Policy", res.json()["detail"])

    def test_api_approved_item_published_successfully(self):
        from unittest.mock import patch
        with patch("backend.app.services.ai.object_detector.ObjectDetector.detect") as mock_detect:
            mock_detect.return_value = VisionDetectionResult(
                primary_object="Scientific Calculator",
                confidence=0.96,
                domain_status=DomainStatus.IN_DOMAIN,
                is_confident=True
            )
            payload = {
                "title": "Casio Scientific Calculator",
                "category": "Calculators",
                "description": "FX-991ES Plus in great condition for engineering math",
                "condition": "Like New",
                "selling_price": 450,
                "images": [f"/uploads/{self.test_sharp_name}"]
            }
            res = self.client.post("/api/items", json=payload)
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "active")
            self.assertEqual(data["ai_decision"], "APPROVE")
            self.assertGreaterEqual(data["ai_confidence"], 0.90)
            self.assertEqual(data["ai_risk_level"], "LOW")

if __name__ == "__main__":
    unittest.main()
