import React from 'react'
import {
  Paper, Box, Stack, Typography, TextField, Button, Alert, Grid,
  Autocomplete, Divider, IconButton, Tooltip, Snackbar
} from '@mui/material'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { listActiveTemas } from '../api/temas'
import { searchVisitContext, uploadPhotoBase64, createVisit } from '../api/visits'
import RequireRole from '../hooks/RequireRole'
import { useLocation } from 'react-router-dom'
import api from '../api/axios'
import PrintBadgeButton from '../components/PrintbadgeButton'

const DPI_RE = /^[0-9]{6,13}$/
const PHONE_RE = /^[0-9+\-() ]{6,20}$/

const schema = z.object({
  dpi: z.string().optional().transform(v => (v || '').trim()).refine(v => (v === '' || DPI_RE.test(v)), {
    message: 'DPI debe contener entre 6 y 13 dígitos.'
  }),
  passport: z.string().optional().transform(v => (v || '').trim()),
  name: z.string().min(3, 'Nombre mínimo 3 caracteres').transform(v => v.trim()),
  phone: z.string().optional().transform(v => (v || '').trim()).refine(v => (v === '' || PHONE_RE.test(v)), {
    message: 'Teléfono con formato inválido.'
  }),
  origin: z.string().optional().transform(v => (v || '').trim()),
  topic_id: z.number({ required_error: 'Selecciona un tema' }),
  target_unit: z.string().min(2, 'Unidad destino requerida').transform(v => v.trim()),
  reason: z.string().optional().transform(v => (v || '').trim()),
  reopen_justification: z.string().optional().transform(v => (v || '').trim()),
  photo_data_url: z.string().optional()
}).refine(data => !!(data.dpi || data.passport), {
  message: 'Debes proporcionar DPI o PASAPORTE.',
  path: ['dpi']
})

async function openBadgePdf(visitId) {
  const visitsPath = import.meta.env.VITE_VISITS_PATH || '/api/visits/visits/'
  const url = `${visitsPath}${visitId}/badge.pdf/`
  const res = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([res.data], { type: 'application/pdf' })
  const pdfUrl = URL.createObjectURL(blob)
  window.open(pdfUrl, '_blank', 'noopener,noreferrer')
}

export default function Checkin() {
  return (
    <RequireRole roles={['recepcion', 'supervisor', 'admin']}>
      <Box>
        <CheckinForm />
      </Box>
    </RequireRole>
  )
}

