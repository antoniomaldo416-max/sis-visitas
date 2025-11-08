import React, { useEffect, useState } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Stack,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuthStore } from '../store/auth'
import { listActiveVisits, getDashboardStats } from '../api/visits'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()

  const [visitas, setVisitas] = useState([])
  const [stats, setStats] = useState({
    activos: 0,
    entradas_hoy: 0,
    salidas_hoy: 0,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const v = await listActiveVisits()
        const s = await getDashboardStats()
        setVisitas(v)
        setStats(s)
      } catch (e) {
        console.error(e)
      }
    }
    loadData()
  }, [])

  const cards = [
    {
      title: 'Visitantes activos',
      value: stats.activos,
      icon: <PeopleIcon />,
      gradient: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
    },
    {
      title: 'Visitas registradas hoy',
      value: stats.entradas_hoy,
      icon: <HowToRegIcon />,
      gradient: 'linear-gradient(135deg, #06B6D4, #0284C7)',
    },
    {
      title: 'Salidas registradas',
      value: stats.salidas_hoy,
      icon: <LogoutIcon />,
      gradient: 'linear-gradient(135deg, #10B981, #047857)',
    },
  ]

  return (
    <Box sx={{ p: 4, bgcolor: '#F9FAFB', minHeight: '100vh' }}>
      {/* === ENCABEZADO === */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 5,
          borderRadius: 4,
          background: 'linear-gradient(90deg, #EEF2FF 0%, #DBEAFE 100%)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E3A8A' }}>
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#475569', mt: 1 }}>
          {fullName
            ? `Bienvenido, ${fullName}.`
            : `Bienvenido${user?.username ? `, ${user.username}` : ''}.`}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {(user?.roles || []).map((r) => (
            <Chip
              key={r}
              label={r}
              sx={{
                backgroundColor: '#E0E7FF',
                color: '#1E3A8A',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* === TARJETAS DE RESUMEN === */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {cards.map((card, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 4,
                color: 'white',
                background: card.gradient,
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                height: 120,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '0.95rem', opacity: 0.9 }}>
                  {card.title}
                </Typography>
                <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
                  {card.value}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.25)',
                  width: 56,
                  height: 56,
                }}
              >
                {card.icon}
              </Avatar>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* === ACTIVIDAD RECIENTE === */}
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: '#1E3A8A',
              }}
            >
              Actividad reciente
            </Typography>

            {visitas.length === 0 ? (
              <Typography sx={{ color: '#64748B' }}>
                No hay registros recientes.
              </Typography>
            ) : (
              <List dense>
                {visitas.slice(0, 6).map((v) => (
                  <ListItem
                    key={v.id}
                    sx={{
                      borderBottom: '1px solid #E5E7EB',
                      py: 1.5,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#2563EB' }}>
                        <PeopleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography fontWeight={600}>
                          {v.case?.citizen?.name || '—'}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          component="span"
                          sx={{ color: '#475569', fontSize: '0.9rem' }}
                        >
                          {v.target_unit || '—'} •{' '}
                          {v.checkin_at
                            ? new Date(v.checkin_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
