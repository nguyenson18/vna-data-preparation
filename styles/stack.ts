import { StackTypeMap } from '@mui/material';

export const StackBoxShadowProps: StackTypeMap['props'] = {
  bgcolor: 'white',
  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
  borderRadius: 2,
  border: `1px solid rgba(0, 0, 0, 0.1)`, // COLORS.info,
  // borderColor: COLORS.secondary,
};

export const StackFlexProps: StackTypeMap['props'] = {
  direction: 'row',
  spacing: '8px',
  flexWrap: 'wrap',
  useFlexGap: true,
  rowGap: 2,
};
export const FlexBasis1 = 'calc(100% * (1/1) - 2px)';
export const FlexBasis21 = 'calc(100% * (1/2) - 4px)'; // spacing*1/2 = 8*1/2 = 4
export const FlexBasis31 = 'calc(100% * (1/3) - 5.4px)'; // spacing*2/3 = 8*2/3 = 5.4
export const FlexBasis32 = 'calc(100% * (2/3) - 4px)'; // spacing*1/2 = 8*1/2 = 4
export const FlexBasis41 = 'calc(100% * (1/4) - 6px)'; // spacing*3/4 = 8*3/4 = 6
export const FlexBasis42 = 'calc(100% * (2/4) - 4px)'; // spacing*1/2 = 8*3/4 = 6
export const FlexBasis51 = 'calc(100% * (1/5) - 6.4px)'; // spacing*4/5 = 8*4/5 = 6.4
