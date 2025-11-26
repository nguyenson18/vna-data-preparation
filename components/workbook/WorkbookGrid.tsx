// components/workbook/WorkbookGrid.tsx
"use client";
import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Button,
  Tooltip,
  TextField,
  Autocomplete,
  Checkbox,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";

import { WorkbookData } from "@/lib/types";
import { useWorkbookGrid } from "@/hooks/useWorkbookGrid";
import { buildColumns } from "./columns/buildColumns";

const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;

type Props = {
  data: WorkbookData;
  setData: (d: WorkbookData | null) => void;
};

export default function WorkbookGrid({ data, setData }: Props) {
  const {
    rows,
    selection,
    setSelection,
    paginationModel,
    setPaginationModel,
    validatedCols,
    setValidatedCols,
    invalidCells,
    cellKey,
    isLockedById,
    runFullValidation,
    setCell,
    addRow,
    deleteSelected,
    handleExport,
    clearAll,
    lookupMaps,
  } = useWorkbookGrid(data, setData);

  const selectedCount =
  selection.type === "include"
    ? selection.ids.size
    : rows.length - selection.ids.size;

  const columns = React.useMemo(
    () =>
      buildColumns({
        data,
        isLockedById,
        setCell,
        lookupMaps,
      }),
    [data, isLockedById, setCell, lookupMaps]
  );

  return (
    <Box>
      <Paper>
        <Autocomplete
          multiple
          size="medium"
          sx={{ minWidth: 300, my: 2 }}
          options={Object.keys((data as any).columnMeta)}
          value={validatedCols}
          onChange={(_, val) => setValidatedCols(val)}
          disableCloseOnSelect
          openOnFocus
          filterSelectedOptions
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                checked={selected}
                style={{ marginRight: 8 }}
              />
              {option}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Cột cần validate"
              placeholder="Chọn..."
            />
          )}
        />
      </Paper>

      <Stack direction="row" spacing={1} className="toolbar" sx={{ mb: 1 }}>
        <Tooltip title="Thêm 1 dòng trống">
          <Button startIcon={<AddIcon />} variant="outlined" onClick={addRow}>
            Thêm dòng
          </Button>
        </Tooltip>
        <Tooltip title="Xoá các dòng đã chọn">
          <span>
            <Button
              startIcon={<DeleteIcon />}
              variant="outlined"
              disabled={selectedCount === 0}
              color="error"
              onClick={deleteSelected}
            >
              Xoá dòng
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Chạy kiểm tra toàn bộ các cột đã chọn">
          <Button variant="outlined" onClick={runFullValidation}>
            Kiểm tra toàn bộ
          </Button>
        </Tooltip>
        <Tooltip title="Xuất Excel từ dữ liệu đang hiển thị">
          <Button
            startIcon={<DownloadIcon />}
            variant="contained"
            onClick={handleExport}
          >
            Xuất Excel
          </Button>
        </Tooltip>
        <Tooltip title="Xoá toàn bộ dữ liệu đang mở">
          <Button
            startIcon={<CleaningServicesIcon />}
            color="warning"
            variant="text"
            onClick={clearAll}
          >
            Xoá dữ liệu
          </Button>
        </Tooltip>
      </Stack>

      <div style={{ height: 650, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          density="standard"
          isRowSelectable={(params) => !isLockedById(params.id)}
          isCellEditable={(params) => !isLockedById(params.id)}
          rowSelectionModel={selection}
          onRowSelectionModelChange={(ids) => setSelection(ids)}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[20,50, 100]}
          getCellClassName={(params) =>
            invalidCells.has(cellKey(params.id, params.field))
              ? "cell-invalid"
              : ""
          }
          sx={{
            ".MuiDataGrid-cell": { display: "flex", alignItems: "center" },
            "& .cell-invalid": { backgroundColor: "rgba(255, 0, 0, 0.06)" },
            "& .cell-invalid .MuiOutlinedInput-notchedOutline": {
              borderColor: "error.main !important",
              borderWidth: "1px",
            },
            "& .cell-invalid .MuiInputBase-root": {
              backgroundColor: "rgba(255, 0, 0, 0.04)",
            },
          }}
        />
      </div>
    </Box>
  );
}
