import { SdButton, SdModal, SdModalRef } from "@/core/components";
import { SdInput } from "@/core/components/SdInput/SdInput";
import { LoadingService, NotifyService } from "@/core/components/services";
import { FileOpenrationService } from "@/services";
import { SaveOutlined, TrendingFlat } from "@mui/icons-material";
import {
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

interface Props {
  taskId: string;
  openModal: boolean;
  data: any;
  onClose: () => void;
  onAgree: () => void;
}

export const PreviewCovert = (props: Props) => {
  const { openModal, onClose, onAgree, taskId, data } = props;
  const sdModal = useRef<SdModalRef | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!calledRef.current) {
      calledRef.current = true;

      if (taskId && data) {
        getPreview(taskId, data);
      }
    }
  }, []);

  const getPreview = async (taskId: string, data: any) => {
    LoadingService.start();
    try {
      await FileOpenrationService.preview(taskId, data).then((res) => {
        setColumns(res.columns);
        setRows(res.sample_data);
      });
    } catch (err: any) {
      console.error("Có lỗi:", err);
    } finally {
      LoadingService.stop();
    }
  };

  return (
    <SdModal
      opened={!!openModal}
      ref={sdModal}
      width={"800px"}
      footer={
        <Stack my={2} spacing={2} direction={"row"}>
          <SdButton
            label="Hủy"
            variant="text"
            color="secondary"
            onClick={() => onClose()}
          />
        </Stack>
      }
      title={"Xem mẫu dữ liệu"}
      onClose={onClose}
    >
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: "0 0 0 1px #edf0f5",
          maxHeight: "700px",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns?.map((e, idx) => (
                <TableCell
                  key={idx}
                  align="left"
                  sx={{ fontWeight: 500, fontSize: "13px", minWidth: "130px" }}
                >
                  {e}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((e, idx) => (
              <TableRow key={idx}>
                {columns.map((cl) => (
                  <TableCell>{e[cl]}</TableCell>
                ))}
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
    </SdModal>
  );
};
