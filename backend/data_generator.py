import pandas as pd
import numpy as np

# Configuration
NUM_SAMPLES = 10000
OUTPUT_FILE = "Datos_Casino_Simulacion_Operativa.xlsx"

def generate_data():
    np.random.seed(42)
    
    # 1. Base Variables
    # Hours between 8.0 and 18.0
    horas = np.random.uniform(8.0, 18.0, NUM_SAMPLES)
    
    # Peak Hour Logic (11:30 to 14:30)
    en_hora_punta = np.where((horas >= 11.5) & (horas <= 14.5), 1, 0)
    
    # Resources
    cajeras = np.random.randint(1, 6, NUM_SAMPLES) # 1 to 5 cashiers
    totems = np.random.randint(0, 11, NUM_SAMPLES) # 0 to 10 totems (expanded range)
    
    # Channel (0=Manual, 1=Edenred/Totem)
    # We force correlation: if Totems > 0, probability of using Edenred increases
    prob_edenred = np.minimum(totems * 0.1, 0.9) # More totems = more likely to use Edenred
    canal = np.random.rand(NUM_SAMPLES) < prob_edenred
    canal = canal.astype(int)
    
    # Amount
    monto = np.random.normal(3500, 500, NUM_SAMPLES)
    
    # 2. Start Logic for Wait Time (CALIBRATED FOR LOGICAL CONSISTENCY)
    # Base constant wait time (Lowered from 35 to 25 to match baseline better)
    espera_base = 25.0 
    
    # Factor: Peak Hour (+12 mins of stress, reduced from 15)
    term_peak = en_hora_punta * 12.0
    
    # Factor: Resources (The more resources, the less wait)
    # Cashier reduces ~3 min each
    term_cajeras = cajeras * -2.5
    
    # Totem reduces ~4.5 min each (Digital is faster and splits queue)
    term_totems = totems * -4.5 
    
    # Factor: Channel Efficiency
    # Paying with Edenred is significantly faster (-6 min bonus)
    term_canal = np.where(canal == 1, -6.0, 0.0) 
    
    # Noise (Random variations)
    noise = np.random.normal(0, 1.5, NUM_SAMPLES)
    
    # Calculate Final Wait Time
    tiempo_espera = espera_base + term_peak + term_cajeras + term_totems + term_canal + noise
    
    # Clamp to realistic values (min 2 min, max 60 min)
    tiempo_espera = np.clip(tiempo_espera, 2.0, 60.0)
    
    # Create DataFrame
    df = pd.DataFrame({
        'Hora_Decimal': np.round(horas, 1),
        'EnHoraPunta_Num': en_hora_punta,
        'Cantidad_Cajeras': cajeras,
        'Cantidad_Totems': totems,
        'Canal_Num': canal,
        'MontoCLP': np.round(monto, 0),
        'TiempoEsperaMinutos': np.round(tiempo_espera, 1)
    })
    
    # Save
    df.to_excel(OUTPUT_FILE, index=False)
    print(f"Dataset generated with {NUM_SAMPLES} samples at {OUTPUT_FILE}")
    print("Logic applied: Totems and Edenred explicitly reduce wait time.")

if __name__ == "__main__":
    generate_data()
