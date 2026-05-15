from fastapi import FastAPI
from routers import color

app = FastAPI(title="ClosetFit AI Service", version="1.0.0")

app.include_router(color.router, prefix="/api/v1", tags=["color"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
