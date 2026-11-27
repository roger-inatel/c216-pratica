from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.clientes import router as clientes_router
from app.api.routes.pedidos import router as pedidos_router
from app.api.routes.sistema import router as sistema_router
from app.core.config import CORS_ORIGINS
from app.core.erros import ErroDeNegocio

app = FastAPI(title="Controle de Entregas")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(ErroDeNegocio)
def tratar_erro_de_negocio(_request: Request, erro: ErroDeNegocio) -> JSONResponse:
    return JSONResponse(status_code=erro.status_code, content={"detail": erro.mensagem})


app.include_router(sistema_router)
app.include_router(clientes_router)
app.include_router(pedidos_router)
