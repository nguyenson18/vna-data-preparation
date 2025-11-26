import { SdButton, SdModal, SdModalRef, SdSelect } from "@/core/components";
import { SdInput } from "@/core/components/SdInput/SdInput";
import { FlexBasis1, FlexBasis21 } from "@/styles";
import { SaveOutlined } from "@mui/icons-material";
import { Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";

interface Props {
  id?: string;
  openModal: boolean;
  row?: any;
  columns?: string[];
  onClose: () => void;
  onAgree: (row: any) => void;
}

function ConverLocationDetail(props: Props) {
  const { id, openModal, onClose, onAgree, row, columns } = props;
  const [keys, setKeys] = useState<string[]>([]);
  const [req, setReq] = useState(row)
  const sdModal = useRef<SdModalRef | null>(null);
  useEffect(() => {
    if (row) {
      setKeys(Object.keys(row));
    }
  }, [row]);

  return (
    <SdModal
      opened={!!openModal}
      ref={sdModal}
      width={"700px"}
      footer={
        <Stack my={2} spacing={2} direction={"row"}>
          <SdButton
            label="Hủy"
            variant="text"
            color="secondary"
            onClick={() => onClose()}
          />
          <SdButton icon={<SaveOutlined />} label="Lưu" onClick={() => onAgree(req)} />
        </Stack>
      }
      title={"Chỉnh sửa thông tin"}
      onClose={onClose}
    >
      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        rowGap={1}
        mt={2}
        useFlexGap
      >
        {keys?.map((key, index) => (
          <SdInput
            key={`${index}-${key}`}
            label={key}
            sx={{
              flexBasis: {
                lg: FlexBasis21,
                sm: FlexBasis21,
                xs: FlexBasis1,
              },
            }}
            value={req?.[key] ?? ""}
            sdChange={(e:any) => {setReq({...req, [key]: e })}}
          />
        ))}
      </Stack>
    </SdModal>
  );
}
export default ConverLocationDetail;
