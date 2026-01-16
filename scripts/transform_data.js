import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const datosDir = path.join(__dirname, '../Datos');
const outputDir = path.join(__dirname, '../src/data');

// Ensure output dir exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function processSuppliers() {
  const file = 'Contactos Trade Marketing Porveedores.xlsx';
  const wb = XLSX.readFile(path.join(datosDir, file));
  const sheetNames = wb.SheetNames;
  console.log('Sheets found:', sheetNames);

  let allContacts = [];
  let globalIndex = 0;

  for (const sheetName of sheetNames) {
      console.log(`Processing Sheet: ${sheetName}`);
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (rows.length === 0) continue;

      // Find header row index
      let headerRowIndex = -1;
      let colMap = {};

      for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const rowStr = JSON.stringify(rows[i]).toUpperCase();
          if (rowStr.includes('RAZON SOCIAL') || rowStr.includes('PROVEEDOR')) {
              headerRowIndex = i;
              // Map columns basic heuristics
              rows[i].forEach((cell, idx) => {
                  if (!cell) return;
                  const c = cell.toString().toUpperCase().trim();
                  if (c.includes('RAZON') || c.includes('PROVEEDOR')) colMap.company = idx;
                  if (c === 'MARCA') colMap.brand = idx;
                  if (c.includes('CONTACTO MKT') || c === 'CONTACTO') colMap.name = idx; // Priority to MKT
                  if (c.includes('EMAIL MKT') || c === 'MAIL') colMap.email = idx;
                  if (c.includes('CELULAR MKT') || c === 'CELULAR' || c === 'CELU') colMap.phone = idx;
                  if (c === 'COMPRADOR') colMap.buyer = idx;
              });
              // Adjust priority: if "CONTACTO MKT" exists, use it. If duplicates, last one wins or specific check.
              // In the file we saw: indices 0..8
              // 5: CONTACTO MKT, 7: EMAIL MKT. 
              // 2: CONTACTO COMPRAS.
              // If we found "CONTACTO" at 2 and "CONTACTO MKT" at 5, checking string might overwrite.
              // Let's hardcode indices if header matches known pattern, else rely on map.
              if (rowStr.includes('CONTACTO MKT')) {
                  colMap.name = 5;
                  colMap.phone = 6;
                  colMap.email = 7;
                  colMap.buyer = 8;
                  colMap.company = 0;
                  colMap.brand = 1;
              }
              break;
          }
      }

      if (headerRowIndex === -1) {
          console.log(`No header found in sheet ${sheetName}, skipping.`);
          continue;
      }

      console.log(`Sheet ${sheetName} Header at row ${headerRowIndex}. Map:`, JSON.stringify(colMap));

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Default indices if map failed (fallback to 0, 1, 5, 6, 7)
          const idxCompany = colMap.company !== undefined ? colMap.company : 0;
          const idxBrand = colMap.brand !== undefined ? colMap.brand : 1;
          const idxName = colMap.name !== undefined ? colMap.name : 5;
          const idxEmail = colMap.email !== undefined ? colMap.email : 7;
          const idxPhone = colMap.phone !== undefined ? colMap.phone : 6;
          const idxBuyer = colMap.buyer !== undefined ? colMap.buyer : 8;

          const company = row[idxCompany];
          
          if (!company) continue;

          const brand = row[idxBrand];
          const name = row[idxName];
          const email = row[idxEmail];
          const phone = row[idxPhone];
          const buyer = row[idxBuyer];

          globalIndex++;
          
          allContacts.push({
                id: `p_${globalIndex}`,
                company: company.toString().trim(),
                brand: brand ? brand.toString().trim() : company.toString().trim(),
                name: name ? name.toString().trim() : (buyer ? buyer.toString().trim() : '-'), // Fallback to buyer if no MKT contact
                role: 'Marketing',
                email: email ? email.toString().trim() : '-',
                phone: phone ? phone.toString().trim() : '-',
                isFavorite: false,
                buyer: buyer ? buyer.toString().trim() : '-'
          });
      }
  }

  // Distribution Logic
  const perfumeryGroup = {
      id: 'perfumeria',
      title: 'Perfumería & Limpieza',
      contacts: []
  };
  
  const foodsGroup = {
      id: 'alimentos',
      title: 'Alimentos & Bebidas',
      contacts: []
  };

  const perfumeryKeywords = ['UNILEVER', 'COLGATE', 'HALEON', 'PROCTER', 'KIMBERLY', 'CLOROX', 'S.C. JOHNSON', 'LOREAL', 'BEIERSDORF', 'ELEA', 'GENOMMA', 'ALGODONERA'];

  allContacts.forEach(c => {
      const upperComp = c.company.toUpperCase();
      // Heuristic: Check Keywords OR logic based on Sheet Name if mapped (but checking keywords is safer for mixed sheets)
      if (perfumeryKeywords.some(k => upperComp.includes(k))) {
          perfumeryGroup.contacts.push(c);
      } else {
          foodsGroup.contacts.push(c);
      }
  });

  return [perfumeryGroup, foodsGroup];
}

