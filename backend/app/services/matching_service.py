import re
from typing import List, Dict, Any, Tuple
from backend.app.models.item import Item

class ExchangeMatchingService:
    """
    Service responsible for calculating exchange compatibility scores between items.
    Designed with a clean pluggable interface for future AI / Embedding model integration.
    """

    @classmethod
    def calculate_compatibility(cls, item_a: Item, item_b: Item) -> Tuple[float, str]:
        """
        Calculates compatibility percentage (0 to 100) between two exchange items,
        plus an explanatory rationale.
        """
        score = 65.0 # baseline interest

        # 1. Category comparison
        category_affinity = 0.0
        if item_a.category == item_b.category:
            category_affinity = 15.0
        elif (item_a.category in ["Books", "Stationery"] and item_b.category in ["Books", "Stationery"]) or \
             (item_a.category in ["Electronics", "Accessories"] and item_b.category in ["Electronics", "Accessories"]):
            category_affinity = 10.0
        else:
            category_affinity = 5.0
        score += category_affinity

        # 2. Keyword matching between preference & title/description
        text_match_bonus = 0.0
        pref_a = (item_a.exchange_preference or "").lower()
        title_b = item_b.title.lower()
        desc_b = item_b.description.lower()
        
        pref_b = (item_b.exchange_preference or "").lower()
        title_a = item_a.title.lower()
        desc_a = item_a.description.lower()

        # Check if words in item_a preference match item_b
        words_a = [w for w in re.split(r'\W+', pref_a) if len(w) > 3]
        for w in words_a:
            if w in title_b or w in desc_b:
                text_match_bonus += 8.0
                break

        words_b = [w for w in re.split(r'\W+', pref_b) if len(w) > 3]
        for w in words_b:
            if w in title_a or w in desc_a:
                text_match_bonus += 8.0
                break

        score += min(text_match_bonus, 15.0)

        # 3. Value symmetry ratio
        val_a = item_a.selling_price or item_a.original_price or 500.0
        val_b = item_b.selling_price or item_b.original_price or 500.0
        ratio = min(val_a, val_b) / max(val_a, val_b) if max(val_a, val_b) > 0 else 1.0

        if ratio >= 0.75:
            score += 10.0
        elif ratio >= 0.5:
            score += 6.0
        else:
            score += 2.0

        final_score = round(min(98.5, max(45.0, score)), 1)
        
        reason = "High category synergy & balanced campus value"
        if final_score >= 90:
            reason = "Direct academic overlap & balanced campus trade value"
        elif final_score >= 80:
            reason = "Complementary department course materials"
        else:
            reason = "General campus peer exchange compatibility"

        return final_score, reason

    @classmethod
    def find_potential_matches(cls, user_items: List[Item], market_items: List[Item]) -> List[Dict[str, Any]]:
        """
        Finds the top exchange pairs across user's items and open marketplace items.
        """
        matches = []
        for my_item in user_items:
            if not my_item.is_exchange:
                continue
            for other_item in market_items:
                if other_item.seller_id == my_item.seller_id or not other_item.is_exchange:
                    continue
                score, reason = cls.calculate_compatibility(my_item, other_item)
                if score >= 70.0:
                    matches.append({
                        "my_item": my_item,
                        "target_item": other_item,
                        "target_user": other_item.seller,
                        "compatibility_score": score,
                        "reason": reason
                    })

        # Sort descending by compatibility score
        matches.sort(key=lambda x: x["compatibility_score"], reverse=True)
        return matches[:10]

