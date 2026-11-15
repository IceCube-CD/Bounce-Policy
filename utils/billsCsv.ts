import {
  BillCategory,
  BillTwittlyReaction,
  PolicyBill,
  ReactionMood,
} from '../types/engine';
import {
  DEFAULT_POLICY_BILLS,
  createDefaultThreeReactions,
  ensureBillThreeReactions,
} from '../data/defaultBills';

export const BILL_CSV_HEADERS = [
  'code',
  'title',
  'category',
  'summary',
  'clause_1',
  'clause_2',
  'ribbon_color',
  'active_on_desk',
  'effect_economy',
  'effect_approval',
  'effect_security',
  'effect_diplomacy',
  'effect_media',
  'msg1_author',
  'msg1_handle',
  'msg1_mood',
  'msg1_content',
  'msg2_author',
  'msg2_handle',
  'msg2_mood',
  'msg2_content',
  'msg3_author',
  'msg3_handle',
  'msg3_mood',
  'msg3_content',
] as const;

const VALID_CATEGORIES: BillCategory[] = [
  'EXECUTIVE ORDER',
  'POLICY BILL',
  'STATE DIRECTIVE',
];

const VALID_MOODS: ReactionMood[] = [
  'HAPPY',
  'HYPED',
  'SHOCKED',
  'SKEPTICAL',
  'ANGRY',
];

function escapeCsvCell(value: string | number | boolean | undefined | null): string {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\r\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function serializeBillsToCsv(bills: PolicyBill[]): string {
  const headerLine = BILL_CSV_HEADERS.join(',');
  const rows = bills.map((bill) => {
    const reactions = ensureBillThreeReactions(bill);
    const clause1 = bill.clauses?.[0] ?? '';
    const clause2 = bill.clauses?.slice(1).join(' | ') ?? '';

    const cells = [
      bill.code,
      bill.title,
      bill.category,
      bill.summary,
      clause1,
      clause2,
      bill.ribbonColor || '#D97706',
      bill.activeOnDesk !== false ? 'true' : 'false',
      bill.effects?.economy ?? 0,
      bill.effects?.approval ?? 0,
      bill.effects?.security ?? 0,
      bill.effects?.diplomacy ?? 0,
      bill.effects?.media ?? 0,
      reactions[0]?.author ?? '',
      reactions[0]?.handle ?? '',
      reactions[0]?.mood ?? 'HYPED',
      reactions[0]?.content ?? '',
      reactions[1]?.author ?? '',
      reactions[1]?.handle ?? '',
      reactions[1]?.mood ?? 'SKEPTICAL',
      reactions[1]?.content ?? '',
      reactions[2]?.author ?? '',
      reactions[2]?.handle ?? '',
      reactions[2]?.mood ?? 'ANGRY',
      reactions[2]?.content ?? '',
    ];

    return cells.map(escapeCsvCell).join(',');
  });

  return [headerLine, ...rows].join('\r\n');
}

export function generateBillsCsvTemplate(): string {
  return serializeBillsToCsv(DEFAULT_POLICY_BILLS);
}

/**
 * Parses RFC-4180 CSV content (supporting both comma `,` and semicolon `;` delimiters)
 * into a 2D array of string rows.
 */
function parseCsvGrid(rawText: string): string[][] {
  const text = rawText.replace(/^\uFEFF/, ''); // Strip UTF-8 BOM if present
  const firstLineEnd = text.search(/\r?\n/);
  const firstLine = firstLineEnd === -1 ? text : text.slice(0, firstLineEnd);

  // Auto-detect semicolon vs comma delimiter for European/Romanian Excel exports
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += ch;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.length > 0));
}

function normalizeCategory(raw: string | undefined): BillCategory {
  const upper = (raw || '').trim().toUpperCase();
  if (VALID_CATEGORIES.includes(upper as BillCategory)) {
    return upper as BillCategory;
  }
  if (upper.includes('STATE') || upper.includes('DIRECTIVE')) return 'STATE DIRECTIVE';
  if (upper.includes('POLICY') || upper.includes('BILL') || upper.includes('H.R')) {
    return 'POLICY BILL';
  }
  return 'EXECUTIVE ORDER';
}

function normalizeMood(raw: string | undefined, fallback: ReactionMood): ReactionMood {
  const upper = (raw || '').trim().toUpperCase();
  if (VALID_MOODS.includes(upper as ReactionMood)) {
    return upper as ReactionMood;
  }
  return fallback;
}

function clampDelta(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(-25, Math.min(25, Math.round(parsed)));
}

