"""
Main FastAPI Application Entrypoint for Food Recognition & Nutrition Tracker.
Pre-loads trained ML model into RAM on startup (COA RAM residency principle),
initializes verified SQLite nutritional database, and configures CORS and upload routing.
"""

from pathlib import Path
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import UPLOAD_DIR
from backend.database.db import init_db
from backend.models.food_classifier import FoodClassifier
from backend.api.routes import router
from backend.api.agent_routes import router as agent_router
from backend.agents.db_models import init_agent_db
from backend.agents.coordinator import AgentCoordinator

app = FastAPI(
    title="Food Recognition & Nutrition Tracker API",
    description="Academic AI/ML system integrating Computer Vision, Verified Nutrition, and COA Memory Hierarchy profiling.",
    version="1.0.0",
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded images static route
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include API routes
app.include_router(router)
app.include_router(agent_router)


@app.on_event("startup")
def startup_event():
    print("=" * 60)
    print("Starting Food Recognition & Nutrition Tracker Backend...")
    print("Initializing verified SQLite database...")
    init_db()

    print("Initializing Autonomous Agent System Database & Coordinator...")
    init_agent_db()
    AgentCoordinator.get_instance()

    print("Pre-loading FoodClassifier model into RAM (COA RAM Principle)...")
    classifier = FoodClassifier.get_instance()
    classifier.load_model()

    # Pre-warm model inference pipeline to absorb initial jitter
    dummy = torch.randn(1, 3, 224, 224)
    classifier.predict(dummy)
    print(f"Model pre-warmed and resident in RAM ({classifier.ram_resident_size_mb} MB).")
    print("=" * 60)
    print("NutriVision AI is READY and actively RUNNING!")
    print("Open your browser at: http://127.0.0.1:8000")
    print("Leave this terminal OPEN while using the app (press Ctrl+C only to stop).")
    print("=" * 60)


# Mount frontend production build if available
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Don't intercept API or docs requests
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Endpoint not found")
        file_path = frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(frontend_dist / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "project": "Food Recognition & Nutrition Tracker",
            "version": "1.0.0",
            "status": "operational",
            "docs": "/docs",
        }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
