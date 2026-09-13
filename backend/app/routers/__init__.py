from backend.app.routers.auth import router as auth_router
from backend.app.routers.users import router as users_router
from backend.app.routers.items import router as items_router
from backend.app.routers.exchanges import router as exchanges_router
from backend.app.routers.rentals import router as rentals_router
from backend.app.routers.requests import router as requests_router
from backend.app.routers.messages import router as messages_router
from backend.app.routers.favorites import router as favorites_router
from backend.app.routers.notifications import router as notifications_router
from backend.app.routers.analytics import router as analytics_router
from backend.app.routers.seed import router as seed_router

__all__ = [
    "auth_router",
    "users_router",
    "items_router",
    "exchanges_router",
    "rentals_router",
    "requests_router",
    "messages_router",
    "favorites_router",
    "notifications_router",
    "analytics_router",
    "seed_router",
]

