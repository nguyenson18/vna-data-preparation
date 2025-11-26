'use client';
import { Box, Button, Typography } from '@mui/material';
import { useCallback, useRef, useState } from 'react';

export default function FileDropzone({ onFile }: { onFile: (f: File) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <Box
      className="dropzone"
      sx={{ background: dragOver ? 'rgba(127,127,127,.1)' : 'transparent' }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <Typography variant="subtitle1" gutterBottom>
        Kéo‑thả file Excel vào đây hoặc
      </Typography>
      <Button variant="contained" onClick={() => inputRef.current?.click()}>Chọn tệp</Button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </Box>
  );
}
