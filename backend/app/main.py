from fastapi import FastAPI

from app.api.routes.items import router as items_router
from app.api.routes.system import router as system_router

app = FastAPI(title="C216 - Sistemas Distribuidos")

app.include_router(system_router)
app.include_router(items_router)
