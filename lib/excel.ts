'use client';

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { LookupOption, LookupTable, WorkbookData } from './types';
import { DATE_HEADER_HINTS } from '@/utils';

const normalize = (s: string) => (s ?? '').toString().trim();
const fold = (s: string) => normalize(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const stripNonAlnum = (s: string) => fold(s).replace(/[^a-z0-9]/g, '');
const splitTokens = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(Boolean);

/** ==== NEW: nhận diện cột ngày theo tên header ==== */

function isDateHeader(key: string): boolean {
  const compact = stripNonAlnum(key);         // "work.startDate" -> "workstartdate"
  if (DATE_HEADER_HINTS.has(compact)) return true;

  // match theo đuôi: "...startdate", "...createddate"
  for (const h of DATE_HEADER_HINTS) {
    if (compact.endsWith(h) || compact.startsWith(h)) return true;
  }

  // match theo cặp token cuối: ["work","start","date"] -> "startdate"
  const t = splitTokens(key);
  if (t.length >= 2 && DATE_HEADER_HINTS.has((t[t.length - 2] + t[t.length - 1]) as string)) return true;

  return false;
}
/** ================================================ */

function detectLookupColumns(row0: Record<string, any>): { codeKey?: string; displayKey?: string } {
  const keys = Object.keys(row0 || {});
  let codeKey: string | undefined;
  let displayKey: string | undefined;
  for (const k of keys) {
    const nk = fold(k);
    if (['code', 'id', 'value', 'key'].includes(nk)) codeKey = k;
    if (['display', 'name', 'label'].includes(nk)) displayKey = k;
  }
  if (!codeKey && keys.find(k => fold(k) === 'code')) codeKey = keys.find(k => fold(k) === 'code');
  if (!displayKey && keys.find(k => fold(k) === 'display')) displayKey = keys.find(k => fold(k) === 'display');
  return { codeKey, displayKey };
}

function sheetToJson(ws: XLSX.WorkSheet): Record<string, any>[] {
  return XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
}

type AliasMap = Record<string, string>; // fold(field) -> fold(sheetName)

function buildAliasFromMapSheet(wb: XLSX.WorkBook): AliasMap {
  const mapSheetName = wb.SheetNames.find(sn => fold(sn) === fold('_lookup_map'));
  if (!mapSheetName) return {};
  const rows = sheetToJson(wb.Sheets[mapSheetName] as XLSX.WorkSheet);
  const out: AliasMap = {};
  for (const r of rows) {
    const f = r['field'] ?? r['Field'] ?? r['FIELD'];
    const s = r['sheet'] ?? r['Sheet'] ?? r['SHEET'];
    if (f && s) out[fold(f)] = fold(s);
  }
  return out;
}

function buildAliasFromMasterFirstRow(masterRows: Record<string, any>[], restSheetNames: string[]): { alias: AliasMap; removeFirstRow: boolean } {
  if (!masterRows.length) return { alias: {}, removeFirstRow: false };
  const first = masterRows[0];
  const restIndex = new Map(restSheetNames.map(sn => [fold(sn), sn]));
  const alias: AliasMap = {};
  let hits = 0;
  for (const colKey of Object.keys(first)) {
    const val = first[colKey];
    if (val && typeof val === 'string') {
      const folded = fold(val);
      if (restIndex.has(folded)) { alias[fold(colKey)] = folded; hits += 1; }
    }
  }
  const removeFirstRow = hits > 0;
  return { alias, removeFirstRow };
}

const MIN_LOOKUP_MATCH = 0.7; // ngưỡng 70%
function inferLookupByValues(
  values: any[],
  tables: Record<string, LookupTable>
): { nameFold: string; by: 'code' | 'display'; score: number } | null {
  const nonEmpty = values
    .filter(v => v != null && v !== '')
    .map(v => (v as string).toString().trim());
  if (nonEmpty.length === 0) return null;

  const foldedVals = nonEmpty.map(v => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());

  let best: { nameFold: string; by: 'code' | 'display'; score: number } | null = null;

  for (const [nameFold, t] of Object.entries(tables)) {
    // code set (fold)
    const codeFoldSet = new Set(Array.from(t.codeSet).map(s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()));
    // display set (fold)
    const displayFoldSet = new Set(Array.from(t.displayMap.values()).map(s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()));

    const codeHits = foldedVals.filter(v => codeFoldSet.has(v)).length;
    const displayHits = foldedVals.filter(v => displayFoldSet.has(v)).length;

    const codeScore = codeHits / foldedVals.length;
    const displayScore = displayHits / foldedVals.length;

    const tableBest = codeScore >= displayScore
      ? { nameFold, by: 'code' as const, score: codeScore }
      : { nameFold, by: 'display' as const, score: displayScore };

    if (!best || tableBest.score > best.score) best = tableBest;
  }

  if (best && best.score >= MIN_LOOKUP_MATCH) return best;
  return null;
}

export async function parseFile(file: File): Promise<WorkbookData> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, any>>(text, { header: true, dynamicTyping: false, skipEmptyLines: true });
    const masterRows = parsed.data;

    const columnMeta: WorkbookData['columnMeta'] = {};
    if (masterRows.length > 0) {
      for (const k of Object.keys(masterRows[0])) {
        // ƯU TIÊN: nếu header trùng "birthday|createdDate|startDate" => date
        columnMeta[k] = { kind: isDateHeader(k) ? 'date' : 'text' };
      }
    }
    return { masterName: file.name, masterRows, lookupTables: {}, columnMeta };
  }

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  if (wb.SheetNames.length === 0) throw new Error('Tệp không có sheet nào.');

  const [masterName, ...restNames] = wb.SheetNames;
  let masterRows = sheetToJson(wb.Sheets[masterName] as XLSX.WorkSheet);

  const lookupTables: Record<string, LookupTable> = {};
  for (const sn of restNames) {
    const rows = sheetToJson(wb.Sheets[sn] as XLSX.WorkSheet);
    if (!rows || rows.length === 0) continue;
    const { codeKey, displayKey } = detectLookupColumns(rows[0]);
    if (!codeKey || !displayKey) continue;
    const options: LookupOption[] = rows
      .map(r => ({ code: (r[codeKey] ?? '').toString(), display: (r[displayKey] ?? '').toString() }))
      .filter(o => o.code !== '');
    const nameFold = fold(sn);
    lookupTables[nameFold] = {
      name: sn, codeKey: codeKey!, displayKey: displayKey!,
      options, codeSet: new Set(options.map(o => o.code)), displayMap: new Map(options.map(o => [o.code, o.display]))
    };
  }

  const aliasFromSheet = buildAliasFromMapSheet(wb);
  const { alias: aliasFromRow, removeFirstRow } = buildAliasFromMasterFirstRow(masterRows, restNames);
  const alias: AliasMap = { ...aliasFromRow, ...aliasFromSheet };
  if (removeFirstRow && Object.keys(aliasFromRow).length > 0) masterRows = masterRows.slice(0); 

  const columnMeta: WorkbookData['columnMeta'] = {};
  const firstRow = masterRows[0] ?? {};
  for (const rawKey of Object.keys(firstRow)) {
    const keyFold = fold(rawKey);

    // 1) Ưu tiên LOOKUP nếu map qua sheet tương ứng
    const aliasTargetFold = alias[keyFold];
    if (aliasTargetFold && lookupTables[aliasTargetFold]) {
      columnMeta[rawKey] = { kind: 'lookup', lookupName: aliasTargetFold, required: false };
      continue;
    }
    if (lookupTables[keyFold]) {
      columnMeta[rawKey] = { kind: 'lookup', lookupName: keyFold, required: false };
      continue;
    }

    // 2) ƯU TIÊN: tên header gợi ý là cột ngày
    if (isDateHeader(rawKey)) {
      columnMeta[rawKey] = { kind: 'date', required: false };
      continue;
    }

    // 3) Suy luận theo dữ liệu (fallback)

    const values = masterRows.map(r => r[rawKey]).filter(v => v != null && v !== '');
    const inferred = inferLookupByValues(values, lookupTables);
    if (inferred) {
      columnMeta[rawKey] = { kind: 'lookup', lookupName: inferred.nameFold, required: false };
      continue;
    }
    const isNumeric = (s: string) => /^-?\d+(\.\d+)?$/.test(s.trim());
    const looksLikeCodeWithLeadingZero = (s: string) => /^0\d+$/.test(s.trim());
    const nonEmpty = values.filter(v => v !== '' && v != null).map(v => String(v));
    const allNumeric = nonEmpty.length > 0 && nonEmpty.every(v =>
      isNumeric(v) && !looksLikeCodeWithLeadingZero(v)); let kind: 'text' | 'number' | 'date' | 'lookup' = 'text';
    if (allNumeric) kind = 'number'; if (values.length > 0) {
      const nums = values.filter(v => !Number.isNaN(Number(v)));
      const dates = values.filter(v => !Number.isNaN(Date.parse(v as any)));
      if (nums.length === values.length) kind = 'number';
      else if (dates.length === values.length) kind = 'date';
    }
    columnMeta[rawKey] = {
      kind, required: false
    };
  } return { masterName, masterRows, lookupTables, columnMeta };
}
