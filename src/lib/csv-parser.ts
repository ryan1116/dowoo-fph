/**
 * CSV Parser for MarketData and CostMaster imports.
 *
 * Expected CSV formats:
 *
 * MarketData:
 *   date, origin, destination, vehicleType, freightType, unitPrice
 *   2024-01-15, Seoul/Gangnam, Busan/Haeundae, 11t, General, 850000
 *
 * CostMaster:
 *   category, item, value, unit, description
 *   Variable, fuel_price, 1650, KRW/L, Diesel fuel price per liter
 */

export interface MarketDataRow {
  date: string;
  origin: string;
  destination: string;
  vehicleType: string;
  freightType: string;
  unitPrice: number;
}

export interface CostMasterRow {
  category: string;
  item: string;
  value: number;
  unit: string;
  description: string;
}

export interface ParseResult<T> {
  data: T[];
  errors: string[];
  totalRows: number;
}

function parseCsvLines(text: string): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const fields: string[] = [];
    let current = "";
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
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  });
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const MARKET_DATA_HEADERS: Record<string, keyof MarketDataRow> = {
  date: "date",
  origin: "origin",
  departure: "origin",
  destination: "destination",
  arrival: "destination",
  vehicletype: "vehicleType",
  vehicle: "vehicleType",
  tontype: "vehicleType",
  freighttype: "freightType",
  freight: "freightType",
  cargotype: "freightType",
  unitprice: "unitPrice",
  price: "unitPrice",
  amount: "unitPrice",
  fare: "unitPrice",
};

const COST_MASTER_HEADERS: Record<string, keyof CostMasterRow> = {
  category: "category",
  type: "category",
  item: "item",
  name: "item",
  key: "item",
  value: "value",
  amount: "value",
  unit: "unit",
  description: "description",
  desc: "description",
  note: "description",
};

function mapHeaders<T>(
  rawHeaders: string[],
  mapping: Record<string, keyof T>,
  requiredFields: (keyof T)[]
): { columnMap: Map<number, keyof T>; missingFields: string[] } {
  const columnMap = new Map<number, keyof T>();
  const foundFields = new Set<keyof T>();

  rawHeaders.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    const field = mapping[normalized];
    if (field && !foundFields.has(field)) {
      columnMap.set(index, field);
      foundFields.add(field);
    }
  });

  const missingFields = requiredFields
    .filter((f) => !foundFields.has(f))
    .map(String);

  return { columnMap, missingFields };
}

export function parseMarketDataCsv(text: string): ParseResult<MarketDataRow> {
  const lines = parseCsvLines(text);
  if (lines.length < 2) {
    return { data: [], errors: ["CSV file is empty or has no data rows."], totalRows: 0 };
  }

  const [headerRow, ...dataRows] = lines;
  const requiredFields: (keyof MarketDataRow)[] = [
    "date", "origin", "destination", "vehicleType", "freightType", "unitPrice",
  ];
  const { columnMap, missingFields } = mapHeaders(headerRow, MARKET_DATA_HEADERS, requiredFields);

  if (missingFields.length > 0) {
    return {
      data: [],
      errors: [`Missing required columns: ${missingFields.join(", ")}. Found headers: ${headerRow.join(", ")}`],
      totalRows: 0,
    };
  }

  const data: MarketDataRow[] = [];
  const errors: string[] = [];

  dataRows.forEach((fields, idx) => {
    const rowNum = idx + 2; // 1-based, skip header
    const row: Partial<MarketDataRow> = {};

    columnMap.forEach((field, colIdx) => {
      const val = fields[colIdx]?.trim() ?? "";
      if (field === "unitPrice") {
        row[field] = parseFloat(val.replace(/,/g, ""));
      } else {
        (row as Record<string, string | number>)[field] = val;
      }
    });

    // Validate
    if (!row.date || isNaN(new Date(row.date).getTime())) {
      errors.push(`Row ${rowNum}: Invalid date "${row.date}"`);
      return;
    }
    if (!row.origin || !row.destination) {
      errors.push(`Row ${rowNum}: Missing origin or destination`);
      return;
    }
    if (!row.vehicleType) {
      errors.push(`Row ${rowNum}: Missing vehicleType`);
      return;
    }
    if (isNaN(row.unitPrice as number) || (row.unitPrice as number) <= 0) {
      errors.push(`Row ${rowNum}: Invalid unitPrice "${fields[Array.from(columnMap.entries()).find(([, f]) => f === "unitPrice")?.[0] ?? 0]}"`);
      return;
    }

    data.push(row as MarketDataRow);
  });

  return { data, errors, totalRows: dataRows.length };
}

export function parseCostMasterCsv(text: string): ParseResult<CostMasterRow> {
  const lines = parseCsvLines(text);
  if (lines.length < 2) {
    return { data: [], errors: ["CSV file is empty or has no data rows."], totalRows: 0 };
  }

  const [headerRow, ...dataRows] = lines;
  const requiredFields: (keyof CostMasterRow)[] = [
    "category", "item", "value", "unit", "description",
  ];
  const { columnMap, missingFields } = mapHeaders(headerRow, COST_MASTER_HEADERS, requiredFields);

  if (missingFields.length > 0) {
    return {
      data: [],
      errors: [`Missing required columns: ${missingFields.join(", ")}. Found headers: ${headerRow.join(", ")}`],
      totalRows: 0,
    };
  }

  const data: CostMasterRow[] = [];
  const errors: string[] = [];
  const validCategories = ["Variable", "Fixed", "Policy", "Risk"];

  dataRows.forEach((fields, idx) => {
    const rowNum = idx + 2;
    const row: Partial<CostMasterRow> = {};

    columnMap.forEach((field, colIdx) => {
      const val = fields[colIdx]?.trim() ?? "";
      if (field === "value") {
        row[field] = parseFloat(val.replace(/,/g, ""));
      } else {
        (row as Record<string, string | number>)[field] = val;
      }
    });

    if (!row.category || !validCategories.includes(row.category)) {
      errors.push(`Row ${rowNum}: Invalid category "${row.category}". Must be one of: ${validCategories.join(", ")}`);
      return;
    }
    if (!row.item) {
      errors.push(`Row ${rowNum}: Missing item name`);
      return;
    }
    if (isNaN(row.value as number)) {
      errors.push(`Row ${rowNum}: Invalid value`);
      return;
    }
    if (!row.unit) {
      errors.push(`Row ${rowNum}: Missing unit`);
      return;
    }

    data.push(row as CostMasterRow);
  });

  return { data, errors, totalRows: dataRows.length };
}
