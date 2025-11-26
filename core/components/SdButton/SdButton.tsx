"use client";
import { LoadingButton } from '@mui/lab';
import { IconButton, SxProps } from '@mui/material';
import { JSX, MouseEventHandler } from 'react';

export interface SdButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  label?: string;
  variant?: 'text' | 'contained' | 'outlined';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
  icon?: JSX.Element;
  endIcon?: JSX.Element;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  sx?: SxProps;
  type?: 'button' | 'reset' | 'submit';
}

export function SdButton(props: SdButtonProps) {
  const { sx, onClick, label, variant, color, size, icon, endIcon, loading, disabled } = props;
  if (!icon && !label) {
    return null;
  }
  if (!label) {
    return (
      <IconButton sx={sx} color={color} size={size || 'small'} onClick={onClick} disabled={disabled}>
        {icon}
      </IconButton>
    );
  }
  return (
    <LoadingButton
      sx={{ textTransform: 'none', ...sx }}
      {...props}
      variant={variant || 'contained'}
      color={color || 'primary'}
      size={size}
      loading={loading}
      // loadingPosition='start'
      onClick={onClick}
      startIcon={icon}
      endIcon={endIcon}
      disabled={disabled}>
      {label}
    </LoadingButton>
  );
}
