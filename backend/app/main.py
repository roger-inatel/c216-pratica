from fastapi import FastAPI

app = FastAPI(title="C216 - Sistemas Distribuidos")


@app.get("/")
def read_root():
    return {"status": "ok"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
