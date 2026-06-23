import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Dialog,
  DialogContent,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Badge,
} from "@mui/material";
import {
  Search,
  Clear,
  GridView,
  ViewList,
  Close,
  PhotoLibrary,
  CalendarMonth,
  FolderOpen,
} from "@mui/icons-material";
import api from "../services/api";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const Galeria = () => {
  const [galeria, setGaleria] = useState([]);
  const [galeriaOriginal, setGaleriaOriginal] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [filtroArea, setFiltroArea] = useState("todas");
  const [filtroMes, setFiltroMes] = useState("todos");
  const [filtroDia, setFiltroDia] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState("grid");

  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);

  const formatAreaLabel = (area) => {
    const labels = {
      todas: "Todas",
      obras_publicas: "Obras públicas",
      dispo: "DISPO",
      turismo_cultura_y_deportes: "Turismo cultura y deportes",
      intendencia: "Intendencia",
      salud: "Salud",
      educacion: "Educación",
      desarrollo_social: "Desarrollo social",
      zoonosis: "Zoonosis",
      otros: "Otros",
    };
    return labels[area] || area.charAt(0).toUpperCase() + area.slice(1);
  };

  const areas = [
    "todas",
    "obras_publicas",
    "dispo",
    "turismo_cultura_y_deportes",
    "intendencia",
    "salud",
    "educacion",
    "desarrollo_social",
    "zoonosis",
    "otros",
  ];
  const meses = [
    "todos",
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const cargarGaleria = async () => {
    setCargando(true);
    try {
      const response = await api.get("/fotos");
      const fotosOrdenadas = (response.data.fotos || []).sort().reverse();
      setGaleria(fotosOrdenadas);
      setGaleriaOriginal(fotosOrdenadas);
      setError(null);
    } catch (error) {
      console.error("Error al cargar galería:", error);
      setError(error.response?.data?.error || "Error al cargar la galería");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarGaleria();
  }, []);

  const extraerInfo = (ruta) => {
    const partes = ruta.split("/");
    const area = partes[0] || "";
    const anio = partes[1] || "";
    const mes = partes[2] || "";
    const dia = partes[3] || "";
    const nombreArchivo = partes[4] || "";

    const fecha = anio && mes && dia ? `${anio}-${mes}-${dia}` : "";
    const nombreMes = mes ? meses[parseInt(mes) - 1] || "" : "";

    return { area, anio, mes, dia, nombreArchivo, fecha, nombreMes };
  };

  const galeriaFiltrada = galeria.filter((item) => {
    const { area, mes, dia, nombreArchivo, fecha } = extraerInfo(item);

    if (filtroArea !== "todas" && area !== filtroArea) return false;

    if (filtroMes !== "todos") {
      const mesNumero = String(meses.indexOf(filtroMes)).padStart(2, "0");
      if (mes !== mesNumero && mes !== `0${meses.indexOf(filtroMes)}`)
        return false;
    }

    if (filtroDia && fecha !== filtroDia) return false;

    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      return (
        area.toLowerCase().includes(busquedaLower) ||
        nombreArchivo.toLowerCase().includes(busquedaLower) ||
        fecha.includes(busqueda)
      );
    }

    return true;
  });

  const limpiarFiltros = () => {
    setFiltroArea("todas");
    setFiltroMes("todos");
    setFiltroDia("");
    setBusqueda("");
  };

  const hayFiltrosActivos =
    filtroArea !== "todas" || filtroMes !== "todos" || filtroDia || busqueda;

  if (cargando) {
    return (
      <Box display="flex" justifyContent="center" my={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Galería de Medios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {galeriaFiltrada.length} archivo(s)
            {hayFiltrosActivos && " (filtrado)"}
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={vista}
          exclusive
          onChange={(e, val) => val && setVista(val)}
          size="small"
        >
          <ToggleButton value="grid">
            <GridView fontSize="small" />
          </ToggleButton>
          <ToggleButton value="list">
            <ViewList fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <FormControl size="small" sx={{ width: "100%" }}>
            <InputLabel>Área</InputLabel>
            <Select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              label="Área"
            >
              {areas.map((a) => (
                <MenuItem key={a} value={a}>
                  {formatAreaLabel(a)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: "100%" }}>
            <InputLabel>Mes</InputLabel>
            <Select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              label="Mes"
            >
              {meses.map((m) => (
                <MenuItem key={m} value={m}>
                  {m === "todos" ? "Todos" : m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Día específico"
              value={filtroDia ? new Date(filtroDia) : null}
              onChange={(newValue) => {
                setFiltroDia(
                  newValue ? newValue.toISOString().split("T")[0] : "",
                );
              }}
              slotProps={{
                textField: { size: "small", sx: { width: "100%" } },
              }}
            />
          </LocalizationProvider>

          <TextField
            size="small"
            label="Buscar"
            placeholder="Área o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: <Search fontSize="small" sx={{ mr: 0.5 }} />,
            }}
            sx={{ width: "100%" }}
          />

          {hayFiltrosActivos && (
            <Chip
              label="Limpiar"
              onClick={limpiarFiltros}
              onDelete={limpiarFiltros}
              deleteIcon={<Clear />}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
        </Stack>
      </Paper>

      {/* Contenido */}
      {galeriaFiltrada.length === 0 ? (
        <Paper
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: "center",
            bgcolor: "grey.50",
          }}
        >
          <PhotoLibrary
            sx={{ fontSize: 64, color: "grey.300", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay fotos o videos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Subí tus primeros archivos desde la pestaña "Subir"
          </Typography>
        </Paper>
      ) : vista === "grid" ? (
        <Grid container spacing={2}>
          {galeriaFiltrada.map((item, idx) => {
            const { area, nombreArchivo, fecha, dia } = extraerInfo(item);
            const esVideo = item.match(/\.(mp4|webm|mov)$/i);
            const ruta = `/api/uploads/${item}`;
            const fechaFormateada = fecha
              ? `${fecha.split("-")[2]}/${fecha.split("-")[1]}/${fecha.split("-")[0]}`
              : "";

            return (
              <Grid item xs={6} sm={4} md={3} lg={2} key={idx}>
                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "grey.200",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 4px 16px rgba(255,114,4,0.12)",
                      transform: "translateY(-2px)",
                    },
                  }}
                  onClick={() => !esVideo && setImagenSeleccionada(ruta)}
                >
                  {esVideo ? (
                    <Box sx={{ position: "relative" }}>
                      <video
                        src={ruta}
                        style={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          display: "block",
                        }}
                        controls
                      />
                    </Box>
                  ) : (
                    <img
                      src={ruta}
                      alt={nombreArchivo}
                      style={{
                        width: "100%",
                        height: 120,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                  <Box sx={{ p: 1.5, bgcolor: "white" }}>
                    <Chip
                      label={formatAreaLabel(area)}
                      size="small"
                      sx={{
                        mb: 0.5,
                        height: 22,
                        fontSize: "0.7rem",
                        bgcolor: "grey.100",
                      }}
                    />
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      {fechaFormateada}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{
                        fontSize: "0.68rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "text.secondary",
                      }}
                    >
                      {nombreArchivo.length > 25
                        ? nombreArchivo.substring(0, 22) + "..."
                        : nombreArchivo}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper>
          <Box sx={{ maxHeight: 600, overflow: "auto" }}>
            {galeriaFiltrada.map((item, idx) => {
              const { area, nombreArchivo, fecha } = extraerInfo(item);
              const ruta = `/api/uploads/${item}`;
              const esVideo = item.match(/\.(mp4|webm|mov)$/i);
              return (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "grey.100",
                    cursor: "pointer",
                    transition: "background-color 0.15s",
                    "&:hover": { bgcolor: "grey.50" },
                  }}
                  onClick={() => !esVideo && setImagenSeleccionada(ruta)}
                >
                  {esVideo ? (
                    <video
                      src={ruta}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <img
                      src={ruta}
                      alt={nombreArchivo}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {nombreArchivo}
                    </Typography>
                    <Box display="flex" gap={1} mt={0.5} alignItems="center">
                      <Chip
                        label={formatAreaLabel(area)}
                        size="small"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {fecha}
                      </Typography>
                    </Box>
                  </Box>
                  <FolderOpen fontSize="small" color="action" />
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* Modal imagen */}
      <Dialog
        open={!!imagenSeleccionada}
        onClose={() => setImagenSeleccionada(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: "relative" }}>
          <IconButton
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.6)",
              color: "white",
              zIndex: 1,
              "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
            }}
            onClick={() => setImagenSeleccionada(null)}
          >
            <Close />
          </IconButton>
          <img
            src={imagenSeleccionada}
            alt=""
            style={{
              width: "100%",
              maxHeight: "90vh",
              objectFit: "contain",
              display: "block",
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Galeria;
