from fastapi import APIRouter

router = APIRouter(tags=["Sistema"])


@router.get("/")
def read_root():
    return {"status": "ok"}


@router.get("/health")
def health_check():
    return {"status": "healthy"}
