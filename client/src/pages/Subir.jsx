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
  Stack,
} from "@mui/material";
import {
  Delete,
  CloudUpload,
  CloudOff,
  Sync,
  CheckCircle,
  Image,
  Videocam,
  WifiOff,
  Wifi,
  Send,
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
  "Obras públicas",
  "Obras privadas",
  "DISPO",
  "Turismo cultura y deportes",
  "Intendencia",
  "Salud",
  "Educación",
  "Desarrollo social",
  "Zoonosis",
];

const Subir = ({ onSubidaExitosa, actualizarContador }) => {
  const [area, setArea] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [contextoRedes, setContextoRedes] = useState("");
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
        text: "Conexión restablecida. Podés sincronizar los archivos pendientes.",
      });
      setTimeout(() => setMensaje(null), 4000);
      cargarPendientes();
    };
    const handleOffline = () => {
      setMensaje({
        type: "warning",
        text: "Sin conexión. Los archivos se guardarán localmente.",
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
    if (!area || !descripcion || !contextoRedes.trim() || archivos.length === 0) {
      setMensaje({ type: "error", text: "Completá todos los campos" });
      return;
    }

    setSubiendo(true);
    setProgreso(0);

    const formData = new FormData();
    archivos.forEach((archivo) => formData.append("fotos", archivo));
    formData.append("area", area);
    formData.append("descripcion", descripcion);
    formData.append("contexto_redes", contextoRedes);

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

      setMensaje({ type: "success", text: response.data.mensaje });
      setArchivos([]);
      setArea("");
      setDescripcion("");
      setContextoRedes("");
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
    if (!area || !descripcion || !contextoRedes.trim() || archivos.length === 0) {
      setMensaje({ type: "error", text: "Completá todos los campos" });
      return;
    }

    setSubiendo(true);
    try {
      await guardarPendiente(area, descripcion, contextoRedes, archivos);
      setMensaje({
        type: "success",
        text: `${archivos.length} archivo(s) guardados localmente. Sincronizá cuando tengas conexión.`,
      });
      setArchivos([]);
      setArea("");
      setDescripcion("");
      setContextoRedes("");
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
      formData.append("contexto_redes", p.contexto_redes || "");

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
      mensajeText = `Sincronización completa. ${exitosos} archivo(s) subidos.`;
    } else if (exitosos > 0 && fallidos > 0) {
      mensajeText = `Parcial: ${exitosos} subidos, ${fallidos} fallidos.`;
      tipo = "warning";
    } else {
      mensajeText = `No se pudo sincronizar (${fallidos} fallidos).`;
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
      setMensaje({ type: "info", text: `Eliminado: ${nombre}` });
      setTimeout(() => setMensaje(null), 2000);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Subir Fotos/Videos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seleccioná los archivos del evento y completá la información
          </Typography>
        </Box>
        <Chip
          icon={hayInternet ? <Wifi /> : <WifiOff />}
          label={hayInternet ? "Conectado" : "Sin conexión"}
          color={hayInternet ? "success" : "error"}
          variant="outlined"
          size="small"
        />
      </Box>

      {mensaje && (
        <Alert
          severity={mensaje.type}
          sx={{ mb: 3 }}
          onClose={() => setMensaje(null)}
        >
          {mensaje.text}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
        {/* Panel de pendientes */}
        {pendientes.length > 0 && (
          <Card
            sx={{
              border: "1px solid",
              borderColor: "warning.main",
              bgcolor: "rgba(230, 81, 0, 0.04)",
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <CloudOff color="warning" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Pendientes de sincronización
                </Typography>
                <Chip
                  label={pendientes.length}
                  size="small"
                  color="warning"
                  sx={{ ml: "auto" }}
                />
              </Stack>

              <Button
                variant="contained"
                color="warning"
                fullWidth
                startIcon={
                  sincronizando ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Sync />
                  )
                }
                onClick={sincronizarPendientes}
                disabled={sincronizando}
                sx={{ py: 1.5, mb: 2 }}
              >
                {sincronizando
                  ? "Sincronizando..."
                  : `Sincronizar ${pendientes.length} archivo(s)`}
              </Button>

              <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                {pendientes.map((p) => (
                  <ListItem
                    key={p.id}
                    divider
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() =>
                          eliminarPendienteLocal(p.id, p.nombreOriginal)
                        }
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {p.tipo?.startsWith("image/") ? (
                        <Image fontSize="small" color="primary" />
                      ) : (
                        <Videocam fontSize="small" color="secondary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={p.nombreOriginal}
                      secondary={formatFileSize(p.tamaño)}
                      primaryTypographyProps={{ variant: "body2", noWrap: true }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Formulario principal */}
        <Paper sx={{ p: 3, flex: 1 }}>
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

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Contexto para redes"
            value={contextoRedes}
            onChange={(e) => setContextoRedes(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Indica qué ocurrió, personas destacadas o puntos clave para el posteo..."
            helperText="Esta información ayudará a redactar el copy y editar el material."
          />

          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<CloudUpload />}
            sx={{ mb: 2, py: 1.5, borderStyle: "dashed", borderWidth: 2 }}
          >
            Seleccionar archivos
            <input
              type="file"
              hidden
              multiple
              accept="image/*,video/*"
              onChange={handleArchivosChange}
            />
          </Button>

          {archivos.length > 0 && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  {archivos.length} archivo(s) seleccionado(s):
                </Typography>
                <List
                  dense
                  sx={{
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    maxHeight: 180,
                    overflow: "auto",
                  }}
                >
                  {archivos.map((f, i) => (
                    <ListItem
                      key={i}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => eliminarArchivoSeleccionado(i)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {f.type.startsWith("image/") ? (
                          <Image fontSize="small" color="primary" />
                        ) : (
                          <Videocam fontSize="small" color="secondary" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={f.name}
                        secondary={formatFileSize(f.size)}
                        primaryTypographyProps={{
                          variant: "body2",
                          noWrap: true,
                        }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {subiendo && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress variant="determinate" value={progreso} />
                  <Typography
                    variant="caption"
                    align="center"
                    display="block"
                    sx={{ mt: 0.5, color: "text.secondary" }}
                  >
                    {progreso}%
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                color={hayInternet ? "primary" : "warning"}
                startIcon={
                  subiendo ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : hayInternet ? (
                    <Send />
                  ) : (
                    <CloudOff />
                  )
                }
                onClick={hayInternet ? subirNormal : guardarLocal}
                disabled={
                  subiendo ||
                  !area ||
                  !descripcion.trim() ||
                  archivos.length === 0
                }
                fullWidth
                size="large"
                sx={{ py: 1.5 }}
              >
                {subiendo
                  ? hayInternet
                    ? `Subiendo... ${progreso}%`
                    : "Guardando..."
                  : hayInternet
                    ? "Subir al servidor"
                    : "Guardar localmente"}
              </Button>
            </>
          )}

          {!hayInternet && pendientes.length === 0 && archivos.length === 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Modo offline activado. Las futuras subidas se guardarán
              localmente.
            </Alert>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Subir;
