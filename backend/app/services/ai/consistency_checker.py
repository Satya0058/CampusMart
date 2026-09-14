import re
from typing import Optional, List, Set
from backend.app.services.ai.schemas import ConsistencyResult, VisionDetectionResult, PolicyEvaluationResult, PolicyCategory

class ConsistencyChecker:
    """
    Cross-checks the visual object identification against user-provided metadata
    (Title, Description, and Category).

    Guarantees:
    - Visual safety violations (Weapons, Food, Hazmat) can NEVER be overridden by user text.
    - Contradictory listings (e.g. image is a bicycle but title claims 'Calculus Book')
      are flagged with low consistency and routed to review.
    """

    # Stop words to ignore during token overlap
    STOP_WORDS = {
        "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", 
        "of", "by", "from", "is", "are", "was", "were", "it", "this", "that", 
        "good", "new", "used", "sale", "buy", "condition", "original", "campus"
    }

    # Related semantic groups (if image detects one, user title containing another in the same group is consistent)
    EQUIVALENCE_GROUPS = [
        {"calculator", "casio", "fx", "texas", "ti", "math", "scientific", "hand-held computer", "computing", "abacus"},
        {"book", "textbook", "novel", "manual", "handbook", "guide", "paperback", "hardcover", "notebook", "notes", "edition", "author", "comic book", "book jacket", "binder", "atlas", "journal"},
        {"laptop", "notebook", "computer", "pc", "macbook", "dell", "hp", "lenovo", "thinkpad", "asus", "acer", "desktop computer"},
        {"keyboard", "mouse", "trackpad", "peripheral", "monitor", "screen", "display", "computer keyboard", "computer mouse"},
        {"phone", "smartphone", "mobile", "iphone", "samsung", "android", "cellular telephone", "tablet", "ipad", "charger", "cable", "power bank"},
        {"backpack", "bag", "rucksack", "knapsack", "satchel", "tote", "duffle", "mailbag", "laptop bag", "purse", "wallet"},
        {"bicycle", "bike", "cycle", "mountain bike", "gear cycle", "road bike", "tricycle", "bicycle-built-for-two"},
        {"headphones", "headset", "earphones", "earbuds", "audio", "airpods", "speaker", "loudspeaker", "microphone"},
        {
            "stationery", "pen", "pens", "pencil", "pencils", "geometry", "ruler", "scale", 
            "drafter", "mini drafter", "drafter scale", "slide rule", "rule", "compass", 
            "protractor", "set square", "divider", "eraser", "sharpener", "marker", 
            "highlighter", "drawing board", "drawing sheet", "sheet", "t-square", "binder", 
            "folder", "packet", "space heater", "radiator", "crutch", "tripod", 
            "paper towel", "pencil box", "pencil case", "ballpoint", "fountain pen"
        },
        {
            "fashion", "clothing", "clothes", "shirt", "t-shirt", "tshirt", "hoodie", 
            "jacket", "coat", "sweater", "sweatshirt", "cardigan", "jean", "jeans", 
            "pant", "pants", "trousers", "shorts", "shoe", "shoes", "sneakers", 
            "boots", "sandals", "slippers", "cap", "hat", "watch", "belt", "wallet", 
            "purse", "sunglasses", "glasses", "spectacles", "tie", "blazer", "suit", 
            "jersey", "running shoe", "clog", "sock", "uniform", "lab coat"
        },
        {
            "hostel", "hostel essentials", "living", "kettle", "iron", "water bottle", 
            "flask", "lamp", "desk lamp", "table lamp", "bedsheet", "pillow", "blanket", 
            "cushion", "mirror", "bucket", "hanger", "lock", "padlock", "organizer", 
            "rack", "clock", "torch"
        },
        {
            "sports", "fitness", "bicycle", "bike", "cycle", "helmet", "badminton", 
            "racket", "cricket", "bat", "ball", "football", "basketball", "volleyball", 
            "dumbbell", "gym", "skateboard", "knee pad"
        }
    ]

    @classmethod
    def check_consistency(
        cls, 
        vision_result: VisionDetectionResult, 
        policy_result: PolicyEvaluationResult,
        title: Optional[str] = "", 
        description: Optional[str] = "", 
        category: Optional[str] = ""
    ) -> ConsistencyResult:
        """
        Calculates consistency score between visual evidence and textual listing details.
        """
        # If image violates safety, text cannot override it
        if policy_result.category in [PolicyCategory.PROHIBITED, PolicyCategory.UNSUPPORTED]:
            return ConsistencyResult(
                score=0.10,
                is_consistent=False,
                matched_terms=[],
                mismatch_reason=f"Text cannot override safety violation: Uploaded image was identified as prohibited/unsupported item ('{vision_result.primary_object}')."
            )

        # If vision result is unknown or low confidence, consistency cannot be firmly verified
        if not vision_result.is_confident or vision_result.confidence < 0.30:
            return ConsistencyResult(
                score=0.50,
                is_consistent=True,
                matched_terms=[],
                mismatch_reason="Visual identification confidence is low; consistency check inconclusive."
            )

        combined_text = f"{title or ''} {description or ''} {category or ''}".lower()
        user_tokens = cls._tokenize(combined_text)

        object_tokens = cls._tokenize(vision_result.primary_object.lower())
        if vision_result.raw_label:
            object_tokens.update(cls._tokenize(vision_result.raw_label.lower()))

        # 1. Direct Token Overlap
        direct_matches = user_tokens.intersection(object_tokens)
        if direct_matches:
            match_score = min(1.0, 0.70 + 0.15 * len(direct_matches))
            return ConsistencyResult(
                score=round(match_score, 2),
                is_consistent=True,
                matched_terms=list(direct_matches),
                mismatch_reason=None
            )

        # 2. Semantic Equivalence Group Check
        group_matches = set()
        for group in cls.EQUIVALENCE_GROUPS:
            # Check if vision object intersects with group
            if any(term in vision_result.primary_object.lower() or term in (vision_result.raw_label or "").lower() for term in group):
                # Check if user text intersects with group
                matched_in_group = user_tokens.intersection(group)
                if matched_in_group:
                    group_matches.update(matched_in_group)

        if group_matches:
            return ConsistencyResult(
                score=0.88,
                is_consistent=True,
                matched_terms=list(group_matches),
                mismatch_reason=None
            )

        # 3. Category Match Check
        if category:
            cat_lower = category.lower()
            if any(tok in cat_lower for tok in object_tokens):
                return ConsistencyResult(
                    score=0.82,
                    is_consistent=True,
                    matched_terms=[category],
                    mismatch_reason=None
                )

        # 4. Check for Blatant Contradiction
        # If title strongly belongs to a different equivalence group than the detected object
        detected_group = None
        for group in cls.EQUIVALENCE_GROUPS:
            if any(term in vision_result.primary_object.lower() or term in (vision_result.raw_label or "").lower() for term in group):
                detected_group = group
                break

        if detected_group and vision_result.confidence >= 0.60:
            # Find which other group the user title belongs to
            user_group = None
            for group in cls.EQUIVALENCE_GROUPS:
                if group != detected_group and user_tokens.intersection(group):
                    user_group = group
                    break

            if user_group:
                # Strong contradiction detected! e.g., image is calculator, title is bicycle/book
                return ConsistencyResult(
                    score=0.15,
                    is_consistent=False,
                    matched_terms=[],
                    mismatch_reason=f"Significant mismatch: Image appears to show '{vision_result.primary_object}', but listing details describe a different type of item."
                )

        # 5. Weak / Neutral overlap (User might have titled it 'Semester 3 casio' or generic 'Must have')
        return ConsistencyResult(
            score=0.60,
            is_consistent=True,
            matched_terms=[],
            mismatch_reason="Listing title has neutral overlap with detected image object."
        )

    @classmethod
    def _tokenize(cls, text: str) -> Set[str]:
        words = re.findall(r'[a-zA-Z0-9]+', text.lower())
        return {w for w in words if len(w) > 1 and w not in cls.STOP_WORDS}

