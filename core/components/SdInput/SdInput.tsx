"use client";
import { TextField, TextFieldProps } from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, FieldValues, UseControllerProps, UseFormReturn } from 'react-hook-form';
import * as uuid from 'uuid';
import styles from './SdInput.module.scss';

export interface SdInputProps {
  sdChange?: (value: string) => void;
  form?: UseFormReturn<FieldValues, any>;
  rules?: UseControllerProps['rules']; // form
  required?: boolean;
  // Styles
  extraSmall?: boolean;
  shrink?: boolean;
  disableErrorMessage?: boolean;
}

export function SdInput(props: SdInputProps & TextFieldProps) {
  const { value, form, required, extraSmall, shrink, disableErrorMessage } = props;
  const { sdChange, ...otherProps } = props; // Fix warning: React does not recognize the sdChange prop on a DOM element
  const [controlName, setControlName] = useState<string>('');
  let { sx, rules } = props;
  sx = {
    ...sx,
  };
  rules = {
    ...rules,
    required: rules?.required ?? required,
  };
  useEffect(() => {
    if (form) {
      if (!controlName) {
        setControlName(uuid.v4());
      }
    } else {
      setControlName('');
    }
    return () => {
      if (form && controlName) {
        const { unregister } = form;
        unregister(controlName);
      }
    };
  }, [form]);
  useEffect(() => {
    if (form && controlName) {
      const { setValue } = form;
      setValue(controlName, value);
    }
  }, [value, controlName]);
  if (form) {
    const {
      formState: { errors },
    } = form;
    const error = errors[controlName];
    let errorMessage = '';
    if (error) {
      if (error.type === 'required') {
        errorMessage = 'Dữ liệu không được để trống';
      }
      if (error.type === 'maxLength') {
        errorMessage = `Nhập tối đa ${rules?.maxLength} ký tự`;
      }
      if (error.type === 'minLength') {
        errorMessage = `Nhập tối thiểu ${rules?.minLength} ký tự`;
      }
      if (error.type === 'pattern') {
        errorMessage = 'Nhập không đúng định dạng';
      }
    }
    return (
      <Controller
        name={controlName}
        control={form.control}
        rules={rules}
        render={({ field }) => (
          <TextField
            {...field}
            className={extraSmall ? styles.extraSmall : ''}
            sx={sx}
            fullWidth
            InputLabelProps={{ shrink: !!value || value === 0 || shrink }}
            InputProps={{
              sx: {
                ...(extraSmall && {
                  paddingX: 0,
                }),
              },
            }}
            size={props.size || 'small'}
            id={controlName}
            error={!!errorMessage}
            helperText={disableErrorMessage ? '' : errorMessage || ' '}
            required={!!rules?.required}
            onChange={(event) => {
              field.onChange(event);
              sdChange?.(event.target.value);
            }}
            autoComplete="off"
            {...otherProps}
          />
        )}
      />
    );
  }
  return (
    <TextField
      className={extraSmall ? styles.extraSmall : ''}
      sx={sx}
      fullWidth
      InputLabelProps={{ shrink: !!value || value === 0 || shrink }}
      InputProps={{
        sx: {
          ...(extraSmall && {
            paddingX: 0,
          }),
        },
      }}
      onChange={(event) => {
        sdChange?.(event.target.value);
      }}
      size={props.size || 'small'}
      autoComplete="off"
      {...otherProps}
    />
  );
}