function CheckinForm() {
  const [temas, setTemas] = React.useState([])
  const [loadingTemas, setLoadingTemas] = React.useState(true)
  const [infoMsg, setInfoMsg] = React.useState('')
  const [errorMsg, setErrorMsg] = React.useState('')
  const [previewUrl, setPreviewUrl] = React.useState('')
  const [videoStream, setVideoStream] = React.useState(null)
  const [lastVisit, setLastVisit] = React.useState(null)
  const [snack, setSnack] = React.useState({ open: false, text: '', type: 'success' })

  const location = useLocation()
  const {
    register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      dpi: '', passport: '', name: '', phone: '', origin: '',
      topic_id: undefined, target_unit: '', reason: '', reopen_justification: '', photo_data_url: ''
    }
  })

  const topicId = watch('topic_id')

  React.useEffect(() => {
    (async () => {
      try {
        setLoadingTemas(true)
        const items = await listActiveTemas()
        setTemas(items)
      } catch {
        setTemas([])
      } finally {
        setLoadingTemas(false)
      }
    })()
    return () => {
      if (videoStream) videoStream.getTracks().forEach(t => t.stop())
    }
  }, [])

  const videoRef = React.useRef(null)
  const canvasRef = React.useRef(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      setVideoStream(stream)
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
      }
    } catch {
      setErrorMsg('No se pudo acceder a la cámara.')
    }
  }

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop())
      setVideoStream(null)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !video.srcObject) return
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setPreviewUrl(dataUrl)
    setValue('photo_data_url', dataUrl)
  }

  const onSelectFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result?.toString() || ''
      setPreviewUrl(dataUrl)
      setValue('photo_data_url', dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (form) => {
    try {
      let photo_path = ''
      if (form.photo_data_url) {
        const photo = await uploadPhotoBase64(
          form.photo_data_url,
          `checkin-${(form.dpi || form.passport || 'sinid')}.jpg`
        )
        photo_path = photo?.path || ''
      }

      const visit = await createVisit({
        citizen: {
          dpi: form.dpi,
          passport: form.passport,
          name: form.name,
          phone: form.phone,
          origin: form.origin
        },
        topic_id: Number(form.topic_id),
        target_unit: form.target_unit,
        reason: form.reason || '',
        photo_path,
        reopen_justification: form.reopen_justification || ''
      })

      const badge = visit?.badge_code || 'SIN-COD'
      setLastVisit({ id: visit.id, badge_code: badge })
      setSnack({ open: true, text: `Visita registrada con éxito. Gafete: ${badge}`, type: 'success' })
      setTimeout(() => {
        setSnack({ open: false, text: '', type: 'success' })
      }, 8000)
      setPreviewUrl('')
      setValue('photo_data_url', '')
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Ocurrió un error al registrar la visita.'
      setSnack({ open: true, text: msg, type: 'error' })
      setErrorMsg(msg)
    }
  }

  const clearForm = () => {
    reset({
      dpi: '', passport: '', name: '', phone: '', origin: '',
      topic_id: undefined, target_unit: '', reason: '', reopen_justification: '', photo_data_url: ''
    })
    setPreviewUrl('')
    setInfoMsg(''); setErrorMsg('')
    if (videoStream) stopCamera()
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary.dark">
          <QrCodeScannerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Registro de visita (Check-in)
        </Typography>
        <Button variant="text" startIcon={<RestartAltIcon />} onClick={clearForm}>
          Limpiar
        </Button>
      </Stack>

      {(errorMsg || infoMsg) && (
        <Alert severity={errorMsg ? 'error' : 'info'} sx={{ mb: 2, borderRadius: 2 }}>
          {errorMsg || infoMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Ciudadano</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="DPI" {...register('dpi')} error={!!errors.dpi} helperText={errors.dpi?.message} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Pasaporte" {...register('passport')} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Nombre completo" {...register('name')} error={!!errors.name} helperText={errors.name?.message} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Teléfono" {...register('phone')} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Procedencia / Comunidad / Municipio" {...register('origin')} fullWidth />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Gestión</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    sx={{ minWidth: 300 }}
                    loading={loadingTemas}
                    options={temas}
                    getOptionLabel={(o) => o ? `${o.code} — ${o.name}` : ''}
                    onChange={(_, val) => setValue('topic_id', val?.id || undefined)}
                    renderInput={(params) => (
                      <TextField {...params} label="Tema / Gestión" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Unidad destino" {...register('target_unit')} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Motivo / Observación" {...register('reason')} fullWidth multiline minRows={2} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Justificación para reabrir expediente" {...register('reopen_justification')} fullWidth multiline minRows={2} />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={600}>Foto del visitante</Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Iniciar cámara">
                    <IconButton onClick={startCamera}><PhotoCameraIcon /></IconButton>
                  </Tooltip>
                  <Button component="label" variant="outlined">
                    Cargar imagen…
                    <input hidden type="file" accept="image/*" onChange={onSelectFile} />
                  </Button>
                </Stack>
              </Stack>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} md={6}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 8, background: '#000' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <Stack direction="row" spacing={1} mt={1}>
                    <Button onClick={capturePhoto} startIcon={<PhotoCameraIcon />} variant="contained">Capturar</Button>
                    {videoStream && (
                      <Button onClick={stopCamera} variant="outlined">Detener cámara</Button>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  {previewUrl
                    ? <img src={previewUrl} alt="preview" style={{ width: '100%', borderRadius: 8, border: '1px solid #e3e8ef' }} />
                    : <Box sx={{ height: 200, border: '1px dashed #cbd5e1', borderRadius: 2, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>Sin imagen</Box>}
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={2}>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting}>
                Guardar entrada
              </Button>
              {lastVisit?.id && (
                <PrintBadgeButton visitId={lastVisit.id} badgeCode={lastVisit.badge_code} variant="outlined" />
              )}
            </Stack>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={snack.open}
        autoHideDuration={8000}
        onClose={() => setSnack({ open: false, text: '', type: 'success' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiPaper-root': {
            background:
              snack.type === 'success'
                ? 'linear-gradient(135deg, #43A047 0%, #66BB6A 100%)'
                : 'linear-gradient(135deg, #D32F2F 0%, #EF5350 100%)',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 3,
            boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            px: 3,
            py: 1.6
          }
        }}
        message={
          <Box display="flex" alignItems="center" gap={1}>
            {snack.type === 'success'
              ? <CheckCircleIcon sx={{ fontSize: 26 }} />
              : <ErrorOutlineIcon sx={{ fontSize: 26 }} />}
            <span>{snack.text}</span>
          </Box>
        }
        action={
          snack.type === 'success' && lastVisit?.id ? (
            <Button
              size="small"
              onClick={() => openBadgePdf(lastVisit.id)}
              sx={{
                ml: 1.5,
                color: '#fff',
                fontWeight: 700,
                textTransform: 'none',
                border: '1px solid rgba(255,255,255,0.7)',
                borderRadius: 2,
                px: 1.2,
                '&:hover': { background: 'rgba(255,255,255,0.15)' }
              }}
            >
              Ver gafete
            </Button>
          ) : null
        }
      />
    </Paper>
  )
}
