import React from 'react'
import {
  Paper, Box, Stack, Typography, TextField, Button, Alert, Divider, Chip, InputAdornment
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { checkoutByBadge } from '../api/visits'
import RequireRole from '../hooks/RequireRole'

const schema = z.object({
  badge_code: z.string().trim().min(3, 'Ingresa el código del gafete'),
})

function flattenError(err) {
  const data = err?.response?.data
  if (!data) return 'Error desconocido'
  if (typeof data === 'string') return data
  const out = []
  const walk = (obj, path = []) => {
    if (Array.isArray(obj)) { out.push(`${path.join('.')}: ${obj.join(' ')}`); return }
    if (obj && typeof obj === 'object') { Object.entries(obj).forEach(([k, v]) => walk(v, [...path, k])); return }
    if (obj) out.push(`${path.join('.')}: ${String(obj)}`)
  }
  walk(data)
  return out.join(' | ') || 'Solicitud inválida'
}

export default function Checkout() {
  return (
    <RequireRole roles={['recepcion', 'supervisor', 'admin']}>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <CheckoutForm />
      </Box>
    </RequireRole>
  )
}

function CheckoutForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { badge_code: '' }
  })

  const [okMsg, setOkMsg] = React.useState('')
  const [errMsg, setErrMsg] = React.useState('')
  const [visit, setVisit] = React.useState(null)

  const onSubmit = async (form) => {
    setOkMsg(''); setErrMsg(''); setVisit(null)
    try {
      const code = (form.badge_code || '').trim()
      const data = await checkoutByBadge(code)
      setVisit(data)
      const when = data?.checkout_at?.replace('T', ' ').slice(0, 16) || 'ahora'
      setOkMsg(`Salida registrada (${when}).`)
      setValue('badge_code', '')
    } catch (e) {
      const msg = flattenError(e)
      setErrMsg(msg)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 4,
        backgroundColor: '#fff',
        boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
      }}
    >
      {/* ENCABEZADO */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700} color="primary.dark">
          <LogoutIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Control de salida (Check-out)
        </Typography>

        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          startIcon={<LogoutIcon />}
          disabled={isSubmitting}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 3,
            fontWeight: 600,
            background: 'linear-gradient(90deg, #00796B 0%, #26A69A 100%)',
            '&:hover': { background: 'linear-gradient(90deg, #00695C 0%, #2BBBAD 100%)' },
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          }}
        >
          {isSubmitting ? 'Procesando...' : 'Registrar salida'}
        </Button>
      </Stack>

      {/* MENSAJE DE ÉXITO / ERROR */}
      {(okMsg || errMsg) && (
        <Alert
          severity={okMsg ? 'success' : 'error'}
          icon={okMsg ? <CheckCircleIcon /> : undefined}
          sx={{
            mb: 3,
            borderRadius: 3,
            backgroundColor: okMsg ? '#E8F5E9' : undefined,
            color: okMsg ? '#1B5E20' : undefined,
            fontWeight: 500
          }}
        >
          {okMsg || errMsg}
        </Alert>
      )}

      {/* FORMULARIO */}
      <Stack spacing={2}>
        <TextField
          label="Código de gafete (ej. VIS-2025-000123)"
          {...register('badge_code')}
          onKeyDown={onKeyDown}
          error={!!errors.badge_code}
          helperText={errors.badge_code?.message || 'Escanéalo o escríbelo y presiona Enter.'}
          autoFocus
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <QrCodeScannerIcon color="primary" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root.Mui-focused fieldset': {
              borderColor: '#1565C0',
              boxShadow: '0 0 0 2px rgba(21,101,192,0.1)',
            },
          }}
        />

        {visit && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Chip label={`Gafete: ${visit.badge_code}`} sx={{ bgcolor: '#E3F2FD', fontWeight: 600 }} />
              {visit.case?.code_persistente && (
                <Chip label={`Expediente: ${visit.case.code_persistente}`} sx={{ bgcolor: '#E3F2FD', fontWeight: 600 }} />
              )}
              {visit.case?.citizen?.name && (
                <Chip label={`Ciudadano: ${visit.case.citizen.name}`} sx={{ bgcolor: '#E3F2FD', fontWeight: 600 }} />
              )}
              {visit.checkout_at && (
                <Chip
                  label={`Checkout: ${visit.checkout_at.replace('T', ' ').slice(0, 16)}`}
                  sx={{
                    bgcolor: '#C8E6C9',
                    color: '#1B5E20',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                />
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  )
}
