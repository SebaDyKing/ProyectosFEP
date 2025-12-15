from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os
from dotenv import load_dotenv

# Load env
load_dotenv()

app = FastAPI(title="Casino Simulation API - Edenred Integration")

# Configure CORS for Vite
env_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
origins = [origin.strip() for origin in env_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model
MODEL_FILE = "modelo_casino_rf.pkl"
model = None

# Initialize logic
print(f"Starting Backend in {os.getcwd()}")
if os.path.exists(MODEL_FILE):
    model = joblib.load(MODEL_FILE)
    print(f"Model loaded successfully from {MODEL_FILE}")
else:
    print(f"WARNING: {MODEL_FILE} not found. Please run train_model.py first.")

# Pydantic Model
class SimulationInput(BaseModel):
    Hora_Decimal: float
    EnHoraPunta_Num: int
    Cantidad_Cajeras: int
    Cantidad_Totems: int
    Canal_Num: int
    MontoCLP: float

@app.post("/simular")
def predict_wait_time(data: SimulationInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not trained. Run train_model.py.")
    
    # Prepare DataFrame
    input_df = pd.DataFrame([{
        'Hora_Decimal': data.Hora_Decimal,
        'EnHoraPunta_Num': data.EnHoraPunta_Num,
        'Cantidad_Cajeras': data.Cantidad_Cajeras,
        'Cantidad_Totems': data.Cantidad_Totems,
        'Canal_Num': data.Canal_Num,
        'MontoCLP': data.MontoCLP
    }])
    
    try:
        prediction = model.predict(input_df)[0]
        # Return rounded value
        return {"TiempoEsperaMinutos": round(float(prediction), 2)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
