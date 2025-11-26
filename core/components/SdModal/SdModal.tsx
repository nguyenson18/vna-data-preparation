"use client"
import * as React from 'react';
import { Close } from '@mui/icons-material';
import { Box, IconButton, Modal, Stack, SxProps, Typography } from '@mui/material';
import { useState } from 'react';

export interface SdModalProps {
  sx?: SxProps;
  sxHeader?: SxProps;
  sxBody?: SxProps;
  opened?: boolean;
  title?: string;
  subTitle?: string;
  width?: string;
  maxHeight?: string;
  footer?: React.ReactNode;
  children?: any;
  hideClose?: boolean;
  onClose?: () => void;
}

export interface SdModalRef {
  open: () => void;
  close: () => void;
}

const Styles: Record<string, SxProps> = {
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    border: '1px solid #666b79',
    boxShadow: 24,
    borderRadius: '5px',
  },
  header: {
    padding: '4px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 0px 2px rgb(145 158 171 / 24%), 0px 4px 4px -4px rgb(145 158 171 / 24%)',
  },
  body: {
    padding: '8px 8px',
    overflow: 'auto',
    maxHeight: '80vh',
  },
  footer: {
    padding: '4px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 0px 2px rgb(145 158 171 / 24%), 0px 4px 4px -4px rgb(145 158 171 / 24%)',
  },
};

export const SdModal = React.forwardRef<SdModalRef, SdModalProps>((props, ref) => {
  const [isOpened, setIsOpened] = React.useState(false);
  const { sx, sxHeader, sxBody, opened, title, subTitle, width, children, footer, onClose, hideClose } = props;
  const open = () => {
    setIsOpened(true);
  };
  const close = () => {
    setIsOpened(false);
    onClose?.();
  };
  React.useImperativeHandle(ref, () => ({
    open,
    close,
  }));

  React.useEffect(() => {
    setIsOpened(!!opened);
  }, [opened]);
  return (
    <Modal open={isOpened}>
      <Box style={{ width: width }} sx={{ ...Styles.modal, ...sx } as SxProps}>
        <Box sx={{ ...Styles.header, ...sxHeader } as SxProps}>
          <Stack direction="column">
            <Typography variant="h6">{title}</Typography>
            {!!subTitle && <Typography variant="subtitle1">{subTitle}</Typography>}
          </Stack>
          {!hideClose && (
            <IconButton
              aria-label="close"
              component="label"
              onClick={() => {
                close();
              }}>
              <Close />
            </IconButton>
          )}
        </Box>
        <Box sx={{ ...Styles.body, ...sxBody } as SxProps}>{children}</Box>
        {!!footer && (
          <Box sx={Styles.footer}>
            <div></div>
            <div>{footer}</div>
          </Box>
        )}
      </Box>
    </Modal>
  );
});
SdModal.displayName = 'SdModal';
