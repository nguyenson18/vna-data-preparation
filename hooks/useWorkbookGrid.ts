// hooks/useWorkbookGrid.ts
"use client";
import React, { useCallback, useState, useMemo } from "react";
import * as uuid from "uuid";
import {
  GridPaginationModel,
  GridRowId,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { WorkbookData } from "@/lib/types";
import { exportWorkbookToExcel } from "@/lib/exportExcel";
import { buildLookupMaps, normalizeLookupInput, ColumnMeta } from "@/lib/lookup";
import { isValidUSDate, normalizeDateInput } from "@/lib/date";

export function useWorkbookGrid(
  data: WorkbookData | null,
  setData: (d: WorkbookData | null) => void
) {
  const [selection, setSelection] = useState<GridRowSelectionModel>({
  type: "include",
  ids: new Set<GridRowId>(),
});

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [validatedCols, setValidatedCols] = useState<string[]>([]);
  const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set());

  const cellKey = useCallback(
    (rowId: GridRowId, field: string) => `${rowId}::${field}`,
    []
  );

  const rows = useMemo(
    () =>
      (data?.masterRows ?? []).map((r, i) => ({
        id: r.id ?? uuid.v4(),
        ...r,
      })),
    [data]
  );

  const idToIndex = useMemo(() => {
    const m = new Map<GridRowId, number>();
    rows.forEach((r, i) => m.set(r.id, i));
    return m;
  }, [rows]);

  const lookupMaps = useMemo(
    () => buildLookupMaps(data?.lookupTables ?? {}),
    [data?.lookupTables]
  );

  const isLockedById = useCallback(
    (rowId: GridRowId) => {
      const idx = idToIndex.get(rowId);
      return idx !== undefined && idx < 2;
    },
    [idToIndex]
  );

  const validateValue = useCallback(
    (field: string, value: any, meta?: any) => {
      if (!validatedCols.includes(field)) return true;

      // required trống → sai
      const isEmpty = (v: any) =>
        v === null || v === undefined || String(v).trim() === "";

      if (meta?.kind === "lookup" && meta.lookupName) {
        const maps = lookupMaps[meta.lookupName];
        const codeSet = maps?.codeSet;
        if (isEmpty(value)) return meta?.required; // trống hợp lệ nếu không required
        return !!codeSet?.has(String(value)); // phải là code hợp lệ
      }

      if (meta?.kind === "number") {
        if (isEmpty(value)) return !meta?.required;
        return Number.isFinite(Number(value));
      }

      if (meta?.kind === "date") {
        return isValidUSDate(value);
      }
      if (meta?.kind === "text") {
        if (value === null || String(value).trim() === "")
          return meta?.required;
        return true;
      }
    },
    [validatedCols]
  );

  const runFullValidation = useCallback(() => {
    if (!data) return;
    const next = new Set<string>();
    const dataRows = rows.slice(0);
    for (const r of dataRows) {
      for (const [field, meta] of Object.entries(data.columnMeta)) {
        if (!validatedCols.includes(field)) continue;
        let v: any = (r as any)[field];
        if (meta.kind === "lookup") v = normalizeLookupInput(v, meta as any);
        if (meta.kind === "date") v = normalizeDateInput(v);
        const ok = validateValue(field, v, meta);
        if (!ok) next.add(cellKey(r.id, field));
      }
    }
    setInvalidCells(next);
  }, [data, rows, validatedCols, validateValue, cellKey]);

  // Render cell
  const setCell = useCallback(
    (rowId: GridRowId, field: string, rawValue: any) => {
      if (!data) return;
      if (isLockedById(rowId)) return;
      const idx = idToIndex.get(rowId);
      if (idx == null) return;

      const meta = data.columnMeta[field];
      let value: any = rawValue;

      if (meta?.kind === "number") {
        value = rawValue === "" ? "" : Number(rawValue);
        if (!Number.isFinite(value) && rawValue !== "") return;
      }

      if (meta?.kind === "lookup" && meta.lookupName) {
        const maps = lookupMaps[meta.lookupName];
        value = normalizeLookupInput(rawValue, meta); // <— CHỦ ĐẠO: chuẩn hoá về code
        const ok = value === "" || maps?.codeSet?.has(String(value));
        if (!ok && meta.required) return; // hoặc gắn invalidCells tuỳ bạn
        value = String(value);
      }

      if (meta?.kind === "date") {
        const norm = normalizeDateInput(rawValue);
        if (norm === null) return; // giá trị không hợp lệ → bỏ qua commit
        value = norm; //
      }

      const current = data.masterRows[idx]?.[field];
      if (current === value) return;

      const next = [...data.masterRows];
      next[idx] = { ...next[idx], [field]: value };
      setData({ ...data, masterRows: next });
      // set flag invalid/valid cho ô
      setInvalidCells((prev) => {
        const nextSet = new Set(prev);
        const key = cellKey(rowId, field);
        const ok = validateValue(field, value, meta);
        if (!ok) nextSet.add(key);
        else nextSet.delete(key);
        return nextSet;
      });
    },
    [data, idToIndex, isLockedById, setData, lookupMaps, normalizeLookupInput]
  );

  const addRow = useCallback(() => {
    if (!data) return;

    // luôn tạo id ổn định để DataGrid không bị “mất” selection sau re-render
    const newId = uuid.v4();

    const empty: any = { id: newId };
    for (const k of Object.keys(data.columnMeta)) empty[k] = "";

    const insertAt = 2; // dòng thứ 3 (sau 2 dòng bị khóa)
    const next = [...data.masterRows];
    next.splice(insertAt, 0, empty);

    setData({ ...data, masterRows: next });

    // đảm bảo trang hiện tại hiển thị được dòng vừa chèn
    setPaginationModel((prev) => {
      const page = Math.floor(insertAt / prev.pageSize);
      return { page, pageSize: prev.pageSize };
    });
  }, [data, setData, setPaginationModel, data?.columnMeta]);

const deleteSelected = useCallback(() => {
  if (!data) return;

  const selectedIds =
    selection.type === "include"
      ? Array.from(selection.ids)
      : rows.map(r => r.id).filter(id => !selection.ids.has(id)); // nếu có case exclude

  const selectedIdx = new Set(
    selectedIds
      .map((id) => idToIndex.get(id))
      .filter((i): i is number => typeof i === "number")
  );

  const next = data.masterRows.filter((_, idx) => {
    if (idx < 2) return true;
    return !selectedIdx.has(idx);
  });

  setSelection({ type: "include", ids: new Set<GridRowId>() });
  setData({ ...data, masterRows: next });
}, [data, selection, rows, idToIndex, setData]);


  const handleExport = useCallback(() => {
    if (!data) return;

    const exportedRows = ((data as any).masterRows ?? []).map((r: any, i: number) => {
      const out: any = { id: i };
      for (const [field, meta] of Object.entries(
        (data as any).columnMeta as Record<string, ColumnMeta>
      )) {
        const raw = r[field];

        if (meta.kind === "lookup" && (meta as any).lookupName) {
          const code = normalizeLookupInput(raw, meta as any, lookupMaps);
          const maps = lookupMaps[(meta as any).lookupName];
          const ok = code === "" || maps?.codeSet?.has(String(code));
          out[field] = ok ? String(code ?? "") : "";
        } else if (meta.kind === 'date') {
          const iso = normalizeDateInput(raw, {
            acceptExcelSerial: true,
            preferDMY: true,
          });
          out[field] = iso
        }
        else if (meta.kind === "number") {
          out[field] =
            raw === "" || raw == null ? "" : Number(raw);
        } else {
          out[field] = raw ?? "";
        }
      }
      return out;
    });

    exportWorkbookToExcel(
      data as any,
      exportedRows as any[],
      `${(data as any).masterName || "export"}.xlsx`
    );
  }, [data, lookupMaps]);

  const clearAll = useCallback(() => setData(null), [setData]);

  return {
    rows,
    selection,
    setSelection,
    paginationModel,
    setPaginationModel,
    validatedCols,
    setValidatedCols,
    invalidCells,
    setInvalidCells,
    cellKey,
    isLockedById,
    runFullValidation,
    setCell,
    addRow,
    deleteSelected,
    handleExport,
    clearAll,
    lookupMaps,
  };
}