function processRateCard() {
  const file = 'Tarifario 2026 - Retail Media.xlsx';
  const wb = XLSX.readFile(path.join(datosDir, file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const items = [];
  let currentCategory = 'General';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Detect section header: Row with only 1 string item, usually uppercase
    if (row.length === 1 && typeof row[0] === 'string' && row[0].length > 3) {
        // Clean up category name
        let cat = row[0].trim();
        // Skip "REPORTING" or specific instructional headers if needed, but let's keep them as categories for now
        if (cat === 'REPORTING') continue; // Maybe skip reporting as it's not a sellable asset? Or keep it. Keep it.
        
        // Map to "nice" categories
        if (cat.includes('DIGITAL')) cat = 'Digital';
        else if (cat.includes('ACTIVACIONES')) cat = 'Activaciones';
        else if (cat.includes('AGENCIA')) cat = 'Producción';
        else {
            // Capitalize first letter
            cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
        }
        currentCategory = cat;
        continue;
    }

    // Skip sub-headers
    if (row[0] === 'Categoría' || row[1] === 'Ítem') continue;

    const item = row[1];
    const specs = row[2]; // Medida
    const notes = row[3]; // Detalle
    const unit = row[4];
    const priceRaw = row[5];


    // Debugging first few rows
    if (i < 10) console.log(`RateCard Row ${i}:`, JSON.stringify(row));

    // Try to find price: often last column or column 5
    let priceFound = parseFloat(priceRaw) || 0;
    if (priceFound === 0) {
        // Try next column
        if (row[6] && !isNaN(parseFloat(row[6]))) priceFound = parseFloat(row[6]);
        // Try searching all columns for a number > 1000
        else {
             for (let j = 5; j < row.length; j++) {
                 if (typeof row[j] === 'number' || (!isNaN(parseFloat(row[j])) && parseFloat(row[j]) > 100)) {
                     priceFound = parseFloat(row[j]);
                     break;
                 }
             }
        }
    }

    if (item) { // Allow price 0
       items.push({
           id: `t_${items.length + 1}`,
           category: currentCategory,
           item: item.toString().trim(),
           specs: specs ? specs.toString().trim() : '',
           price: priceFound,
           unit: unit ? unit.toString().trim() : '-',
           notes: notes ? notes.toString().trim() : ''
       });
    } else {
         if (i < 20) console.log(`Skipping RC Row ${i}: Item=${item}, PriceRaw=${priceRaw}, PriceFound=${priceFound}`);
    }
  }
  
  return items;
}

const suppliersData = processSuppliers();
const rateCardData = processRateCard();

const combinedData = {
    PROVIDER_GROUPS_DATA: suppliersData,
    RATE_CARD_DATA: rateCardData
};

const outputPath = path.join(outputDir, 'extractedData.json');
fs.writeFileSync(outputPath, JSON.stringify(combinedData, null, 2));

console.log('Success! Data extracted to:', outputPath);
console.log('Suppliers Groups:', suppliersData.length);
console.log('Rate Card Items:', rateCardData.length);
