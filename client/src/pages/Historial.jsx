import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Box,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme,
  Grid
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Download,
  Visibility,
  CloudOff,
  CheckCircle
} from '@mui/icons-material';
import api from '../services/api';

const Historial = () => {
  const [subidas, setSubidas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroArea, setFiltroArea] = useState('todas');
  const [filtroUsuario, setFiltroUsuario] = useState('todos');
  const [usuarios, setUsuarios] = useState([]);
  const [openCard, setOpenCard] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const areas = ['todas', 'Obras', 'Cultura', 'Turismo', 'Intendencia', 'Deportes', 'Educacion', 'Salud', 'Ambiente'];

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const response = await api.get('/historial');
      setSubidas(response.data.subidas || []);
      const usuariosUnicos = [...new Set(response.data.subidas.map(s => s.Usuario?.nombre).filter(Boolean))];
      setUsuarios(usuariosUnicos);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Error al cargar el historial');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const subidasFiltradas = subidas.filter(subida => {
    if (filtroArea !== 'todas' && subida.area !== filtroArea) return false;
    if (filtroUsuario !== 'todos' && subida.Usuario?.nombre !== filtroUsuario) return false;
    return true;
  });

  const exportarCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Área', 'Descripción', 'Cantidad', 'IP'];
    const rows = subidasFiltradas.map(s => [
      new Date(s.created_at).toLocaleString(),
      s.Usuario?.nombre || 'Desconocido',
      s.area,
      s.descripcion,
      s.cantidad,
      s.ip || 'No registrada'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `historial_subidas_${new Date().toISOString().slice(0, 19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (cargando) return <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: isMobile ? 2 : 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h5">📋 Historial</Typography>
        
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Área</InputLabel>
            <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} label="Área">
              {areas.map(a => <MenuItem key={a} value={a}>{a === 'todas' ? 'Todas' : a}</MenuItem>)}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Usuario</InputLabel>
            <Select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} label="Usuario">
              <MenuItem value="todos">Todos</MenuItem>
              {usuarios.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
          </FormControl>
          
          <button onClick={exportarCSV} style={{ background: '#4caf50', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download fontSize="small" /> {!isMobile && 'Exportar'}
          </button>
        </Box>
      </Box>

      {subidasFiltradas.length === 0 ? (
        <Alert severity="info">No hay subidas registradas</Alert>
      ) : isMobile ? (
        // Vista en tarjetas para mobile
        <Grid container spacing={2}>
          {subidasFiltradas.map((subida) => {
            const archivos = JSON.parse(subida.archivos || '[]');
            const isOpen = openCard === subida.id;
            return (
              <Grid item xs={12} key={subida.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(subida.created_at).toLocaleString()}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
                          {subida.descripcion}
                        </Typography>
                        <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                          <Chip label={subida.area} size="small" color="secondary" />
                          <Chip label={subida.Usuario?.nombre} size="small" variant="outlined" />
                          <Chip label={`${subida.cantidad} archivos`} size="small" />
                        </Box>
                      </Box>
                      <IconButton size="small" onClick={() => window.open(`/api/uploads/${archivos[0]}`, '_blank')}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <IconButton size="small" onClick={() => setOpenCard(isOpen ? null : subida.id)}>
                      {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                    <Typography variant="caption">Ver archivos</Typography>
                  </CardActions>
                  <Collapse in={isOpen}>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Typography variant="subtitle2">Archivos:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {archivos.map((archivo, idx) => (
                          <Chip
                            key={idx}
                            label={archivo.split('/').pop()}
                            size="small"
                            clickable
                            onClick={() => window.open(`/api/uploads/${archivo}`, '_blank')}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        IP: {subida.ip || 'No registrada'}
                      </Typography>
                    </Box>
                  </Collapse>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        // Vista en tabla para desktop (código existente)
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th style={{ textAlign: 'left', padding: 8 }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Usuario</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Área</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Descripción</th>
                <th style={{ textAlign: 'center', padding: 8 }}>Archivos</th>
                <th style={{ textAlign: 'center', padding: 8 }}>Vista</th>
              </tr>
            </thead>
            <tbody>
              {subidasFiltradas.map((subida) => {
                const archivos = JSON.parse(subida.archivos || '[]');
                return (
                  <tr key={subida.id}>
                    <td style={{ padding: 8 }}>{new Date(subida.created_at).toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{subida.Usuario?.nombre || 'Desconocido'}</td>
                    <td style={{ padding: 8 }}><Chip label={subida.area} size="small" /></td>
                    <td style={{ padding: 8 }}>{subida.descripcion}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{subida.cantidad}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}>
                      <IconButton size="small" onClick={() => window.open(`/api/uploads/${archivos[0]}`, '_blank')}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      )}
    </Paper>
  );
};

export default Historial;