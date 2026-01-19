import json
import re

def parse_rate_card(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    items_db = {}
    
    # --- PART 1: SPECS (Formatos Retail Media) ---
    # Regex to find items like: * **Name** \n * Medida: ...
    
    specs_section = content.split("## 2) TARIFARIO RETAIL MEDIA")[0]
    
    current_category = "IN STORE" # Default start
    
    lines = specs_section.split('\n')
    current_item = None
    
    for line in lines:
        line = line.strip()
        if "###" in line:
            current_category = line.replace("###", "").strip()
            continue
            
        # Item Detection
        if line.startswith('* **') and '**' in line[4:]:
            item_name = line.replace('* **', '').split('**')[0].strip()
            # Normalize Name
            clean_name = item_name.split(' // ')[0] # Take first part if alias
            
            current_item = {
                "category": current_category,
                "item": item_name,
                "specs": [],
                "price": 0,
                "unit": "Por pieza" # Default
            }
            items_db[clean_name.lower()] = current_item
        
        # Spec Detection
        elif line.startswith('* ') and ':' in line:
            if current_item:
                spec_text = line.replace('* ', '')
                current_item['specs'].append(spec_text)

    # --- PART 2: PRICES (Tarifario) ---
    prices_section = content.split("## 2) TARIFARIO RETAIL MEDIA")[1]
    
    current_price_category = "PDV"
    
    price_lines = prices_section.split('\n')
    
    for line in price_lines:
        line = line.strip()
        if "###" in line:
            current_price_category = line.replace("###", "").strip()
            continue
            
        if line.startswith('* **'):
            # Parse line like: * **Name** — Unidad: **X** — Inversión: **Y**
            parts = line.split('—')
            name_part = parts[0].replace('* **', '').split('**')[0].strip()
            clean_name = name_part.split(' // ')[0].lower()
            
            # Find in DB or Create New
            if clean_name in items_db:
                item_obj = items_db[clean_name]
            else:
                # Special cases or exact matches failed
                # Try partial match or create new
                found = False
                for k, v in items_db.items():
                    if k in clean_name or clean_name in k:
                        item_obj = v
                        found = True
                        break
                
                if not found:
                    item_obj = {
                        "category": current_price_category,
                        "item": name_part,
                        "specs": [],
                        "price": 0,
                        "unit": "Por pieza"
                    }
                    items_db[clean_name] = item_obj

            # Update Price & Unit
            for part in parts[1:]:
                if "Unidad:" in part:
                    item_obj['unit'] = part.split('**')[1].strip()
                if "Inversión:" in part:
                    try:
                        price_str = part.split('**')[1].strip()
                        item_obj['price'] = int(price_str)
                    except:
                        pass
            
            # Update Category if it was generic before
            if item_obj['category'] == 'IN STORE' and current_price_category != 'PDV':
                 item_obj['category'] = current_price_category


    # --- FINAL FORMATTING ---
    rate_card_list = []
    id_counter = 1
    
    for key, val in items_db.items():
        # Format specs string
        specs_str = " | ".join(val['specs']) if val['specs'] else ""
        
        # Clean Category Names
        cat = val['category']
        if cat == 'PDV': cat = 'Punto de Venta (In Store)'
        if cat == 'Web / Owned media': cat = 'Digital (Owned Media)'
        if cat == 'Web / Landing': cat = 'Digital (Landing)'
        
        rate_card_list.append({
            "id": id_counter,
            "category": cat,
            "subcategory": val['category'], # Keep original just in case
            "item": val['item'],
            "specs": specs_str,
            "price": val['price'],
            "unit": val['unit'],
            "notes": ""
        })
        id_counter += 1

    return {"RATE_CARD_DATA": rate_card_list}

if __name__ == "__main__":
    # Load existing extractedData to preserve PROVIDER_GROUPS
    current_data = {}
    try:
        with open("src/data/extractedData.json", 'r', encoding='utf-8') as f:
            current_data = json.load(f)
    except:
        pass

    new_data = parse_rate_card("scripts/raw_rate_card.txt")
    
    # Merge
    current_data["RATE_CARD_DATA"] = new_data["RATE_CARD_DATA"]
    
    with open("src/data/extractedData.json", 'w', encoding='utf-8') as f:
        json.dump(current_data, f, indent=2, ensure_ascii=False)
        
    print(f"Parsed {len(new_data['RATE_CARD_DATA'])} rate card items.")
