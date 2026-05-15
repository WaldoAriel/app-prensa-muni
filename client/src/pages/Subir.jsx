import React, { useState, useEffect } from "react";
import {
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import {
  Delete,
  CloudUpload,
  CloudOff,
  Sync,
  CheckCircle,
  Warning,
  Image,
  Videocam,
} from "@mui/icons-material";
import {
  guardarPendiente,
  obtenerPendientes,
  contarPendientes,
  eliminarPendiente,
} from "../utils/db";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const areas = [
  "Obras",
  "Cultura",
  "Turismo",
  "Intendencia",
  "Deportes",
  "Educacion",
  "Salud",
  "Ambiente",
];

const Subir = ({ onSubidaExitosa, actualizarContador }) => {
  const [area, setArea] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mensaje, setMensaje] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [sincronizando, setSincronizando] = useState(false);
  const { token } = useAuth();

  const hayInternet = navigator.onLine;

  useEffect(() => {
    cargarPendientes();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setMensaje({
        type: "info",
        text: "🟢 Conexión restablecida. ¡Usá el botón Sincronizar!",
      });
      setTimeout(() => setMensaje(null), 3000);
      cargarPendientes();
    };
    const handleOffline = () => {
      setMensaje({
        type: "warning",
        text: "🔴 Sin conexión. Las fotos se guardarán localmente.",
      });
      setTimeout(() => setMensaje(null), 3000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const cargarPendientes = async () => {
    const lista = await obtenerPendientes();
    setPendientes(lista);
    const count = await contarPendientes();
    if (actualizarContador) actualizarContador(count);
  };

  const handleArchivosChange = (e) => {
    const files = Array.from(e.target.files);
    setArchivos(files);
  };

  const eliminarArchivoSeleccionado = (index) => {
    const nuevosArchivos = [...archivos];
    nuevosArchivos.splice(index, 1);
    setArchivos(nuevosArchivos);
  };

  const subirNormal = async () => {
    if (!area || !descripcion || archivos.length === 0) {
      setMensaje({ type: "error", text: "Completá todos los campos" });
      return;
    }

    setSubiendo(true);
    setProgreso(0);

    const formData = new FormData();
    archivos.forEach((archivo) => formData.append("fotos", archivo));
    formData.append("area", area);
    formData.append("descripcion", descripcion);

    try {
      const response = await api.post("/subir", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setProgreso(percent);
        },
      });

      setMensaje({ type: "success", text: `✅ ${response.data.mensaje}` });
      setArchivos([]);
      setArea("");
      setDescripcion("");
      if (onSubidaExitosa) onSubidaExitosa();

      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      setMensaje({
        type: "error",
        text: error.response?.data?.error || "Error al subir",
      });
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  };

  const guardarLocal = async () => {
    if (!area || !descripcion || archivos.length === 0) {
      setMensaje({ type: "error", text: "Completá todos los campos" });
      return;
    }

    setSubiendo(true);
    try {
      await guardarPendiente(area, descripcion, archivos);
      setMensaje({
        type: "success",
        text: `📦 ${archivos.length} archivo(s) guardados localmente. Usá el botón Sincronizar cuando vuelvas a la oficina.`,
      });
      setArchivos([]);
      setArea("");
      setDescripcion("");
      await cargarPendientes();
    } catch (error) {
      setMensaje({
        type: "error",
        text: "Error al guardar localmente: " + error.message,
      });
    } finally {
      setSubiendo(false);
    }
  };

  const sincronizarPendientes = async () => {
    if (pendientes.length === 0) return;

    setSincronizando(true);
    let exitosos = 0;
    let fallidos = 0;
    let actual = 0;
    const total = pendientes.length;

    for (const p of pendientes) {
      actual++;
      const formData = new FormData();
      formData.append("fotos", p.archivo);
      formData.append("area", p.area);
      formData.append("descripcion", p.descripcion);

      try {
        await api.post("/subir", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await eliminarPendiente(p.id);
        exitosos++;
        setMensaje({
          type: "info",
          text: `Sincronizando: ${actual} de ${total}...`,
        });
      } catch (error) {
        console.error("Error:", p.nombreOriginal, error);
        fallidos++;
      }
    }

    await cargarPendientes();

    let mensajeText = "";
    let tipo = "success";
    if (exitosos > 0 && fallidos === 0) {
      mensajeText = `✅ ¡Sincronización completa! ${exitosos} archivo(s) subidos.`;
    } else if (exitosos > 0 && fallidos > 0) {
      mensajeText = `⚠️ Parcial: ${exitosos} subidos, ${fallidos} fallidos.`;
      tipo = "warning";
    } else {
      mensajeText = `❌ Error: No se pudo sincronizar (${fallidos} fallidos).`;
      tipo = "error";
    }

    setMensaje({ type: tipo, text: mensajeText });
    if (exitosos > 0 && onSubidaExitosa) onSubidaExitosa();
    setSincronizando(false);
    setTimeout(() => setMensaje(null), 4000);
  };

  const eliminarPendienteLocal = async (id, nombre) => {
    if (confirm(`¿Eliminar "${nombre}" de la lista de pendientes?`)) {
      await eliminarPendiente(id);
      await cargarPendientes();
      setMensaje({ type: "info", text: `🗑️ Eliminado: ${nombre}` });
      setTimeout(() => setMensaje(null), 2000);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        📸 Subir Fotos/Videos
      </Typography>

      {mensaje && (
        <Alert
          severity={mensaje.type}
          sx={{ mb: 2 }}
          onClose={() => setMensaje(null)}
        >
          {mensaje.text}
        </Alert>
      )}

      {/* ===== INDICADOR DE CONEXIÓN ===== */}
      <Box sx={{ mb: 2 }}>
        {hayInternet ? (
          <Chip
            icon={<CloudUpload />}
            label="Conectado al servidor"
            color="success"
            size="small"
          />
        ) : (
          <Chip
            icon={<CloudOff />}
            label="Sin conexión - Modo offline"
            color="error"
            size="small"
          />
        )}
      </Box>

      {/* ===== PANEL DE PENDIENTES (solo el botón arriba, la lista abajo) ===== */}
      {pendientes.length > 0 && (
        <Card sx={{ mb: 3, border: "2px solid #ff9800", bgcolor: "#fff8e1" }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CloudOff color="warning" />
              <Typography variant="subtitle1">
                📦 {pendientes.length} archivo(s) pendiente(s) de sincronización
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={
                sincronizando ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Sync />
                )
              }
              onClick={sincronizarPendientes}
              disabled={sincronizando}
              fullWidth
              sx={{ py: 1.5, fontSize: "1rem" }}
            >
              {sincronizando
                ? "Sincronizando..."
                : `🚀 SINCRONIZAR ${pendientes.length} ARCHIVOS`}
            </Button>

            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ mt: 1, display: "block", textAlign: "center" }}
            >
              💡 Conectá el celular al WiFi de la oficina y presioná este botón
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* ===== FORMULARIO DE SUBIDA ===== */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Área</InputLabel>
        <Select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          label="Área"
        >
          {areas.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Descripción del evento"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        sx={{ mb: 2 }}
        placeholder="Ej: Bacheo calle Corrientes, Concierto en la plaza..."
      />

      <Button
        variant="outlined"
        component="label"
        fullWidth
        sx={{ mb: 2, py: 1.5 }}
      >
        📎 Seleccionar archivos (múltiples)
        <input
          type="file"
          hidden
          multiple
          accept="image/*,video/*"
          onChange={handleArchivosChange}
        />
      </Button>

      {archivos.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            📎 {archivos.length} archivo(s) seleccionado(s):
          </Typography>
          <List
            dense
            sx={{
              bgcolor: "#f5f5f5",
              borderRadius: 1,
              maxHeight: 200,
              overflow: "auto",
            }}
          >
            {archivos.map((f, i) => (
              <ListItem
                key={i}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => eliminarArchivoSeleccionado(i)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  {f.type.startsWith("image/") ? "🖼️" : "🎬"}
                </ListItemIcon>
                <ListItemText
                  primary={f.name}
                  secondary={formatFileSize(f.size)}
                />
              </ListItem>
            ))}
          </List>

          {subiendo && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={progreso} />
              <Typography
                variant="caption"
                align="center"
                display="block"
                sx={{ mt: 0.5 }}
              >
                {progreso}%
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            color={hayInternet ? "primary" : "warning"}
            startIcon={hayInternet ? <CloudUpload /> : <CloudOff />}
            onClick={hayInternet ? subirNormal : guardarLocal}
            disabled={
              subiendo || !area || !descripcion.trim() || archivos.length === 0
            }
            fullWidth
            size="large"
            sx={{ mt: 2 }}
          >
            {hayInternet
              ? subiendo
                ? `Subiendo... ${progreso}%`
                : "🚀 Subir al servidor"
              : subiendo
                ? "Guardando..."
                : "💾 Guardar localmente (offline)"}
          </Button>
        </Box>
      )}

      {!hayInternet && pendientes.length === 0 && archivos.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          💡 Modo offline activado. Las futuras subidas se guardarán localmente
          y aparecerán en el panel de pendientes.
        </Alert>
      )}

      {/* ===== LISTA DETALLADA DE PENDIENTES (ahora abajo) ===== */}
      {pendientes.length > 0 && (
        <Card sx={{ mt: 3, bgcolor: "#fafafa" }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              📋 Detalle de archivos pendientes:
            </Typography>
            <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
              {pendientes.map((p) => (
                <ListItem key={p.id} divider>
                  <ListItemIcon>
                    {p.tipo?.startsWith("image/") ? (
                      <Image color="primary" />
                    ) : (
                      <Videocam color="secondary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={p.nombreOriginal}
                    secondary={
                      <Box
                        component="span"
                        sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}
                      >
                        <Chip label={p.area} size="small" variant="outlined" />
                        <span>{p.descripcion}</span>
                        <span style={{ color: "#666" }}>
                          {formatFileSize(p.tamaño)}
                        </span>
                      </Box>
                    }
                  />
                  <IconButton
                    edge="end"
                    onClick={() =>
                      eliminarPendienteLocal(p.id, p.nombreOriginal)
                    }
                  >
                    <Delete />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Paper>
  );
};

export default Subir;
