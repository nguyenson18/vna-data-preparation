"use client";

import { MappingStatus } from "@/models/type";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Link,
} from "@mui/material";
import { useState } from "react";

type Props = {
  columns: any[];
  pageT?: number;
  pageSize?: number;
  rows: any[];
  onEditRow?: (row: any) => void;
};


export function EmployeeMappingTable({
  columns,
  pageT = 1,
  pageSize = 10,
  rows,
  onEditRow,
}: Props) {
  const [page, setPage] = useState(pageT)
  const [limit, setLimit] = useState(pageSize)
  const offset = limit * (page - 1);
  const count = rows.length
  const totalPage = Math.ceil(count / limit);
  const isFirstPage = page <= 1; 
  const isLastPage = page >= totalPage; 
  const startIndex = (page - 1) * limit;
  return (
    <Box sx={{ width: "100%" }}>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: "0 0 0 1px #edf0f5",
          maxHeight: "700px",
        }}
      >
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#F9FAFB" }}>
            <TableRow>
              <TableCell
                align="left"
                sx={{ fontWeight: 500, fontSize: "13px", minWidth: "130px" }}
              >
                STT
              </TableCell>
              {columns?.map((item, index) => (
                <TableCell
                  key={index}
                  align="left"
                  sx={{ fontWeight: 500, fontSize: "13px", minWidth: "130px" }}
                >
                  {item}
                </TableCell>
              ))}
              <TableCell
                align="left"
                sx={{ fontWeight: 500, fontSize: "13px", minWidth: "130px" }}
              >
                Thao tác
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.slice(offset, offset + limit).map((row, index) => (
              <TableRow key={row.id ?? index}>
                {/* STT tính theo trang */}
                <TableCell>{index + 1}</TableCell>

                {/* Cell theo đúng key trong columns */}
                {columns.map((col, colIndex) => {
                  return (
                    <TableCell key={colIndex}>
                      {row[col]} {/* row["Xã"], row["sdt"], ... */}
                    </TableCell>
                  );
                })}

                {/* Cột chỉnh sửa */}
                <TableCell>
                  <Link
                    component="button"
                    type="button"
                    sx={{ color: "#2563EB", fontSize: 14 }}
                    onClick={() => onEditRow?.(row)}
                  >
                    Chỉnh sửa
                  </Link>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography align="center" color="text.secondary">
                    Không có dữ liệu
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer phân trang động */}
      <Box
        mt={1}
        display="flex"
        justifyContent="flex-end"
        gap={1}
        sx={{ fontSize: 13 }}
      >
        <Box
          component="button"
          disabled={isFirstPage}
          onClick={() => !isFirstPage && setPage(page - 1)}
          style={{
            border: "none",
            background: "none",
            cursor: isFirstPage ? "default" : "pointer",
            color: isFirstPage ? "#9ca3af" : "#111827",
          }}
        >
          « Trang trước
        </Box>
        <Box>
          Trang {page} / {totalPage}
        </Box>
        <Box
          component="button"
          disabled={isLastPage}
          onClick={() => !isLastPage && setPage(page + 1)}
          style={{
            border: "none",
            background: "none",
            cursor: isLastPage ? "default" : "pointer",
            color: isLastPage ? "#9ca3af" : "#111827",
          }}
        >
          Trang sau »
        </Box>
      </Box>
    </Box>
  );
}
