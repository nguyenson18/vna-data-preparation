// lib/lookup/index.ts
export type LookupOption = { code: string | number; display?: string };
export type LookupTable = { options?: LookupOption[] };
export type ColumnMeta =
  | { kind: "lookup"; lookupName: string; required?: boolean }
  | { kind: "number"; required?: boolean }
  | { kind: "date"; required?: boolean }
  | { kind: "text"; required?: boolean }
  | { kind: string; [k: string]: any };

export function buildLookupMaps(lookupTables: Record<string, LookupTable> = {}) {
  const maps: Record<
    string,
    {
      codeToDisplay: Map<string, string>;
      displayToCode: Map<string, string>;
      codeSet: Set<string>;
    }
  > = {};

  for (const [name, tbl] of Object.entries(lookupTables)) {
    const codeToDisplay = new Map<string, string>();
    const displayToCode = new Map<string, string>();
    const codeSet = new Set<string>();
    for (const opt of tbl?.options ?? []) {
      const code = String(opt.code ?? "").trim();
      const display = String(opt.display ?? code).trim();
      codeToDisplay.set(code, display);
      codeSet.add(code);
      displayToCode.set(display.toLowerCase(), code);
      displayToCode.set(code.toLowerCase(), code);
    }
    maps[name] = { codeToDisplay, displayToCode, codeSet };
  }
  return maps;
}

export function normalizeLookupInput(
  rawValue: any,
  meta?: { kind?: string; lookupName?: string; required?: boolean },
  lookupMaps?: ReturnType<typeof buildLookupMaps>
) {
  if (!meta || meta.kind !== "lookup" || !meta.lookupName) return rawValue;

  const s = String(rawValue ?? "").trim();
  if (!s) return "";

  const m = lookupMaps?.[meta.lookupName];
  if (!m) return s;

  if (m.codeSet.has(s)) return s;

  const mt = s.match(/\(([^)]+)\)\s*$/);
  if (mt && m.codeSet.has(mt[1])) return mt[1];

  const byDisplay = m.displayToCode.get(s.toLowerCase());
  if (byDisplay) return byDisplay;

  return s;
}

export function getDisplayText(
  field: string,
  rawValue: any,
  columnMeta: Record<string, ColumnMeta>,
  lookupMaps?: ReturnType<typeof buildLookupMaps>
) {
  const meta = columnMeta[field];
  if (meta?.kind === "lookup" && (meta as any).lookupName) {
    const code = normalizeLookupInput(rawValue, meta as any, lookupMaps);
    const table = (meta as any).lookupName as string;
    const maps = lookupMaps?.[table];
    return maps?.codeToDisplay.get(String(code)) ?? String(rawValue ?? "");
  }
  return rawValue ?? "";
}
