import React from 'react'
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Divider,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LogoutIcon from '@mui/icons-material/Logout'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import LabelIcon from '@mui/icons-material/Label'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ListAltIcon from '@mui/icons-material/ListAlt'
import PeopleIcon from '@mui/icons-material/People'
import { Outlet, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [confirmLogout, setConfirmLogout] = React.useState(false)

  // 🔹 NUEVO: control temporal mientras se verifica la sesión
  const [checking, setChecking] = React.useState(true)

  React.useEffect(() => {
    const token = sessionStorage.getItem('sisvisitas-auth')
    // Si no hay sesión guardada, manda al login sin mostrar panel
    if (!token) {
      navigate('/login')
      return
    }
    // Pequeña espera para permitir que Zustand cargue correctamente
    setTimeout(() => setChecking(false), 300)
  }, [navigate])

  // Si aún está verificando sesión, mostrar pantalla limpia
  if (checking) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: 20,
        color: '#1E3A8A'
      }}>
        Cargando...
      </Box>
    )
  }

  const toggleDrawer = () => setOpen((p) => !p)
  const go = (path) => {
    navigate(path)
    setOpen(false)
  }

  // ✅ Cerrar sesión limpiando sessionStorage
  const handleLogout = () => {
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('sisvisitas-auth')
    navigate('/login')
  }

  // ✅ Obtener rol actual de la sesión
  const role = sessionStorage.getItem('role') || 'recepcion'

  // ✅ Menú con roles
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['recepcion', 'supervisor', 'admin'] },
    { text: 'Temas', icon: <LabelIcon />, path: '/catalogos/temas', roles: ['supervisor', 'admin'] },
    { text: 'Registro de Visita', icon: <HowToRegIcon />, path: '/visitas/check-in', roles: ['recepcion', 'supervisor', 'admin'] },
    { text: 'Control de salida', icon: <LogoutIcon />, path: '/visitas/check-out', roles: ['recepcion', 'supervisor', 'admin'] },
    { text: 'Visitantes activos', icon: <PeopleIcon />, path: '/visitas/activos', roles: ['recepcion', 'supervisor', 'admin'] },
    { text: 'Búsqueda rápida', icon: <ManageSearchIcon />, path: '/busqueda', roles: ['supervisor', 'admin'] },
    { text: 'Reporte de visitas', icon: <PictureAsPdfIcon />, path: '/reportes/visitas', roles: ['supervisor', 'admin'] },
    { text: 'Bitácora', icon: <ListAltIcon />, path: '/bitacora', roles: ['admin'] }
  ]

  const visibleItems = menuItems.filter(item => item.roles.includes(role))

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton edge="start" onClick={toggleDrawer} sx={{ mr: 2, color: 'white' }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            SisVisitas
          </Typography>
          <Tooltip title="Cerrar sesión">
            <IconButton
              color="error"
              onClick={() => setConfirmLogout(true)}
              sx={{
                background: 'linear-gradient(90deg, #DC2626, #EF4444)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(90deg, #B91C1C, #DC2626)',
                  transform: 'scale(1.08)'
                },
                transition: 'all 0.25s ease'
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        open={open}
        onClose={toggleDrawer}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 270,
            background: 'linear-gradient(180deg, #1E3A8A 0%, #172554 100%)',
            color: 'white',
            border: 'none'
          }
        }}
      >
        <Toolbar sx={{ flexDirection: 'column', alignItems: 'center', py: 3 }}>
          <Avatar sx={{ bgcolor: '#2563EB', width: 64, height: 64, mb: 1 }}>SV</Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#E0E7FF' }}>
            Panel Principal
          </Typography>
        </Toolbar>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        <List>
          {visibleItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => go(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                color: 'white',
                '&:hover': { backgroundColor: '#2563EB', transform: 'scale(1.03)' },
                transition: 'all 0.25s ease'
              }}
            >
              <ListItemIcon sx={{ color: '#93C5FD' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, pt: 10, pb: 4, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>

      <Dialog open={confirmLogout} onClose={() => setConfirmLogout(false)}>
        <DialogTitle>Confirmar salida</DialogTitle>
        <DialogContent>¿Desea salir del sistema?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLogout(false)}>No</Button>
          <Button onClick={handleLogout} color="error" variant="contained">Sí</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
