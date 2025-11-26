"use client";
import { useState, useEffect, useCallback } from "react";
import TextField from "@mui/material/TextField";
import { Autocomplete, SxProps } from "@mui/material";
import {
  Controller,
  FieldValues,
  UseControllerProps,
  UseFormReturn,
} from "react-hook-form";
import * as uuid from "uuid";
import { Box, Stack } from "@mui/material";
import React from "react";

export interface SdAutocompleteItems<T> {
  value: any;
  display: string;
  data?: T;
}

export interface SdAutocompleteOption<T> {
  value: any;
  display: string;
  data?: T;
}

export type SdAutocompleteProps<T> =
  | SdAutocompleteArrayItemsProps<T>
  | SdAutocompleteFuncItemsProps<T>
  | SdAutocompleteLazyItemsProps<T>;

interface SdAutocompleteBaseProps<T> {
  sx?: SxProps;
  label?: string;
  value: string | null | undefined;
  sdChange: (item: SdAutocompleteOption<T> | null) => void;
  template?: (item: SdAutocompleteOption<T> | null) => React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  form?: UseFormReturn<FieldValues, any>;
  rules?: UseControllerProps["rules"]; // form
  disableErrorMessage?: boolean;
}

interface SdAutocompleteArrayItemsProps<T> extends SdAutocompleteBaseProps<T> {
  items: SdAutocompleteItems<T>[];
}

interface SdAutocompleteFuncItemsProps<T> extends SdAutocompleteBaseProps<T> {
  valueField: Extract<keyof T, string>;
  displayField: Extract<keyof T, string>;
  items: () => Promise<T[]>;
}

