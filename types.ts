export type LookupOption = { code: string | number; display: string };


export type LookupTable = {
  name: string;
  codeKey: string;
  displayKey: string;
  options: LookupOption[];
  codeSet: Set<string>;
  displayMap: Map<string, string>;
};

export type WorkbookData = {
  masterName: string;
  masterRows: Record<string, any>[];
  lookupTables: Record<string, LookupTable>;
  columnMeta: Record<string, { kind: 'lookup' | 'text' | 'number' | 'date'; lookupName?: string; required?: boolean }>
};

export type ValidationIssue = {
  rowIndex: number; // index theo masterRows (0-based)
  field: string;
  message: string;
};

export type ValidationResult = {
  issues: ValidationIssue[];
};
