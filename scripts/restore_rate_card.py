import json

json_path = "src/data/extractedData.json"

try:
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
except FileNotFoundError:
    data = {}

# Check if RATE_CARD_DATA is missing
if "RATE_CARD_DATA" not in data:
    print("Restoring RATE_CARD_DATA...")
    # Minimal mock data to prevent crashes and allow usage
    data["RATE_CARD_DATA"] = [
        {
            "id": 1,
            "category": "Espacios Preferenciales",
            "item": "Isla de Exhibición",
            "specs": "2x2m, alto tráfico",
            "price": 150000,
            "unit": "Mes",
            "notes": ""
        },
        {
            "id": 2,
            "category": "Digital",
            "item": "Banner Home Principal",
            "specs": "1920x400px",
            "price": 80000,
            "unit": "Semana",
            "notes": ""
        }
    ]
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("RATE_CARD_DATA restored successfully.")
else:
    print("RATE_CARD_DATA already exists.")
