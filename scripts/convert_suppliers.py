import json
import re
import csv
import io

def parse_raw_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    sections = content.split('## TAB: ')
    
    result_groups = []
    
    # Map Titles to IDs
    category_map = {
        'PERFUMERIA & LIMPIEZA': 'perfumeria',
        'PERFUMERIA': 'perfumeria', # robustness
        'PERECEDEROS': 'perecederos',
        'BEBIDAS': 'bebidas',
        'ALMACEN': 'almacen',
        'FRESCOS': 'frescos',
        'NONFOOD': 'nonfood'
    }

    provider_id_counter = 1000

    for section in sections:
        if not section.strip():
            continue
            
        lines = section.strip().split('\n')
        header_line = lines[0].strip()
        
        # Extract Category Title (remove (CSV))
        category_title = header_line.replace('(CSV)', '').strip()
        category_id = category_map.get(category_title, category_title.lower().replace(' ', '_'))
        
        print(f"Processing Category: {category_title} ({category_id})")

        # Get CSV Content (skip blank lines before/after)
        csv_content = ""
        start_csv = False
        for line in lines[1:]:
            if 'PROVEEDOR' in line:
                start_csv = True
            if start_csv and line.strip():
                csv_content += line + "\n"
        
        if not csv_content:
            print(f"Warning: No CSV content found for {category_title}")
            continue

        # Parse CSV
        reader = csv.DictReader(io.StringIO(csv_content))
        
        contacts = []
        for row in reader:
            provider_id_counter += 1
            
            # Normalize keys (strip spaces)
            safe_row = {k.strip(): v.strip() for k, v in row.items() if k}
            
            contact = {
                "id": str(provider_id_counter),
                "company": safe_row.get('PROVEEDOR', ''),
                "brand": safe_row.get('MARCA') or safe_row.get('NOMBRE') or safe_row.get('PROVEEDOR', ''),
                "name": safe_row.get('COMPRADOR') or safe_row.get('CONTACTO MKT') or '-',
                "role": 'Marketing', # Default
                "email": safe_row.get('EMAIL') or safe_row.get('EMAIL MKT') or safe_row.get('EMAIL COMPRAS') or '-',
                "phone": safe_row.get('CELULAR') or safe_row.get('CELULAR MKT') or safe_row.get('CELULAR COMPRAS') or '-',
                "isFavorite": False,
                "buyer": safe_row.get('COMPRADOR', '-')
            }
            
            # Special Handling for Specific Columns if they exist
            if 'CONTACTO MKT' in safe_row and safe_row['CONTACTO MKT']:
                contact['contact_mkt_name'] = safe_row['CONTACTO MKT']
            if 'CONTACTO COMPRAS' in safe_row and safe_row['CONTACTO COMPRAS']:
                contact['contact_compras_name'] = safe_row['CONTACTO COMPRAS']
                
            contacts.append(contact)
            
        result_groups.append({
            "id": category_id,
            "title": category_title.title(), # Capitalize for display
            "contacts": contacts
        })

    return {"PROVIDER_GROUPS_DATA": result_groups}

if __name__ == "__main__":
    data = parse_raw_file("scripts/raw_suppliers.txt")
    
    # Save to JSON
    with open("src/data/extractedData.json", 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully converted {len(data['PROVIDER_GROUPS_DATA'])} groups to src/data/extractedData.json")
