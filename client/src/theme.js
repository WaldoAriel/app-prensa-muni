import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#FF7204",
      light: "#FE9800",
      dark: "#FF7204",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#3EABB5",
      light: "#5FC0CA",
      dark: "#2E8C94",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F0F2F5",
      paper: "#ffffff",
    },
    success: {
      main: "#2E7D32",
      light: "#4CAF50",
    },
    error: {
      main: "#C62828",
      light: "#EF5350",
    },
    warning: {
      main: "#E65100",
      light: "#FB8C00",
    },
    info: {
      main: "#1565C0",
      light: "#42A5F5",
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: "2.5rem" },
    h2: { fontWeight: 600, fontSize: "2rem" },
    h3: { fontWeight: 600, fontSize: "1.75rem" },
    h4: { fontWeight: 600, fontSize: "1.5rem" },
    h5: { fontWeight: 600, fontSize: "1.25rem" },
    h6: { fontWeight: 500, fontSize: "1.1rem" },
    button: { textTransform: "none", fontWeight: 500 },
    caption: { color: "#757575" },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 1px 3px rgba(0,0,0,0.06)",
    "0 2px 6px rgba(0,0,0,0.08)",
    "0 4px 12px rgba(0,0,0,0.1)",
    "0 6px 16px rgba(0,0,0,0.12)",
    "0 8px 24px rgba(0,0,0,0.14)",
    "0 12px 32px rgba(0,0,0,0.16)",
    "0 16px 40px rgba(0,0,0,0.18)",
    "0 20px 48px rgba(0,0,0,0.2)",
    "0 24px 56px rgba(0,0,0,0.22)",
    "0 28px 64px rgba(0,0,0,0.24)",
    "0 32px 72px rgba(0,0,0,0.26)",
    "0 36px 80px rgba(0,0,0,0.28)",
    "0 40px 88px rgba(0,0,0,0.3)",
    "0 44px 96px rgba(0,0,0,0.32)",
    "0 48px 104px rgba(0,0,0,0.34)",
    "0 52px 112px rgba(0,0,0,0.36)",
    "0 56px 120px rgba(0,0,0,0.38)",
    "0 60px 128px rgba(0,0,0,0.4)",
    "0 64px 136px rgba(0,0,0,0.42)",
    "0 68px 144px rgba(0,0,0,0.44)",
    "0 72px 152px rgba(0,0,0,0.46)",
    "0 76px 160px rgba(0,0,0,0.48)",
    "0 80px 168px rgba(0,0,0,0.5)",
    "0 84px 176px rgba(0,0,0,0.52)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          scrollbarColor: "#FF7204 #E0E0E0",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "8px 20px",
          fontWeight: 500,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0 4px 16px rgba(255,114,4,0.3)",
          },
        },
        outlined: {
          borderWidth: 2,
          "&:hover": {
            borderWidth: 2,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            "&:hover fieldset": {
              borderColor: "#FF7204",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: "16px 0 0 16px",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "12px 16px",
        },
        head: {
          fontWeight: 600,
          color: "#FF7204",
          backgroundColor: "#F0F2F5",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": {
            borderBottom: 0,
          },
          "&:hover": {
            backgroundColor: "rgba(255,114,4,0.03)",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
  },
});
