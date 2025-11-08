import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E40AF',      // Azul moderno
      light: '#3B82F6',
      dark: '#1E3A8A',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#10B981',      // Verde esmeralda
      light: '#6EE7B7',
      dark: '#047857',
      contrastText: '#ffffff'
    },
    error: {
      main: '#E11D48',      // Rojo vibrante
      light: '#F43F5E',
      dark: '#9F1239',
      contrastText: '#ffffff'
    },
    background: {
      default: '#F1F5F9',
      paper: '#ffffff'
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B'
    },
  },
  shape: {
    borderRadius: 14
  },
  typography: {
    fontFamily: ['Poppins', 'Inter', 'Roboto', 'system-ui', 'Arial', 'sans-serif'].join(','),
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #1E3A8A 0%, #3B82F6 100%)',
          color: '#fff',
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #1E3A8A 0%, #172554 100%)',
          color: '#fff',
          border: 'none',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          padding: '8px 18px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.25s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)'
          },
          '&.MuiButton-containedError': {
            background: 'linear-gradient(90deg, #DC2626, #EF4444)',
            color: '#fff',
            '&:hover': {
              background: 'linear-gradient(90deg, #B91C1C, #DC2626)',
            }
          }
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #1E40AF 0%, #2563EB 100%)',
          '& .MuiTableCell-root': {
            color: 'white',
            fontWeight: 600,
            fontSize: '0.95rem',
          }
        }
      }
    }
  }
})

export default theme
