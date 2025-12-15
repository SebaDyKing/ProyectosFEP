import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
import joblib
import os

# Configuration
DATA_FILE = "Datos_Casino_Simulacion_Operativa.xlsx"
MODEL_FILE = "modelo_casino_rf.pkl"

def train_model():
    print(f"Loading data from {DATA_FILE}...")
    if not os.path.exists(DATA_FILE):
        print(f"Error: {DATA_FILE} not found.")
        return

    # Load data (Excel)
    df = pd.read_excel(DATA_FILE)
    
    # 2. Clean data
    df = df.dropna()
    
    # Define features and target
    features = [
        'Hora_Decimal', 
        'EnHoraPunta_Num', 
        'Cantidad_Cajeras', 
        'Cantidad_Totems', 
        'Canal_Num', 
        'MontoCLP'
    ]
    target = 'TiempoEsperaMinutos'
    
    X = df[features]
    y = df[target]
    
    # Split data (optional but good practice for validation)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Train model
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # 4. Validate
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    
    print(f"Model trained successfully.")
    print(f"R2 Score: {r2:.4f}")
    print(f"MAE: {mae:.4f}")
    
    # 5. Save model
    joblib.dump(model, MODEL_FILE)
    print(f"Model saved to {MODEL_FILE}")

if __name__ == "__main__":
    train_model()
