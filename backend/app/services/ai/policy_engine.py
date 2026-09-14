import re
from typing import List, Dict, Tuple, Optional
from backend.app.services.ai.schemas import (
    PolicyCategory, 
    PolicyEvaluationResult, 
    RiskLevel, 
    VisionCandidate
)

class CampusPolicyEngine:
    """
    Decoupled policy engine that evaluates detected physical items against CampusMart rules.
    Categories:
    - ALLOWED: Physical academic supplies, electronics, stationery, lab gear, campus essentials.
    - UNSUPPORTED: Food, beverages, perishable goods, medicines, animals, human services.
    - PROHIBITED: Weapons, firearms, knives, ammunition, explosives, fireworks, vapes, narcotics, hazardous chemicals.
    - UNKNOWN: Ambiguous, unidentifiable, or novel items.
    """

    # Prohibited dangerous items / weapons / pyrotechnics / hazards
    PROHIBITED_KEYWORDS = {
        "weapon", "weapons", "gun", "guns", "handgun", "handguns", "pistol", "pistols", 
        "revolver", "revolvers", "rifle", "rifles", "assault rifle", "shotgun", "shotguns", 
        "firearm", "firearms", "ammunition", "bullet", "bullets", "knife", "knives", 
        "dagger", "daggers", "cleaver", "cleavers", "machete", "machetes", "bayonet", 
        "switchblade", "bowie knife", "hunting knife", "explosive", "explosives", 
        "dynamite", "bomb", "bombs", "grenade", "grenades", "firework", "fireworks", 
        "firecracker", "firecrackers", "cracker", "crackers", "pyrotechnic", "pyrotechnics", 
        "rocket", "rockets", "flare", "flares", "vape", "vapes", "e-cigarette", "e-cigarettes", 
        "narcotic", "narcotics", "drug", "drugs", "syringe", "syringes", "poison", "toxic", 
        "hazardous", "chemical", "flammable", "lighter"
    }

    # Unsupported food and beverage items
    UNSUPPORTED_FOOD_BEVERAGE = {
        "food", "pizza", "burger", "cheeseburger", "hotdog", "sandwich", "bagel", 
        "burrito", "taco", "french fries", "snack", "cookie", "cake", "ice cream", 
        "chocolate", "beverage", "drink", "coffee", "tea", "espresso", "soda", 
        "carbonated drink", "beer", "wine", "liquor", "whiskey", "vodka", "cocktail", 
        "bottle of wine", "cup of coffee", "plate", "dish", "meal", "soup", "salad", 
        "fruit", "apple", "banana", "orange", "vegetable", "meat", "bread"
    }

    # Unsupported animals and biological entities
    UNSUPPORTED_OTHER = {
        "dog", "cat", "puppy", "kitten", "bird", "parrot", "hamster", "rabbit", 
        "snake", "lizard", "horse", "cow", "pet", "animal", "medicine", "pill", "capsule"
    }

    # Allowed Campus Categories and Items
    ALLOWED_CATEGORIES = {
        "Calculators": {
            "keywords": ["calculator", "scientific calculator", "hand-held calculator", "computing device", "math calculator", "abacus"],
            "suggested_category": "Calculators"
        },
        "Books": {
            "keywords": ["book", "textbook", "hardcover", "paperback", "novel", "binder", "notebook", "manual", "handbook", "atlas", "comic book", "booklet", "journal"],
            "suggested_category": "Books"
        },
        "Electronics": {
            "keywords": [
                "laptop", "notebook computer", "computer", "desktop computer", "monitor", "screen", 
                "keyboard", "computer keyboard", "mouse", "computer mouse", "trackball", 
                "headphones", "headset", "earphones", "earbuds", "speaker", "loudspeaker", 
                "cellphone", "cellular telephone", "smart phone", "mobile phone", "telephone", 
                "tablet", "ipad", "power bank", "charger", "cable", "usb", "hard drive", "router", 
                "modem", "camera", "digital camera", "projector", "microphone"
            ],
            "suggested_category": "Electronics"
        },
        "Stationery": {
            "keywords": [
                "pen", "pens", "ballpoint", "fountain pen", "gel pen", "pencil", "pencils", 
                "pencil case", "pencil box", "drafter", "mini drafter", "drafter scale", 
                "scale", "ruler", "slide rule", "geometry box", "compass", "protractor", 
                "set square", "divider", "eraser", "rubber", "sharpener", "marker", 
                "highlighter", "drawing board", "drawing sheet", "sheet", "t-square", 
                "stapler", "scissors", "clip", "folder", "binder", "notebook", "paper", 
                "packet", "tape", "glue", "art supplies", "stationery"
            ],
            "suggested_category": "Stationery"
        },
        "Fashion": {
            "keywords": [
                "fashion", "clothes", "clothing", "shirt", "t-shirt", "tshirt", "hoodie", 
                "jacket", "coat", "sweater", "sweatshirt", "cardigan", "jean", "jeans", 
                "pant", "pants", "trousers", "shorts", "shoe", "shoes", "sneakers", 
                "boots", "sandals", "slippers", "cap", "hat", "watch", "belt", "wallet", 
                "purse", "sunglasses", "glasses", "spectacles", "tie", "blazer", "suit", 
                "dress", "kurta", "uniform", "lab coat", "sock", "socks"
            ],
            "suggested_category": "Fashion"
        },
        "Lab Equipment": {
            "keywords": [
                "microscope", "telescope", "beaker", "flask", "caliper", "scale", "vernier", 
                "oscilloscope", "multimeter", "soldering iron", "pipette", "compass", "protractor"
            ],
            "suggested_category": "Lab Equipment"
        },
        "Accessories": {
            "keywords": [
                "backpack", "bag", "school bag", "satchel", "tote", "duffle bag", "laptop bag", 
                "watch", "wristwatch", "digital watch", "analog watch", "umbrella", "glasses", "sunglasses"
            ],
            "suggested_category": "Accessories"
        },
        "Sports": {
            "keywords": [
                "bicycle", "bike", "mountain bike", "cycle", "gear cycle", "tricycle", "unicycle",
                "badminton", "racket", "shuttlecock", "tennis ball", "cricket bat", "cricket ball", 
                "basketball", "football", "soccer ball", "volleyball", "dumbbell", "skateboard", "helmet"
            ],
            "suggested_category": "Sports"
        },
        "Furniture": {
            "keywords": ["desk", "study desk", "table", "chair", "study chair", "lamp", "desk lamp", "bookshelf", "cushion", "bedsheet", "hanger"],
            "suggested_category": "Furniture"
        },
        "Hostel Essentials": {
            "keywords": [
                "kettle", "iron", "water bottle", "flask", "bucket", "mirror", "clock", 
                "pillow", "blanket", "shoe", "shoes", "sneakers", "jacket", "hoodie", 
                "t-shirt", "shirt", "sweatshirt", "lock", "padlock"
            ],
            "suggested_category": "Hostel Essentials"
        }
    }

    @classmethod
    def evaluate(
        cls, 
        candidate_label: str, 
        confidence: float, 
        secondary_candidates: Optional[List[VisionCandidate]] = None,
        title: Optional[str] = "",
        category: Optional[str] = "",
        description: Optional[str] = ""
    ) -> PolicyEvaluationResult:
        """
        Evaluates detected visual items + user listing details against campus safety policies.
        Zero-tolerance check for weapons and food, with robust support for valid campus goods.
        """
        label_lower = (candidate_label or "").lower().strip()
        all_labels = [label_lower]
        if secondary_candidates:
            all_labels.extend([c.label.lower().strip() for c in secondary_candidates if c.confidence >= 0.12])

        user_text = f"{title or ''} {category or ''} {description or ''}".lower()

        # 1. Check PROHIBITED Weapons / Hazardous Items (Visual or Text)
        for lbl in all_labels:
            for kw in cls.PROHIBITED_KEYWORDS:
                if cls._matches_keyword(lbl, kw):
                    return PolicyEvaluationResult(
                        category=PolicyCategory.PROHIBITED,
                        policy_name="Campus Security & Weapons Prohibition Policy",
                        is_allowed=False,
                        risk_level=RiskLevel.HIGH,
                        reason=f"Dangerous item detected: '{lbl}' violates campus safety regulations prohibiting weapons, explosives, and contraband.",
                        violation_code="WEAPON_OR_HAZARD"
                    )

        for kw in cls.PROHIBITED_KEYWORDS:
            if cls._matches_keyword(user_text, kw):
                return PolicyEvaluationResult(
                    category=PolicyCategory.PROHIBITED,
                    policy_name="Campus Security & Weapons Prohibition Policy",
                    is_allowed=False,
                    risk_level=RiskLevel.HIGH,
                    reason=f"Prohibited item in listing: '{kw}' violates campus security policies.",
                    violation_code="WEAPON_OR_HAZARD"
                )

        # 2. Check UNSUPPORTED Food, Beverages, Groceries (Visual or Text)
        for lbl in all_labels:
            for kw in cls.UNSUPPORTED_FOOD_BEVERAGE:
                if cls._matches_keyword(lbl, kw):
                    return PolicyEvaluationResult(
                        category=PolicyCategory.UNSUPPORTED,
                        policy_name="CampusMart Non-Commercial Marketplace Policy",
                        is_allowed=False,
                        risk_level=RiskLevel.HIGH,
                        reason=f"Food/Beverage item detected: '{lbl}'. Prepared food and perishables are not supported.",
                        violation_code="FOOD_AND_BEVERAGES"
                    )

        for kw in cls.UNSUPPORTED_FOOD_BEVERAGE:
            # Avoid matching words like "apple" if user means "Apple MacBook" or "MacBook"
            if kw in ["apple"] and any(term in user_text for term in ["macbook", "ipad", "iphone", "laptop", "watch", "airpods"]):
                continue
            if cls._matches_keyword(user_text, kw):
                return PolicyEvaluationResult(
                    category=PolicyCategory.UNSUPPORTED,
                    policy_name="CampusMart Non-Commercial Marketplace Policy",
                    is_allowed=False,
                    risk_level=RiskLevel.HIGH,
                    reason=f"Unsupported item in listing: '{kw}'. Prepared food and perishables are not supported.",
                    violation_code="FOOD_AND_BEVERAGES"
                )

        # 3. Check UNSUPPORTED Animals, Biological, Medicines
        for lbl in all_labels:
            for kw in cls.UNSUPPORTED_OTHER:
                if cls._matches_keyword(lbl, kw):
                    return PolicyEvaluationResult(
                        category=PolicyCategory.UNSUPPORTED,
                        policy_name="Campus Biological & Regulated Items Policy",
                        is_allowed=False,
                        risk_level=RiskLevel.HIGH,
                        reason=f"Unsupported item detected: '{lbl}'. Live animals and regulated medicines cannot be exchanged on CampusMart.",
                        violation_code="BIOLOGICAL_OR_MEDICINE"
                    )

        # 4. Check ALLOWED Items (Visual Detection First)
        best_match_cat = None
        for cat_name, cat_data in cls.ALLOWED_CATEGORIES.items():
            for kw in cat_data["keywords"]:
                if cls._matches_keyword(label_lower, kw):
                    best_match_cat = cat_name
                    break
            if best_match_cat:
                break

        # Also check secondary visual candidates if primary didn't match
        if not best_match_cat and secondary_candidates:
            for c in secondary_candidates:
                c_lbl = c.label.lower()
                for cat_name, cat_data in cls.ALLOWED_CATEGORIES.items():
                    for kw in cat_data["keywords"]:
                        if cls._matches_keyword(c_lbl, kw):
                            best_match_cat = cat_name
                            break
                    if best_match_cat:
                        break
                if best_match_cat:
                    break

        # 5. Check ALLOWED Items (Multimodal: User Listing Details)
        if not best_match_cat and (title or category):
            # Check user category selection
            if category and category in cls.ALLOWED_CATEGORIES:
                best_match_cat = category
            elif category and category.lower() in ["fashion", "clothing", "apparel"]:
                best_match_cat = "Fashion"
            else:
                # Check user title and category keywords
                for cat_name, cat_data in cls.ALLOWED_CATEGORIES.items():
                    for kw in cat_data["keywords"]:
                        if cls._matches_keyword(user_text, kw):
                            best_match_cat = cat_name
                            break
                    if best_match_cat:
                        break

        if best_match_cat:
            return PolicyEvaluationResult(
                category=PolicyCategory.ALLOWED,
                policy_name="Campus Academic & Student Gear Policy",
                is_allowed=True,
                risk_level=RiskLevel.LOW,
                reason=f"Item classified under allowed student category: {best_match_cat}.",
                violation_code=None
            )

        # 6. Default / UNKNOWN item
        return PolicyEvaluationResult(
            category=PolicyCategory.UNKNOWN,
            policy_name="Unclassified Item Policy",
            is_allowed=False,
            risk_level=RiskLevel.MEDIUM,
            reason=f"Object '{candidate_label}' could not be matched with certainty to an approved campus category. Please provide item name and select an approved category.",
            violation_code="UNCLASSIFIED_OBJECT"
        )

    @staticmethod
    def _matches_keyword(text: str, keyword: str) -> bool:
        """Exact phrase or whole word match with optional plural 's' or 'es'."""
        pattern = r'\b' + re.escape(keyword) + r'(?:s|es)?\b'
        return bool(re.search(pattern, text, re.IGNORECASE))

