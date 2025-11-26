// components/workbook/columns/buildColumns.tsx
"use client";
import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import { Select, MenuItem  } from "@mui/material";
import { DatePicker,LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

import ImeTextCell from "../cells/ImeTextCell";
import LockedCell from "../cells/LockedCell";
import { ColumnMeta, normalizeLookupInput, getDisplayText } from "@/lib/lookup";
import { normalizeDateInput } from "@/lib/date";



type BuildColumnsArgs = {
  data: {
    columnMeta: Record<string, ColumnMeta>;
    lookupTables?: Record<
      string,
      { options?: { code: string | number; display?: string }[] }
    >;
  };
  isLockedById: (rowId: any) => boolean;
  setCell: (rowId: any, field: string, value: any) => void;
  lookupMaps: ReturnType<typeof import("@/lib/lookup").buildLookupMaps>;
};

export function buildColumns({
  data,
  isLockedById,
  setCell,
  lookupMaps,
}: BuildColumnsArgs) {
  const columns: GridColDef[] = Object.keys(data.columnMeta).map((field) => {
    const meta = data.columnMeta[field];
    const base: GridColDef = {
      field,
      headerName: field,
      flex: 1,
      editable: true,
      width: 200,
      minWidth: 200,
      renderCell: (params) => {
        if (isLockedById(params.id)) {
          const title = getDisplayText(
            field,
            params.value,
            data.columnMeta,
            lookupMaps
          );
          return <LockedCell title={String(title)}>{title}</LockedCell>;
        }
        return (
          <ImeTextCell
            value={params.value ?? ""}
            onCommit={(v) => setCell(params.id, field, v)}
          />
        );
      },
    };

    if (meta.kind === "number") {
      base.type = "number";
      base.renderCell = (params) => {
        if (isLockedById(params.id)) {
          const title = getDisplayText(
            field,
            params.value,
            data.columnMeta,
            lookupMaps
          );
          return <LockedCell title={String(title)}>{title}</LockedCell>;
        }
        return (
          <ImeTextCell
            value={params.value ?? ""}
            type="text"
            inputProps={{ inputMode: "decimal" }}
            onCommit={(v) => setCell(params.id, field, v)}
          />
        );
      };
    }

    if (meta.kind === "lookup" && (meta as any).lookupName) {
      const table = (data.lookupTables ?? {})[(meta as any).lookupName];
      const valueOptions =
        table?.options?.map((o) => ({
          value: String(o.code),
          display: o.display || String(o.code),
        })) ?? [];

      base.renderCell = (params) => {
        if (isLockedById(params.id)) {
          const title = getDisplayText(
            field,
            params.value,
            data.columnMeta,
            lookupMaps
          );
          return <LockedCell title={String(title)}>{title}</LockedCell>;
        }
        const normalizedCode =
          (normalizeLookupInput(
            params.value,
            meta as any,
            lookupMaps
          ) as string) ?? "";

        return (
          <Select
            fullWidth
            size="small"
            value={normalizedCode}
            displayEmpty
            onChange={(e) => setCell(params.id, field, e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <MenuItem value="">
              <em>(trống)</em>
            </MenuItem>
            {valueOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.display}
              </MenuItem>
            ))}
          </Select>
        );
      };
    }

    if (meta.kind === "date") {
      base.renderCell = (params) => {
        if (isLockedById(params.id)) {
          const title = getDisplayText(
            field,
            params.value,
            data.columnMeta,
            lookupMaps
          );
          return <LockedCell title={String(title)}>{title}</LockedCell>;
        }
        const iso = normalizeDateInput(params.value, {
          acceptExcelSerial: true,
          preferDMY: true,
        });
        const d = iso ? dayjs(iso, "DD/MM/YYYY", true) : null;

        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={d && d.isValid() ? d : null}
              slotProps={{
                textField: {
                  size: "small",
                  onKeyDown: (e) => e.stopPropagation(),
                },
              }}
              onChange={(val) =>
                setCell(params.id, field, val ? val.format("YYYY-MM-DD") : "")
              }
              format="DD/MM/YYYY"
            />
          </LocalizationProvider>
        );
      };
    }

    return base;
  });

  return columns;
}
