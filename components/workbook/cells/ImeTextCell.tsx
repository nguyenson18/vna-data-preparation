// components/workbook/cells/ImeTextCell.tsx
"use client";
import * as React from "react";
import { TextField } from "@mui/material";

type Props = {
  value: any;
  onCommit: (v: string) => void;
  type?: string;
  inputProps?: any;
};

export default function ImeTextCell({
  value,
  onCommit,
  type = "text",
  inputProps,
}: Props) {
  const [draft, setDraft] = React.useState<string>(value ?? "");
  const composingRef = React.useRef(false);

  React.useEffect(() => {
    if (!composingRef.current) setDraft(value ?? "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
  };

  return (
    <TextField
      size="small"
      type={type}
      value={draft}
      onChange={handleChange}
      onCompositionStart={() => (composingRef.current = true)}
      onCompositionEnd={(e) => {
        composingRef.current = false;
        onCommit((e.target as HTMLInputElement).value);
      }}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if ((e as any).nativeEvent?.isComposing) return;
        if (e.key === "Enter") onCommit(draft);
      }}
      inputProps={inputProps}
      fullWidth
    />
  );
}
