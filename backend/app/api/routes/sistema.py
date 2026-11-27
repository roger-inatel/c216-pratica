from fastapi import APIRouter

router = APIRouter(tags=["Sistema"])


@router.get("/")
def raiz():
    return {"status": "ok"}


@router.get("/health")
def health():
    return {"status": "healthy"}