interface SdAutocompleteLazyItemsProps<T> extends SdAutocompleteBaseProps<T> {
  valueField: Extract<keyof T, string>;
  displayField: Extract<keyof T, string>;
  lazyItems: (searchText: string, isValue?: boolean) => Promise<T[]>;
}
export interface SdAutocompleteRef<T = any> {
  reloadLazyItems: () => void;
}
function SdAutocompleteWithRef<T>(
  props: SdAutocompleteProps<T>,
  ref: React.ForwardedRef<SdAutocompleteRef<T>>
) {
  const [inputValue, setInputValue] = useState<string>("");
  const [options, setOptions] = useState<SdAutocompleteOption<T>[]>([]);
  const [model, setModel] = useState<SdAutocompleteOption<T> | null>(null); // Không sử dụng undefined cho model
  const [controlName, setControlName] = useState<string>("");
  const [cache, setCache] = useState<Record<string, T[]>>({});
  const [lazyRecords, setLazyRecords] = useState<T[]>([]);
  const {
    sx,
    value,
    sdChange,
    template,
    label,
    required,
    disabled,
    form,
    disableErrorMessage,
  } = props;
  const arrayItems =
    "items" in props && Array.isArray(props.items) ? props.items : undefined;
  // const [items, setItems] = useState<(() => Promise<T[]>)>();
  // const [lazyItems, setLazyItems] = useState<((searchText: string, isValue?: boolean) => Promise<T[]>)>();
  let { rules } = props;
  rules = {
    ...rules,
    required: rules?.required ?? required,
  };
  React.useImperativeHandle(ref, () => ({
    reloadLazyItems,
  }));
  // Sử dụng useCallback để không khởi tạo lại hàm items
  const items = useCallback(async () => {
    if ("items" in props && "valueField" in props && "displayField" in props) {
      return await props.items();
    }
    return [];
  }, []);

  const uniqueBy = <U, K extends PropertyKey>(arr: U[], keyFn: (x: U) => K) => {
    const m = new Map<K, U>();
    for (const it of arr) m.set(keyFn(it), it);
    return Array.from(m.values());
  };

  // Sử dụng useCallback để không khởi tạo lại hàm lazyItems
  const lazyItems = useCallback(async (value: any, inputValue: any) => {
    if (
      "lazyItems" in props &&
      "valueField" in props &&
      "displayField" in props
    ) {
      const { lazyItems, valueField } = props;
      const selectedItem = lazyRecords.find(
        (e) => (e?.[valueField] as any) === value
      );
      const valueRecords = !value
        ? []
        : selectedItem
        ? [selectedItem]
        : await lazyItems(value, true).catch((err) => {
            console.error(err);
            return [];
          });
      const searchRecords = Array.isArray(cache[inputValue || ""])
        ? cache[inputValue || ""]
        : await lazyItems(inputValue).catch((err) => {
            console.error(err);
            return [];
          });
      setCache({
        ...cache,
        [inputValue || ""]: searchRecords,
      });

      const result = Array.from(
        new Map(
          [...valueRecords, ...searchRecords].map((item) => [
            item?.[valueField],
            item,
          ])
        ).values()
      );
      setLazyRecords((prev) =>
        uniqueBy(
          [...prev, ...valueRecords, ...searchRecords],
          (item) => item?.[valueField] as any
        )
      );
      return result;
    } else {
      return [];
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(arrayItems)) {
      setOptions(arrayItems);
    }
  }, [arrayItems]);

  useEffect(() => {
    if ("items" in props) {
      if (Array.isArray(props.items)) {
        // Gán dữ liệu cho options
        setOptions(props.items);
      } else if ("valueField" in props && "displayField" in props) {
        const { valueField, displayField } = props;
        // Thực hiện gọi API load dữ liệu cho options
        items()
          .then((records) => {
            setOptions(
              records.map((e) => ({
                value: e?.[valueField] as any,
                display: e?.[displayField] as any,
                data: e,
              }))
            );
          })
          .catch((err) => {
            console.error(err);
            setOptions([]);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    if (form) {
      if (!controlName) {
        setControlName(uuid.v4());
      }
    } else {
      setControlName("");
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
      setValue(controlName, value ?? "");
    }
  }, [value, controlName, form]);

  const reloadLazyItems = () => {
    if (
      "lazyItems" in props &&
      "valueField" in props &&
      "displayField" in props
    ) {
      const { valueField, displayField } = props;
      lazyItems(value, inputValue)
        .then((records) => {
          setOptions(
            records.map((e) => ({
              value: e?.[valueField] as any,
              display: e?.[displayField] as any,
              data: e,
            }))
          );
        })
        .catch((err) => {
          console.error(err);
          setOptions([]);
        });
    }
  };
  useEffect(() => {
    reloadLazyItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inputValue, lazyItems]);

  // Selected item
  useEffect(() => {
    const item = options.find((item) => item.value === value);
    setModel(item ?? null);
    if ("lazyItems" in props) {
      // TODO
    } else {
      if (item?.display !== inputValue) {
        setInputValue(item?.display || "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options]);
  if (form) {
    const {
      formState: { errors },
    } = form;
    const error = errors[controlName];
    let errorMessage = "";
    if (error) {
      if (error.type === "required" && !value) {
        errorMessage = "Dữ liệu không được để trống";
      }
    }

    return (
      <Controller
        name={controlName}
        control={form.control}
        rules={rules}
        render={({ field }) => (
          <Autocomplete
            value={model}
            disablePortal
            options={options}
            disabled={disabled}
            getOptionLabel={(option) => option.display || ""}
            isOptionEqualToValue={(option, value) => {
              return option.value === value.value;
            }}
            onChange={(event, newValue) => {
              sdChange(newValue || null);
            }}
            inputValue={inputValue}
            onInputChange={(event, newInputValue) => {
              setInputValue(newInputValue);
            }}
            sx={{ width: "100%", ...sx }}
            size="small"
            renderOption={(props, option) => {
              if (template) {
                return <li {...props}>{template(option)}</li>;
              }
              return (
                <li {...props}>
                  <Stack direction={"column"}>
                    <Box> {option.display || option.value || ""}</Box>
                  </Stack>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                {...field}
                id={controlName}
                label={label}
                error={!!errorMessage}
                helperText={disableErrorMessage ? "" : errorMessage || " "}
                required={!!rules?.required}
                size="small"
              />
            )}
          />
        )}
      />
      // <Autocomplete
      //   value={model}
      //   disablePortal
      //   options={options}
      //   disabled={disabled}
      //   getOptionLabel={option => option.display || ''}
      //   isOptionEqualToValue={(option, value) => {
      //     return option.value === value.value;
      //   }}
      //   onChange={(event, newValue) => {
      //     sdChange(newValue || null);
      //   }}
      //   inputValue={inputValue}
      //   onInputChange={(event, newInputValue) => {
      //     setInputValue(newInputValue);
      //   }}
      //   sx={{ width: '100%', ...sx }}
      //   size="small"
      //   renderInput={params => (
      //     <Controller
      //       name={controlName}
      //       control={form.control}
      //       rules={rules}
      //       render={({ field }) => (
      //         <TextField
      //           {...params}
      //           {...field}
      //           id={controlName}
      //           label={label}
      //           error={!!errorMessage}
      //           helperText={errorMessage || ' '}
      //           required={!!rules?.required}
      //           size="small"
      //         />
      //       )}
      //     />
      //   )}
      // />
    );
  }
  return (
    <Autocomplete
      value={model}
      disablePortal
      options={options}
      disabled={disabled}
      getOptionLabel={(option) => option.display || ""}
      isOptionEqualToValue={(option, value) => {
        return option.value === value.value;
      }}
      onChange={(event, newValue) => {
        sdChange(newValue || null);
      }}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      sx={{ width: "100%", ...sx }}
      size="small"
      renderOption={(props, option) => {
        if (template) {
          return <li {...props}>{template(option)}</li>;
        }
        return (
          <li {...props} key={option.value}>
            <Stack direction={"column"}>
              <Box> {option.display || option.value || ""}</Box>
            </Stack>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} size="small" />
      )}
    />
  );
}

export const SdAutocomplete = React.forwardRef(SdAutocompleteWithRef) as <T>(
  p: SdAutocompleteProps<T> & { ref?: React.ForwardedRef<SdAutocompleteRef<T>> }
) => React.ReactElement;
