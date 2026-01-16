
import json
import re
import sys

# Force UTF-8 for stdout
sys.stdout.reconfigure(encoding='utf-8')

def parse_date(date_str, month_context):
    # Handle "ENERO/MARZO"
    if '/' in date_str and not re.search(r'\d', date_str):
        return None 
    
    # Handle "2026-01-01"
    if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
        return date_str

    # Handle "02/01 al 15/02"
    range_match = re.match(r'(\d{2})/(\d{2}) al (\d{2})/(\d{2})', date_str)
    if range_match:
        d1, m1, d2, m2 = range_match.groups()
        return f"2026-{m1}-{d1}", f"2026-{m2}-{d2}"

    return None

events = []
with open('c:/Users/juego/OneDrive/Escritorio/360/temp_events.txt', 'r', encoding='utf-8') as f:
    for line in f:
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 3:
            month = parts[0]
            date_raw = parts[1]
            title = parts[2]
            
            if not date_raw: continue
            
            parsed = parse_date(date_raw, month)
            
            if parsed:
                if isinstance(parsed, tuple):
                    start, end = parsed
                    events.append({
                        "id": f"mkt_{len(events)}",
                        "title": title,
                        "type": "campaign" if "Especial:" in title else "marketing",
                        "startDay": int(start.split('-')[2]),
                        "endDay": int(end.split('-')[2]),
                        "date": start,
                        "endDate": end,
                        "color": "bg-yellow-500/80" if "Especial:" in title else "bg-blue-500/80",
                        "textColor": "text-black"
                    })
                else:
                    events.append({
                        "id": f"mkt_{len(events)}",
                        "title": title,
                        "type": "marketing",
                        "date": parsed,
                        "day": int(parsed.split('-')[2]),
                        "icon": "📅" 
                    })

with open('c:/Users/juego/OneDrive/Escritorio/360/src/data/marketingEvents.json', 'w', encoding='utf-8') as f:
    json.dump(events, f, indent=2, ensure_ascii=False)

print("Successfully wrote marketingEvents.json")
