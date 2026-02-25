/**
 * CSV Import utilities for bulk donor upload.
 */

export interface ParsedDonorRow {
  name: string;
  address: string;
  addressNumber: string;
  place: string;
  donationType: 'money' | 'groceries';
  moneyAmount: number;
  groceryItems: string;
  notes: string;
  mapsLink: string;
}

export interface RowValidationError {
  row: number;
  reason: string;
}

export interface ParsedCSVResult {
  validRows: ParsedDonorRow[];
  errors: RowValidationError[];
  totalRows: number;
}

const REQUIRED_HEADERS = [
  'name',
  'address',
  'address number',
  'place',
  'donation type',
  'money amount',
  'grocery items',
  'notes',
  'maps link',
];

/**
 * Parse a CSV file into text content.
 */
export async function parseCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Parse CSV text into rows, handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse and validate CSV text content into donor rows.
 */
export function parseAndValidateCSV(csvText: string): ParsedCSVResult {
  const lines = csvText
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => l.trim() !== '');

  if (lines.length < 2) {
    return { validRows: [], errors: [{ row: 0, reason: 'CSV file is empty or has no data rows' }], totalRows: 0 };
  }

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

  // Check required headers
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return {
      validRows: [],
      errors: [{ row: 0, reason: `Missing required columns: ${missingHeaders.join(', ')}` }],
      totalRows: 0,
    };
  }

  const nameIdx = headers.indexOf('name');
  const addressIdx = headers.indexOf('address');
  const addressNumberIdx = headers.indexOf('address number');
  const placeIdx = headers.indexOf('place');
  const donationTypeIdx = headers.indexOf('donation type');
  const moneyAmountIdx = headers.indexOf('money amount');
  const groceryItemsIdx = headers.indexOf('grocery items');
  const notesIdx = headers.indexOf('notes');
  const mapsLinkIdx = headers.indexOf('maps link');

  const dataLines = lines.slice(1);
  const validRows: ParsedDonorRow[] = [];
  const errors: RowValidationError[] = [];

  dataLines.forEach((line, idx) => {
    const rowNum = idx + 2; // 1-based, accounting for header
    const cols = parseCSVLine(line);

    const name = cols[nameIdx]?.trim() || '';
    const address = cols[addressIdx]?.trim() || '';
    const addressNumber = cols[addressNumberIdx]?.trim() || '';
    const place = cols[placeIdx]?.trim() || '';
    const donationTypeRaw = cols[donationTypeIdx]?.trim().toLowerCase() || '';
    const moneyAmountRaw = cols[moneyAmountIdx]?.trim() || '';
    const groceryItems = cols[groceryItemsIdx]?.trim() || '';
    const notes = cols[notesIdx]?.trim() || '';
    const mapsLink = cols[mapsLinkIdx]?.trim() || '';

    // Validate required fields
    if (!name) {
      errors.push({ row: rowNum, reason: 'Missing required field: name' });
      return;
    }
    if (!address) {
      errors.push({ row: rowNum, reason: 'Missing required field: address' });
      return;
    }
    if (!place) {
      errors.push({ row: rowNum, reason: 'Missing required field: place' });
      return;
    }

    // Validate donation type
    if (donationTypeRaw !== 'money' && donationTypeRaw !== 'groceries') {
      errors.push({
        row: rowNum,
        reason: `Invalid donation type "${donationTypeRaw}" — must be "money" or "groceries"`,
      });
      return;
    }

    // Validate money amount if type is money
    let moneyAmount = 0;
    if (donationTypeRaw === 'money') {
      moneyAmount = parseInt(moneyAmountRaw, 10);
      if (isNaN(moneyAmount) || moneyAmount < 0) {
        errors.push({ row: rowNum, reason: 'Invalid money amount — must be a non-negative number' });
        return;
      }
    }

    // Validate grocery items if type is groceries
    if (donationTypeRaw === 'groceries' && !groceryItems) {
      errors.push({ row: rowNum, reason: 'Grocery items are required when donation type is "groceries"' });
      return;
    }

    validRows.push({
      name,
      address,
      addressNumber,
      place,
      donationType: donationTypeRaw as 'money' | 'groceries',
      moneyAmount,
      groceryItems,
      notes,
      mapsLink,
    });
  });

  return { validRows, errors, totalRows: dataLines.length };
}

/**
 * Generate and download a CSV template file.
 */
export function downloadCSVTemplate(): void {
  const headers = [
    'name',
    'address',
    'address number',
    'place',
    'donation type',
    'money amount',
    'grocery items',
    'notes',
    'maps link',
  ];

  const exampleRow = [
    'John Smith',
    'Main Street',
    '42',
    'Downtown',
    'money',
    '100',
    '',
    'Regular monthly donor',
    'https://maps.google.com/?q=...',
  ];

  const exampleRow2 = [
    'Jane Doe',
    'Oak Avenue',
    '7',
    'Westside',
    'groceries',
    '',
    'Rice; Dal; Sugar',
    'Prefers morning delivery',
    '',
  ];

  const csvContent =
    '\uFEFF' + // UTF-8 BOM
    [headers, exampleRow, exampleRow2]
      .map((row) => row.map((cell) => (cell.includes(',') ? `"${cell}"` : cell)).join(','))
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'trusttrack_donor_template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
