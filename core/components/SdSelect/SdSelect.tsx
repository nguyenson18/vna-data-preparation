"use client";
import { Checkbox, FormControl, FormHelperText, InputLabel, ListItemText, MenuItem, OutlinedInput, SxProps, Tooltip } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { Controller, FieldValues, UseControllerProps, UseFormReturn } from 'react-hook-form';
import * as uuid from 'uuid';

export interface SdSelectOption<T = any> {
  value: any;
  display: any;
  data?: T;
}

export type SdSelectProps<T> = SdSelectNormalProps<T> | SdSelectBoolProps<T>;

export interface SdSelectNormalProps<T> {
  sx?: SxProps;
  label?: string;
  tooltip?: boolean;
  value?: string | string[] | undefined | null;
  items: SdSelectOption<T>[];
  sdChange?: (item: SdSelectOption<T> | undefined, value?: string | string[]) => void;
  template?: (item: SdSelectOption<T> | null) => React.ReactNode;
  disabled?: boolean;
  form?: UseFormReturn<FieldValues, any>;
  rules?: UseControllerProps['rules']; // form
  required?: boolean;
  multiple?: boolean;
  disableErrorMessage?: boolean;
}

export interface SdSelectBoolProps<T> {
  sx?: SxProps;
  label?: string;
  tooltip?: boolean;
  value?: boolean | undefined | null | string[];
  items: {
    displayOnTrue: string;
    displayOnFalse: string;
  };
  sdChange: (item: SdSelectOption<T> | undefined, value?: boolean) => void;
  template?: (item: SdSelectOption<T> | null) => React.ReactNode;
  disabled?: boolean;
  form?: UseFormReturn<FieldValues, any>;
  rules?: UseControllerProps['rules']; // form
  required?: boolean;
  multiple?: boolean;
  disableErrorMessage?: boolean;
}
const SD_EMPTY_VALUE = 'SD_EMPTY_VALUE';
const SD_PLEASE_SELECT = 'Vui lòng chọn';
export function SdSelect<T = any>(props: SdSelectProps<T>) {
  // Sử dụng SD_EMPTY_VALUE để trick hiển thị Vui Lòng Chọn
  const [options, setOptions] = useState<SdSelectOption<T>[]>([]);
  const [isBoolean, setIsBoolean] = useState(false);
  const [controlName, setControlName] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const { sx, value, items, sdChange, template, label, disabled, form, required, multiple, tooltip } = props;
  let { rules, disableErrorMessage } = props;
  rules = {
    ...rules,
    required: rules?.required ?? required,
  };
  const theme = createTheme({
    components: {
      MuiInputLabel: {
        styleOverrides: {
          outlined: {
            transform: 'translate(14px, 9px) scale(1)', // Khi chưa shink
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)', //Khi đã shink(đã chọn data)
            },
          },
        },
      },
    },
  });
  useEffect(() => {
    if (Array.isArray(items)) {
      setOptions(items);
      setIsBoolean(false);
    } else {
      setOptions([
        {
          value: '1',
          display: items.displayOnTrue,
        },
        {
          value: '0',
          display: items.displayOnFalse,
        },
      ]);
      setIsBoolean(true);
    }
  }, [items]);
  useEffect(() => {
    if (form) {
      setControlName(uuid.v4());
    } else {
      setControlName(uuid.v4());
    }
  }, [form]);
  useEffect(() => {
    if (form && controlName) {
      const { setValue } = form;
      if (typeof value === 'boolean') {
        setValue(controlName, value === true ? '1' : '0');
      } else {
        setValue(controlName, value ?? '');
      }
    }
    if (value && Array.isArray(value)) {
      setSelectedValues(value);
    }
  }, [value, controlName]);
  // Nếu không phải multiple và không bắt buộc và cũng không phải dropdown true/false thì thêm option vui lòng chọn
  const renderOptions = [...options];
  if (!multiple && !rules?.required && !isBoolean) {
    renderOptions.splice(0, 0, {
      value: SD_EMPTY_VALUE,
      display: SD_PLEASE_SELECT,
      data: undefined,
    });
  }
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
    }
    if (!!multiple) {
      const handleChange = (event: SelectChangeEvent<typeof selectedValues>) => {
        const {
          target: { value },
        } = event;
        const values = typeof value === 'string' ? value.split(',') : value ?? null;
        setSelectedValues(values);
        sdChange?.(undefined, values as any);
      };
      return (
        <ThemeProvider theme={theme}>
          <FormControl sx={sx} fullWidth error={!!errorMessage} required={!!rules?.required}>
            <InputLabel>{label}</InputLabel>
            <Select
              multiple
              disabled={disabled}
              value={Array.isArray(value) ? value : []}
              onChange={handleChange}
              input={<OutlinedInput label={label} />}
              size="small"
              renderValue={selected => {
                const vals = renderOptions?.filter(e => selected?.includes(e.value))?.map(f => f.display);
                return vals.join(', ');
              }}>
              {renderOptions.map((option, index) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox checked={selectedValues.indexOf(option.value) > -1} />
                  <ListItemText primary={option.display} />
                </MenuItem>
              ))}
            </Select>
            {!disableErrorMessage && <FormHelperText>{errorMessage || ' '}</FormHelperText>}
          </FormControl>
        </ThemeProvider>
      );
    }

    return (
      <ThemeProvider theme={theme}>
        <Controller
          name={controlName}
          control={form.control}
          rules={rules}
          render={({ field }) => (
            <FormControl id={controlName} sx={sx} fullWidth error={!!errorMessage} required={!!rules?.required}>
              {label && <InputLabel>{label}</InputLabel>}
              <Select
                {...field}
                label={label}
                disabled={disabled}
                size="small"
                value={typeof value === 'boolean' ? (value === true ? '1' : '0') : value || SD_EMPTY_VALUE}
                renderValue={selected => {
                  if (selected === undefined || selected === null || selected === '' || selected === SD_EMPTY_VALUE) {
                    return SD_PLEASE_SELECT;
                  }
                  return renderOptions?.find(e => selected === e.value)?.display || selected;
                }}
                onChange={event => {
                  // Xử lý SD_EMPTY_VALUE trước khi trả về sự kiện sdChange
                  event.target.value = event.target.value === SD_EMPTY_VALUE ? '' : event.target.value;
                  const option = renderOptions.find(e => e.value === event.target.value);
                  field.onChange(event);
                  if (!isBoolean) {
                    sdChange?.(option ?? (undefined as any), option?.value as any);
                  } else {
                    sdChange?.(
                      option ?? (undefined as any),
                      option?.value === '1' ? true : ((option?.value === '0' ? false : undefined) as any)
                    );
                  }
                }}>
                {renderOptions.map((option, index) => {
                  if (template && option.value !== SD_EMPTY_VALUE) {
                    return (
                      <MenuItem sx={{ whiteSpace: 'normal' }} key={option.value} value={option.value}>
                        {template(option)}
                      </MenuItem>
                    );
                  }
                  return (
                    <MenuItem sx={{ whiteSpace: 'normal' }} key={option.value} value={option.value}>
                      {option.display}
                    </MenuItem>
                  );
                })}
              </Select>
              {!disableErrorMessage && <FormHelperText>{errorMessage || ' '}</FormHelperText>}
            </FormControl>
          )}
        />
      </ThemeProvider>
    );
  }
  if (!!multiple) {
    const handleChange = (event: SelectChangeEvent<typeof selectedValues>) => {
      const {
        target: { value },
      } = event;
      const values = typeof value === 'string' ? value.split(',') : value ?? null;
      setSelectedValues(values);
      sdChange?.(undefined, values as any);
    };
    return (
      <ThemeProvider theme={theme}>
        <FormControl sx={sx} fullWidth required={!!rules?.required}>
          <InputLabel>{label}</InputLabel>
          <Select
            multiple
            disabled={disabled}
            value={Array.isArray(value) ? value : []}
            onChange={handleChange}
            input={<OutlinedInput label={label} />}
            size="small"
            renderValue={selected => {
              const vals = renderOptions?.filter(e => selected?.includes(e.value))?.map(f => f.display);
              return vals.join(', ');
            }}>
            {renderOptions.map((option, index) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox checked={selectedValues.indexOf(option.value) > -1} />
                <ListItemText primary={option.display} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider theme={theme}>
      <FormControl sx={{ m: 1, minWidth: 120, margin: 0, ...sx }} fullWidth>
        {label && <InputLabel>{label}</InputLabel>}
        <Select
          value={typeof value === 'boolean' ? (value === true ? '1' : '0') : value || SD_EMPTY_VALUE}
          renderValue={selected => {
            if (selected === undefined || selected === null || selected === '' || selected === SD_EMPTY_VALUE) {
              return SD_PLEASE_SELECT;
            }
            return renderOptions?.find(e => selected === e.value)?.display || selected;
          }}
          label={label}
          disabled={disabled}
          size="small"
          onChange={event => {
            // Xử lý SD_EMPTY_VALUE trước khi trả về sự kiện sdChange
            event.target.value = event.target.value === SD_EMPTY_VALUE ? '' : event.target.value;
            const option = renderOptions.find(e => e.value === event.target.value);
            if (!isBoolean) {
              sdChange?.(option ?? (undefined as any), option?.value as any);
            } else {
              sdChange?.(option ?? (undefined as any), option?.value === '1' ? true : ((option?.value === '0' ? false : undefined) as any));
            }
          }}>
          {renderOptions.map((option, index) => {
            if (template && option.value !== SD_EMPTY_VALUE) {
              return (
                <MenuItem sx={{ whiteSpace: 'normal' }} key={option.value} value={option.value}>
                  {template(option)}
                </MenuItem>
              );
            }
            return (
              <MenuItem sx={{ whiteSpace: 'normal' }} key={option.value} value={option.value}>
                {tooltip ? (
                  <Tooltip title={option?.display}>
                    <span>{option.display.length > 50 ? option.display.substr(0, 50) + '...' : option.display}</span>
                  </Tooltip>
                ) : (
                  <>{option.display}</>
                )}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </ThemeProvider>
  );
}
