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
} from "@mui/material";
import {
  Delete,
  CloudUpload,
  CloudOff,
  Sync,
  CheckCircle,
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

  // Detectar si hay internet
  const hayInternet = navigator.onLine;

  // Cargar pendientes al iniciar
  useEffect(() => {
    cargarPendientes();
  }, []);

  // Escuchar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      setMensaje({
        type: "info",
        text: "🟢 Conexión restablecida. Podés sincronizar los archivos pendientes.",
      });
      setTimeout(() => setMensaje(null), 3000);
      cargarPendientes();
    };
    const handleOffline = () => {
      setMensaje({
        type: "warning",
        text: "🔴 Sin conexión. Los archivos se guardarán localmente.",
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

  // Subida normal (con internet)
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
      console.error("Error:", error);
      setMensaje({
        type: "error",
        text: error.response?.data?.error || "Error al subir",
      });
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  };

  // Guardar localmente (offline)
  const guardarLocal = async () => {
    if (!area || !descripcion || archivos.length === 0) {
      setMensaje({ type: "error", text: "Completá todos los campos" });
      return;
    }

    setSubiendo(true);
    try {
      const guardados = await guardarPendiente(area, descripcion, archivos);
      setMensaje({
        type: "success",
        text: `📦 ${archivos.length} archivo(s) guardados localmente. Se sincronizarán cuando haya conexión.`,
      });
      setArchivos([]);
      setArea("");
      setDescripcion("");
      await cargarPendientes();
    } catch (error) {
      console.error("Error guardando local:", error);
      setMensaje({
        type: "error",
        text: "Error al guardar localmente: " + error.message,
      });
    } finally {
      setSubiendo(false);
    }
  };

  // Sincronizar pendientes con el servidor
  const sincronizarPendientes = async () => {
    if (pendientes.length === 0) return;

    setSincronizando(true);
    let exitosos = 0;
    let fallidos = 0;

    for (const p of pendientes) {
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
      } catch (error) {
        console.error("Error sincronizando:", p.nombreOriginal, error);
        fallidos++;
      }
    }

    await cargarPendientes();

    let mensajeText = "";
    if (exitosos > 0 && fallidos === 0) {
      mensajeText = `✅ ¡Sincronización completa! ${exitosos} archivo(s) subidos.`;
    } else if (exitosos > 0 && fallidos > 0) {
      mensajeText = `⚠️ Parcial: ${exitosos} subidos, ${fallidos} fallidos.`;
    } else {
      mensajeText = `❌ Error: No se pudo sincronizar (${fallidos} fallidos).`;
    }

    setMensaje({ type: exitosos > 0 ? "success" : "error", text: mensajeText });
    if (exitosos > 0 && onSubidaExitosa) onSubidaExitosa();
    setSincronizando(false);
    setTimeout(() => setMensaje(null), 4000);
  };

  const eliminarPendienteLocal = async (id, nombre) => {
    await eliminarPendiente(id);
    await cargarPendientes();
    setMensaje({ type: "info", text: `🗑️ Eliminado: ${nombre}` });
    setTimeout(() => setMensaje(null), 2000);
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

      {!hayInternet && (
        <Alert severity="warning" icon={<CloudOff />} sx={{ mb: 2 }}>
          📴 Sin conexión a internet. Los archivos se guardarán localmente y se
          sincronizarán cuando vuelvas a la oficina.
        </Alert>
      )}

      {hayInternet && pendientes.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: "#fff8e1" }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              📦 <strong>{pendientes.length}</strong> archivo(s) pendiente(s) de
              sincronización
            </Typography>
            <List dense>
              {pendientes.slice(0, 5).map((p) => (
                <ListItem
                  key={p.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() =>
                        eliminarPendienteLocal(p.id, p.nombreOriginal)
                      }
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <CloudOff color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={p.nombreOriginal}
                    secondary={`${p.area} - ${p.descripcion}`}
                  />
                </ListItem>
              ))}
            </List>
            {pendientes.length > 5 && (
              <Typography variant="caption" color="textSecondary">
                ... y {pendientes.length - 5} más
              </Typography>
            )}
            <Button
              variant="contained"
              color="warning"
              startIcon={<Sync />}
              onClick={sincronizarPendientes}
              disabled={sincronizando}
              fullWidth
              sx={{ mt: 2 }}
            >
              {sincronizando ? (
                <CircularProgress size={24} />
              ) : (
                `Sincronizar ${pendientes.length} archivos`
              )}
            </Button>
          </CardContent>
        </Card>
      )}

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
                  secondary={`${(f.size / 1024 / 1024).toFixed(2)} MB`}
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
          y se sincronizarán automáticamente cuando vuelva la conexión.
        </Alert>
      )}
    </Paper>
  );
};

export default Subir;