export function parseBillsFromCsv(rawCsv: string, startIndex = 1): {
  bills: PolicyBill[];
  errors: string[];
} {
  const rows = parseCsvGrid(rawCsv);
  if (rows.length === 0) {
    return { bills: [], errors: ['CSV file is empty.'] };
  }

  // Check if first row is a header row
  const firstRowLower = rows[0].map((c) => c.toLowerCase().replace(/\s+/g, '_'));
  const hasHeader =
    firstRowLower.includes('code') ||
    firstRowLower.includes('bill_code') ||
    firstRowLower.includes('title') ||
    firstRowLower.includes('bill_title') ||
    firstRowLower.includes('summary') ||
    firstRowLower.includes('summary_text') ||
    firstRowLower.includes('category');

  const headerMap: Record<string, number> = {};
  if (hasHeader) {
    firstRowLower.forEach((colName, idx) => {
      headerMap[colName] = idx;
    });
  } else {
    BILL_CSV_HEADERS.forEach((colName, idx) => {
      headerMap[colName] = idx;
    });
  }

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const importedBills: PolicyBill[] = [];
  const errors: string[] = [];

  const getCellByKeys = (row: string[], keys: string[], fallbackIdx: number) => {
    for (const k of keys) {
      if (headerMap[k] !== undefined) {
        const idx = headerMap[k];
        return idx >= 0 && idx < row.length ? row[idx] : '';
      }
    }
    return fallbackIdx >= 0 && fallbackIdx < row.length ? row[fallbackIdx] : '';
  };

  const NAMED_COLORS: Record<string, string> = {
    green: '#16A34A',
    blue: '#2563EB',
    red: '#DC2626',
    orange: '#D97706',
    purple: '#9333EA',
  };

  dataRows.forEach((row, idx) => {
    const rowNum = idx + (hasHeader ? 2 : 1);
    const rawCode = getCellByKeys(row, ['code', 'bill_code'], 0);
    const rawTitle = getCellByKeys(row, ['title', 'bill_title'], 1);

    if (!rawCode && !rawTitle) {
      return;
    }

    const billNum = startIndex + importedBills.length;
    const code = rawCode || `E.O. ${100 + billNum}`;
    const title = rawTitle || `Executive Policy #${billNum}`;
    const category = normalizeCategory(getCellByKeys(row, ['category'], 2));
    const summary =
      getCellByKeys(row, ['summary', 'summary_text'], 3) ||
      'Custom executive policy directive imported via CSV.';

    const clause1 =
      getCellByKeys(row, ['clause_1'], -1) ||
      `Sec. 1. Direct all relevant Cabinet departments to implement ${title} (${code}) immediately upon signature.`;
    const clause2 =
      getCellByKeys(row, ['clause_2'], -1) ||
      'Sec. 2. Authorize federal agencies to adjust operations accordingly.';

    const clauses = [clause1, clause2]
      .flatMap((c) => c.split('|').map((s) => s.trim()))
      .filter(Boolean);

    const rawColor = getCellByKeys(row, ['ribbon_color', 'tab_color'], 6).toLowerCase();
    const ribbonColor = NAMED_COLORS[rawColor]
      ? NAMED_COLORS[rawColor]
      : /^#[0-9a-f]{3,6}$/i.test(rawColor)
        ? rawColor
        : '#D97706';

    const rawActive = getCellByKeys(row, ['active_on_desk'], -1).toLowerCase();
    const activeOnDesk =
      rawActive === '' ||
      rawActive === 'true' ||
      rawActive === '1' ||
      rawActive === 'yes' ||
      rawActive === 'da';

    const economy = clampDelta(getCellByKeys(row, ['effect_economy', 'economy'], 8));
    const approval = clampDelta(
      getCellByKeys(row, ['effect_approval', 'public_approval', 'approval'], 9)
    );
    const security = clampDelta(
      getCellByKeys(row, ['effect_security', 'national_security', 'security'], 10)
    );
    const diplomacy = clampDelta(
      getCellByKeys(row, ['effect_diplomacy', 'diplomacy'], 11)
    );
    const media = clampDelta(
      getCellByKeys(row, ['effect_media', 'media_trust', 'media'], 12)
    );

    const getCell = (r: string[], key: (typeof BILL_CSV_HEADERS)[number], fallbackIdx: number) =>
      getCellByKeys(r, [key], fallbackIdx);

    const defaultRx = createDefaultThreeReactions(code, title);

    const reactions: BillTwittlyReaction[] = [
      {
        id: `rx-csv-${Date.now()}-${idx}-1`,
        author: getCell(row, 'msg1_author', 13) || defaultRx[0].author,
        handle: getCell(row, 'msg1_handle', 14) || defaultRx[0].handle,
        mood: normalizeMood(getCell(row, 'msg1_mood', 15), defaultRx[0].mood),
        content: getCell(row, 'msg1_content', 16) || defaultRx[0].content,
      },
      {
        id: `rx-csv-${Date.now()}-${idx}-2`,
        author: getCell(row, 'msg2_author', 17) || defaultRx[1].author,
        handle: getCell(row, 'msg2_handle', 18) || defaultRx[1].handle,
        mood: normalizeMood(getCell(row, 'msg2_mood', 19), defaultRx[1].mood),
        content: getCell(row, 'msg2_content', 20) || defaultRx[1].content,
      },
      {
        id: `rx-csv-${Date.now()}-${idx}-3`,
        author: getCell(row, 'msg3_author', 21) || defaultRx[2].author,
        handle: getCell(row, 'msg3_handle', 22) || defaultRx[2].handle,
        mood: normalizeMood(getCell(row, 'msg3_mood', 23), defaultRx[2].mood),
        content: getCell(row, 'msg3_content', 24) || defaultRx[2].content,
      },
    ];

    importedBills.push({
      id: `bill-csv-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      code,
      title,
      category,
      summary,
      clauses: clauses.length > 0 ? clauses : [clause1, clause2],
      ribbonColor,
      effects: {
        economy,
        approval,
        security,
        diplomacy,
        media,
      },
      twittlyReactions: reactions,
      activeOnDesk,
    });

    if (row.length < 2) {
      errors.push(`Row ${rowNum}: Incomplete row, filled missing fields with defaults.`);
    }
  });

  if (importedBills.length === 0 && errors.length === 0) {
    errors.push('No valid bill rows found in CSV.');
  }

  return { bills: importedBills, errors };
}
