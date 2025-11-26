"use client";

import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
// import CssBaseline nếu cần:
import CssBaseline from "@mui/material/CssBaseline";

// Nếu bạn đã có file theme riêng thì import từ đó:
// import { theme } from "@/theme";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2962FF",
    },
    secondary: {
      main: "#637381",
    },
  },
});

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
