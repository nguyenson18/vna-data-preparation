// components/workbook/cells/LockedCell.tsx
"use client";
import * as React from "react";
import { Box } from "@mui/material";

type Props = { title: string; children: React.ReactNode };

export default function LockedCell({ title, children }: Props) {
  return (
    <Box
      sx={{
        width: "100%",
        px: 1,
        py: 0.5,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      title={title}
    >
      {children}
    </Box>
  );
}
