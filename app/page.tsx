"use client";
import React, { useCallback, useRef, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import FileDropzone from "@/components/FileDropzone";
import WorkbookGrid from "@/components/workbook/WorkbookGrid";
import { parseFile } from "@/lib/excel";
import { WorkbookData } from "@/lib/types";
import { SdButton, SdSelect } from "@/core/components";
import {
  Add,
  Delete,
  Group,
  More,
  UploadFileOutlined,
} from "@mui/icons-material";
import { LoadingService, NotifyService } from "@/core/components/services";
import { FileOpenrationService } from "@/services/FileOpenration.service";
import { FlexBasis1, FlexBasis21 } from "@/styles";
import {
  TypeGroup,
  PropsReq,
  payloadStartCoversion,
  ConverData,
} from "@/models/type";
import * as uuid from "uuid";
import { EmployeeMappingTable } from "@/components/EmployeeMappingTable";
import ConverLocationDetail from "@/components/popups/conver-location-detail";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const statusComfig = [
  {
    value: "all",
    display: "Tất cả",
  },
  {
    value: "success",
    display: "Thành công",
  },
  {
    value: "error",
    display: "Lỗi",
  },
];

export default function HomePage() {
  const [wb, setWb] = useState<WorkbookData | null>(null);
  const [valueTab, setValueTab] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState();
  const [activeStep, setActiveStep] = useState(0);
  const [req, setReq] = useState<PropsReq>();
  const [groups, setGroups] = useState<TypeGroup[]>([]);
  const [selects, setSelects] = useState<any[]>();
  const [anchorElMenu, setAnchorElMenu] = useState<null | HTMLElement>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [worker, setWorker] = useState<string>("1");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [infoConver, setInfoConver] = useState<ConverData>();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [row, setRow] = useState();
  const [valueStatus, setValueStatus] = useState<string>("all");

  const settings = [
    // {
    //   title: "Xem trước KQ",
    //   onClick: (id?: any) => {
    //     setAnchorElMenu(null);
    //   },
    // },
    {
      title: "Xóa nhóm",
      onClick: (id?: string) => {
        handleDeleteGroup(id);
      },
    },
  ];

  const steps = [
    {
      title: "Upload file file excel cần xử lý",
      desc: "Tải file Excel xử lý.",
    },
    {
      title: "Cấu hình mapping cột",
      desc: "Chỉ định cột mã/tên tỉnh, huyện, phường để hệ thống chuyển đổi.",
    },
    {
      title: "Trạng thái xử lý & Review kết quả chuyển đổi",
      desc: "Theo dõi tiến độ xử lý file và số lượng dòng đã mapping",
    },
  ];

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setValueTab(newValue);
  };

  const onFile = useCallback(async (f: File) => {
    LoadingService.start();
    try {
      const data = await parseFile(f);
      for (const [k, meta] of Object.entries(data.columnMeta)) {
        meta.required = false;
      }
      setWb(data);
    } catch (err) {
      console.log(err);
    } finally {
      LoadingService.stop();
    }
  }, []);

  const hasData = !!wb;

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorElMenu(event.currentTarget);
    setSelectedGroupId(id);
  };
  const handleCloseMenu = () => {
    setAnchorElMenu(null);
    setSelectedGroupId(null);
  };
  const handleDeleteGroup = (id?: string) => {
    if (id == null) return;
    setGroups((prev: TypeGroup[]) => prev?.filter((item, i) => item.id !== id));
    handleCloseMenu();
  };
  const handleAddGroup = () => {
    const newGroup = {
      id: uuid.v4(),
      id_district: "",
      id_province: "",
      id_ward: "",
      ward: "",
      district: "",
      province: "",
    };
    setGroups((prev: TypeGroup[]) => [newGroup, ...prev]);
  };
  const updateGroupField = useCallback(
    (groupId: string, field: keyof TypeGroup, nextValue: any) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, [field]: nextValue } : g))
      );
    },
    []
  );

  const handleChangeFile = (e: any) => {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : null);
    setFile(f);
  };

  const handleChangeSubmit = async () => {
    if (activeStep === 0) {
      if (!file) return;

      LoadingService.start();
      try {
        await FileOpenrationService.upload(file).then((res) => {
          const cusGroup = res?.groups.map((e) => ({ id: uuid.v4(), ...e }));
          setReq(res);
          setGroups(cusGroup);
          setSelects(res?.sample_preview?.columns);
          setActiveStep(res.step);
        });
        NotifyService.success("Upload thành công");
      } catch (err: any) {
        console.error("Có lỗi:", err);
        NotifyService.error(err?.message || "Có lỗi xảy ra");
      } finally {
        LoadingService.stop();
      }
    }

    if (activeStep === 1) {
      if (!req?.task_id) return;
      const payLoad: payloadStartCoversion = {
        groups: groups,
        n_workers: Number(worker),
      };
      LoadingService.start();
      try {
        await FileOpenrationService.startConversion(req?.task_id, payLoad).then(
          (res) => {
            setColumns(res.task.columns);
            setRows(res.task.result.full_data);
            setInfoConver(res);
            setActiveStep(res.task.step);
          }
        );
        NotifyService.success("Chuyển đổi hoàn tất!");
        setActiveStep(2);
      } catch (err: any) {
        console.error("Có lỗi:", err);
        NotifyService.error(err?.message || "Có lỗi xảy ra");
      } finally {
        LoadingService.stop();
      }
    }

    if (activeStep === 2) {
      if (!infoConver?.task.task_id) return;
      LoadingService.start();
      try {
        await FileOpenrationService.exportData(
          infoConver?.task.task_id,
          infoConver.task.filename
        );
        NotifyService.success("Download thành công");
      } catch (err: any) {
        console.error("Có lỗi:", err);
        NotifyService.error(err?.message || "Có lỗi xảy ra");
      } finally {
        LoadingService.stop();
      }
    }
  };

  const renderTilte = () => {
    switch (activeStep) {
      case 0:
        return "Tiếp tục";
      case 1:
        return "Bắt đầu xử lý";
      case 2:
        return "Tải file execel";
      default:
        break;
    }
  };

  const onAgree = async (e: any) => {
    if (!infoConver?.task.task_id) return;
    LoadingService.start();
    try {
      await FileOpenrationService.updateData(
        infoConver?.task.task_id,
        e.id_VNA,
        e
      );
      setRows((prev) =>
        prev.map((row) => (row.id_VNA === e.id_VNA ? { ...row, ...e } : row))
      );
      NotifyService.success("update thành công");
    } catch (err: any) {
      console.error("Có lỗi:", err);
      NotifyService.error(err?.message || "Có lỗi xảy ra");
    } finally {
      LoadingService.stop();
    }
  };

  const handleClose = () => {
    setOpenModal(false);
  };

  const handleSelect = async (value: string) => {
    setValueStatus(value);
    if (!infoConver?.task.task_id) return;
    LoadingService.start();
    try {
      await FileOpenrationService.filterStatus(
        value,
        infoConver?.task.task_id
      ).then((res) => {
        setRows(res.full_data);
      });
    } catch (err: any) {
      console.error("Có lỗi:", err);
      NotifyService.error(err?.message || "Có lỗi xảy ra");
    } finally {
      LoadingService.stop();
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label="Chuẩn hóa Excel" {...a11yProps(0)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <Typography variant="h6">Chuẩn hóa Excel</Typography>
        {isLoading && (
          <Stack alignItems="center" py={3}>
            <CircularProgress />
            <Typography sx={{ mt: 1 }}>Đang xử lý…</Typography>
          </Stack>
        )}

        {!isLoading && !hasData && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <FileDropzone onFile={onFile} />
          </Paper>
        )}

        {!isLoading && hasData && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Sheet tổng: <b>{wb!.masterName}</b>
            </Typography>
            <WorkbookGrid data={wb!} setData={setWb} />
          </Paper>
        )}
      </CustomTabPanel> */}
      <AppBar position="fixed" sx={{ backgroundColor: "white" }}>
        <Toolbar>
          <Stack
            className="container"
            direction={"row"}
            justifyContent={"space-between"}
          >
            <Avatar alt="Remy Sharp" src="/logo.png" />
            <Box>
              {activeStep > 0 && (
                <SdButton
                  label={"Trở về"}
                  variant="text"
                  color="secondary"
                  disabled={!file}
                  onClick={() => {
                    setActiveStep(activeStep - 1);
                  }}
                />
              )}
              <SdButton
                label={renderTilte()}
                disabled={!file}
                onClick={handleChangeSubmit}
              />
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: (t) => t.palette.grey[100],
          py: 4,
          mt: "50px",
        }}
      >
        <Container maxWidth="md">
          {/* Header */}
          <Stack spacing={0.75} sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: "black" }}>
              Tạo đợt xử lý mới
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Thiết lập thông tin đợt xử lý, upload file dữ liệu và cấu hình
              mapping cột.
            </Typography>
          </Stack>

          {/* Quy trình card */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              mb: 3,
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, letterSpacing: 0.5, mb: 2 }}
            >
              QUY TRÌNH
            </Typography>

            <Stack spacing={2}>
              {steps.map((s, idx) => {
                const active = idx <= activeStep;
                return (
                  <Stack
                    key={s.title}
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                  >
                    {/* number circle */}
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        mt: 0.2,
                        ...(active
                          ? {
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                              boxShadow: (t) =>
                                `0 0 0 3px ${t.palette.primary.light}22`,
                            }
                          : {
                              bgcolor: "transparent",
                              color: "text.secondary",
                              border: (t) => `2px solid ${t.palette.grey[300]}`,
                            }),
                      }}
                    >
                      {idx + 1}
                    </Box>

                    {/* text */}
                    <Stack spacing={0.25}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color: active ? "text.primary" : "text.secondary",
                        }}
                      >
                        {s.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: active ? "text.secondary" : "text.disabled",
                        }}
                      >
                        {s.desc}
                      </Typography>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Typography>
              Gợi ý : Đảm bảo file có header cột rõ ràng (Mã tỉnh, Mã huyện, Mã
              phường...).
            </Typography>
          </Paper>

          {/* Step 1 card */}
          {activeStep === 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: "background.paper",
              }}
            >
              {/* Card header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1">
                  <Box component="span" fontWeight={700}>
                    Bước 1:
                  </Box>{" "}
                  Upload file excel cần xử lý
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Bước 1 / 3
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ mb: 1 }} fontWeight={600}>
                File dữ liệu cần chuyển đổi
              </Typography>

              {/* Dropzone */}
              <Box
                sx={{
                  border: (t) => `2px solid ${t.palette.grey[300]}`,
                  borderRadius: 2,
                  minHeight: 260,
                  display: "grid",
                  placeItems: "center",
                  p: 3,
                  bgcolor: "background.default",
                }}
              >
                <Stack spacing={1.2} alignItems="center" textAlign="center">
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      color: "text.secondary",
                      border: (t) => `1px solid ${t.palette.grey[300]}`,
                      bgcolor: "background.paper",
                    }}
                  >
                    <UploadFileOutlined fontSize="large" />
                  </Box>

                  <Typography variant="subtitle1" fontWeight={600}>
                    Kéo và thả file Excel vào đây
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Hoặc
                  </Typography>

                  <Button
                    variant="contained"
                    component="label"
                    sx={{ px: 3, borderRadius: 1.5, textTransform: "none" }}
                  >
                    Chọn file từ máy
                    <input
                      hidden
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => handleChangeFile(e)}
                    />
                  </Button>

                  {/* selected file name (UI only) */}
                  {fileName && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Đã chọn: <b>{fileName}</b>
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Hỗ trợ .xlsx, .xls, .csv. Dung lượng tệp tối đa: 500,000
                    dòng
                  </Typography>
                </Stack>
              </Box>
            </Paper>
          )}

          {/* step 2 */}
          {activeStep === 1 && (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: "background.paper",
              }}
            >
              {/* card header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1">
                  <Box component="span" fontWeight={700}>
                    Bước 2:
                  </Box>{" "}
                  Cấu hình mapping cột
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Bước 2 / 3
                </Typography>
              </Box>
              <Stack
                direction={"row"}
                justifyContent={"space-between"}
                alignItems={"center"}
              >
                <Typography variant="body2" color="text.secondary">
                  Chỉ định cột mã/ tên tỉnh, huyện, phường để hệ thống chuyển
                  đổi.
                </Typography>
                <Stack direction={"row"} alignItems={"center"} spacing={1}>
                  <SdSelect
                    sx={{ width: "150px" }}
                    label="Nhân/luồng"
                    value={worker}
                    items={[
                      { value: "1", display: "1" },
                      { value: "2", display: "2" },
                      { value: "3", display: "3" },
                      { value: "4", display: "4" },
                      { value: "5", display: "5" },
                      { value: "6", display: "6" },
                      { value: "7", display: "7" },
                      { value: "8", display: "8" },
                    ]}
                    sdChange={(item: any, value: any) => setWorker(value)}
                  />
                  <SdButton
                    label="Thêm nhóm"
                    variant="outlined"
                    icon={<Add />}
                    onClick={handleAddGroup}
                  />
                </Stack>
              </Stack>

              {groups?.length &&
                groups.length > 0 &&
                groups.map((item, index) => (
                  <Stack
                    key={index}
                    sx={{
                      bgcolor: "background.paper",
                      borderRadius: "8px",
                      boxShadow: 1,
                      p: 2,
                    }}
                    direction={"column"}
                    spacing={1}
                    mt={1}
                  >
                    <Stack
                      direction={"row"}
                      alignContent={"center"}
                      justifyContent={"space-between"}
                    >
                      <Typography>** Nhóm {index + 1}</Typography>
                      <IconButton onClick={(e) => handleOpenMenu(e, item.id!)}>
                        <More />
                      </IconButton>
                      <Menu
                        sx={{ mt: "45px" }}
                        id="menu-appbar"
                        anchorEl={anchorElMenu}
                        transitionDuration={0}
                        anchorOrigin={{
                          vertical: "top",
                          horizontal: "right",
                        }}
                        keepMounted
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "right",
                        }}
                        open={Boolean(anchorElMenu)}
                        onClose={handleCloseMenu}
                      >
                        {settings.map((setting, index) => (
                          <MenuItem
                            key={index}
                            onClick={() => setting.onClick(selectedGroupId!)}
                          >
                            <Typography sx={{ textAlign: "center" }}>
                              {setting.title}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Menu>
                    </Stack>

                    <Stack
                      direction={"row"}
                      spacing={1}
                      flexWrap="wrap"
                      rowGap={2}
                      mt={2}
                      useFlexGap
                    >
                      <SdSelect
                        label="Mã tỉnh"
                        sx={{
                          flexBasis: {
                            lg: FlexBasis21,
                            sm: FlexBasis21,
                            xs: FlexBasis1,
                          },
                        }}
                        value={item.id_province}
                        items={
                          selects?.map((e) => ({
                            value: e,
                            display: e,
                          })) || []
                        }
                        sdChange={(e: any, value: any) => {
                          updateGroupField(item.id!, "id_province", value);
                        }}
                      />
                      <SdSelect
                        label="Tên tỉnh"
                        sx={{
                          flexBasis: {
                            lg: FlexBasis21,
                            sm: FlexBasis21,
                            xs: FlexBasis1,
                          },
                        }}
                        value={item.province}
                        items={
                          selects?.map((e) => ({
                            value: e,
                            display: e,
                          })) || []
                        }
                        sdChange={(e: any, value: any) => {
                          updateGroupField(item.id!, "province", value);
                        }}
                      />
                      <SdSelect
                        label="Mã quận/huyện/TP"
                        sx={{
                          flexBasis: {
                            lg: FlexBasis21,
                            sm: FlexBasis21,
                            xs: FlexBasis1,
                          },
                        }}
                        value={item.id_district}
                        items={
                          selects?.map((e) => ({
                            value: e,
                            display: e,
                          })) || []
                        }
                        sdChange={(e: any, value: any) => {
                          updateGroupField(item.id!, "id_district", value);
                        }}
                      />
                      <SdSelect
                        label="Tên quận/huyện/TP"
                        sx={{
                          flexBasis: {
                            lg: FlexBasis21,
                            sm: FlexBasis21,
                            xs: FlexBasis1,
                          },
                        }}
                        value={item.district}
                        items={
                          selects?.map((e) => ({
                            value: e,
                            display: e,
                          })) || []
                        }
                        sdChange={(e: any, value: any) => {
                          updateGroupField(item.id!, "district", value);
                        }}
                      />
                      <SdSelect
                        label="Mã phường/xã"
                        sx={{
                          flexBasis: {
                            lg: FlexBasis21,
                            sm: FlexBasis21,
                            xs: FlexBasis1,
                          },
                        }}
                        value={item.id_ward}
                        items={
                          selects?.map((e) => ({
                            value: e,
                            display: e,
                          })) || []
                        }
                        sdChange={(e: any, value: any) => {
                          updateGroupField(item.id!, "id_ward", value);
                        }}
                      />
                      <SdSelect
                        label="Tên phường/xã"
                        sx={{
                          flexBasis: {
                            lg: FlexBasis21,
                            sm: FlexBasis21,
                            xs: FlexBasis1,
                          },
                        }}
                        value={item.ward}
                        items={
                          selects?.map((e) => ({
                            value: e,
                            display: e,
                          })) || []
                        }
                        sdChange={(e: any, value: any) => {
                          updateGroupField(item.id!, "ward", value);
                        }}
                      />
                    </Stack>
                  </Stack>
                ))}
            </Paper>
          )}
          {/* STEP 3 */}
          {activeStep == 2 && (
            <>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  mb: 2,
                }}
              >
                {/* card header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1">
                    <Box component="span" fontWeight={700}>
                      Bước 3:
                    </Box>{" "}
                    Trạng thái xử lý
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Bước 3 / 3
                  </Typography>
                </Box>

                <Stack direction={"column"} spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Theo dõi tiếng độ xử lý file và số lượng dòng đã mapping.
                  </Typography>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={0.5}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Tiến độ xử lý
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {`${Math.round(infoConver?.task.progress || 0)}%`}
                    </Typography>
                  </Stack>

                  {/* Thanh progress */}
                  <LinearProgress
                    variant="determinate"
                    value={infoConver?.task.progress || 0}
                    sx={{
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: "#e5e5f0",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        backgroundColor: "#05051b", // màu đậm giống hình
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Đang xử lý: {infoConver?.task.filesize || 0}
                  </Typography>
                </Stack>
                <Grid
                  container
                  rowSpacing={2}
                  columnSpacing={5}
                  mt={2}
                  justifyContent="flex-start"
                >
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: "#F9FAFB",
                        minHeight: 80,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          textTransform: "uppercase",
                          fontWeight: 600,
                          letterSpacing: 0.8,
                          mb: 0.5,
                          color: "#111827",
                        }}
                      >
                        TỔNG SỐ DÒNG
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 24,
                          fontWeight: 500,
                          color: "#111827",
                        }}
                      >
                        {infoConver?.task.result.total_rows || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: "#ECFDF3",
                        minHeight: 80,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          textTransform: "uppercase",
                          fontWeight: 600,
                          letterSpacing: 0.8,
                          mb: 0.5,
                          color: "#16A34A",
                        }}
                      >
                        Mappping HOÀN THÀNH
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 24,
                          fontWeight: 500,
                          color: "#16A34A",
                        }}
                      >
                        {infoConver?.task.result.success_count || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: "#FEF3E2",
                        minHeight: 80,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          textTransform: "uppercase",
                          fontWeight: 600,
                          letterSpacing: 0.8,
                          mb: 0.5,
                          color: "#DC2626",
                        }}
                      >
                        lỖI/CẦN RÀ SOÁT
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 24,
                          fontWeight: 500,
                          color: "#DC2626",
                        }}
                      >
                        {infoConver?.task.result.fail_count || 0}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1">
                    Review kết quả chuyển đổi
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Lọc và kiểm tra các dòng lỗi hoặc mặc mới, chỉnh sửa nếu cần
                    trước khi export.
                  </Typography>
                </Box>

                <SdSelect
                  label="Trạng thái"
                  sx={{ width: "150px", mb: 1 }}
                  value={valueStatus}
                  items={statusComfig}
                  sdChange={(e: any, value: any) => handleSelect(value)}
                />
                <EmployeeMappingTable
                  columns={columns}
                  rows={rows}
                  onEditRow={(row) => {
                    setOpenModal(true);
                    setRow(row);
                  }}
                />
              </Paper>
            </>
          )}
        </Container>
        {openModal && (
          <ConverLocationDetail
            openModal={openModal}
            row={row}
            columns={columns}
            onClose={handleClose}
            onAgree={(e) => {
              onAgree(e);
              setOpenModal(false);
            }}
          />
        )}
      </Box>
    </Box>
  );
}
