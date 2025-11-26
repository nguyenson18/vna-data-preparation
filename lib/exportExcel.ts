
'use client';
import * as XLSX from 'xlsx';
import { WorkbookData } from './types';

/** Xuất Excel: sheet tổng (rows hiện tại) + toàn bộ sheet lookup */
export function exportWorkbookToExcel(wbData: WorkbookData, rows: any[], filename = 'export.xlsx') {
  const cleanRows = rows.map((r:any) => { const { id, ...rest } = r; return rest; });

  const wb = XLSX.utils.book_new();
  const wsMaster = XLSX.utils.json_to_sheet(cleanRows);
  XLSX.utils.book_append_sheet(wb, wsMaster, (wbData.masterName || 'Master').slice(0,31));

  Object.values(wbData.lookupTables).forEach(tbl => {
    const data = tbl.options.map(o => ({ code: o.code, display: o.display }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, (tbl.name || 'Lookup').slice(0,31));
  });

  XLSX.writeFile(wb, filename);
}
