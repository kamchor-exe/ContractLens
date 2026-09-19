from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import engine, AsyncSessionLocal
from app.db.seed import seed_demo_user
from app.api import contracts, obligations, deadlines, chat, reminders, clauses

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    settings.absolute_storage_path
    async with AsyncSessionLocal() as session:
        await seed_demo_user(session)
    yield
    # Shutdown actions
    await engine.dispose()

app = FastAPI(
    title="ContractLens API",
    description="Privacy-conscious AI contract intelligence system",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(contracts.router, prefix="/api")
app.include_router(obligations.router, prefix="/api")
app.include_router(deadlines.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
app.include_router(clauses.router, prefix="/api")

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": "ContractLens API",
        "environment": settings.APP_ENV
    }
