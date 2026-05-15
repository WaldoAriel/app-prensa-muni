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
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  Search,
  Clear,
  GridView,
  ViewList,
  Close,
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

  // Estados de filtros
  const [filtroArea, setFiltroArea] = useState("todas");
  const [filtroMes, setFiltroMes] = useState("todos");
  const [filtroDia, setFiltroDia] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState("grid");

  // Modal
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);

  // Extraer áreas, meses y días disponibles
  const areas = [
    "todas",
    "obras",
    "cultura",
    "turismo",
    "intendencia",
    "deportes",
    "educacion",
    "salud",
    "ambiente",
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
      // Ordenar por fecha descendente (las más nuevas primero)
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

  // Extraer información de la ruta del archivo
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

  // Filtrar galería
  const galeriaFiltrada = galeria.filter((item) => {
    const { area, anio, mes, dia, nombreArchivo, fecha } = extraerInfo(item);

    // Filtro por área
    if (filtroArea !== "todas" && area !== filtroArea) return false;

    // Filtro por mes
    if (filtroMes !== "todos") {
      const mesNumero = String(meses.indexOf(filtroMes)).padStart(2, "0");
      if (mes !== mesNumero && mes !== `0${meses.indexOf(filtroMes)}`)
        return false;
    }

    // Filtro por día específico
    if (filtroDia && fecha !== filtroDia) return false;

    // Búsqueda por texto
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
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        🖼️ Galería de Medios
      </Typography>

      {/* Filtros */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Área</InputLabel>
          <Select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            label="Área"
          >
            {areas.map((a) => (
              <MenuItem key={a} value={a}>
                {a === "todas"
                  ? "Todas"
                  : a.charAt(0).toUpperCase() + a.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130 }}>
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
            slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }}
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
          sx={{ minWidth: 200 }}
        />

        {hayFiltrosActivos && (
          <Chip
            label="Limpiar filtros"
            onClick={limpiarFiltros}
            onDelete={limpiarFiltros}
            deleteIcon={<Clear />}
            color="primary"
            variant="outlined"
          />
        )}

        <ToggleButtonGroup
          value={vista}
          exclusive
          onChange={(e, val) => val && setVista(val)}
          size="small"
          sx={{ ml: "auto" }}
        >
          <ToggleButton value="grid">
            <GridView fontSize="small" />
          </ToggleButton>
          <ToggleButton value="list">
            <ViewList fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Resultados */}
      {galeriaFiltrada.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h1" sx={{ fontSize: "4rem", mb: 2 }}>
            🖼️
          </Typography>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No hay fotos o videos
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Subí tus primeros archivos desde la pestaña "Subir"
          </Typography>
        </Box>
      ) : vista === "grid" ? (
        <Grid container spacing={2}>
          {galeriaFiltrada.map((item, idx) => {
            const { area, nombreArchivo, fecha, nombreMes, dia } =
              extraerInfo(item);
            const esVideo = item.match(/\.(mp4|webm|mov)$/i);
            const ruta = `/api/uploads/${item}`;
            const fechaFormateada = fecha
              ? `${fecha.split("-")[2]}/${fecha.split("-")[1]}/${fecha.split("-")[0]}`
              : "";

            return (
              <Grid item xs={6} sm={4} md={3} lg={2} key={idx}>
                <Box
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => !esVideo && setImagenSeleccionada(ruta)}
                >
                  {esVideo ? (
                    <video
                      src={ruta}
                      style={{ width: "100%", height: 120, objectFit: "cover" }}
                      controls
                    />
                  ) : (
                    <img
                      src={ruta}
                      alt={nombreArchivo}
                      style={{ width: "100%", height: 120, objectFit: "cover" }}
                    />
                  )}
                  <Box sx={{ p: 1, bgcolor: "#f5f5f5" }}>
                    <Chip
                      label={area}
                      size="small"
                      sx={{ mb: 0.5, fontSize: "10px", height: 20 }}
                    />
                    <Typography
                      variant="caption"
                      display="block"
                      color="textSecondary"
                      sx={{ fontSize: "9px" }}
                    >
                      📅 {fechaFormateada}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{
                        fontSize: "9px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
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
        <Box sx={{ maxHeight: 500, overflow: "auto" }}>
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
                  p: 1.5,
                  borderBottom: "1px solid #e0e0e0",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#f5f5f5" },
                }}
                onClick={() => !esVideo && setImagenSeleccionada(ruta)}
              >
                {esVideo ? (
                  <video
                    src={ruta}
                    style={{
                      width: 50,
                      height: 50,
                      objectFit: "cover",
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <img
                    src={ruta}
                    alt={nombreArchivo}
                    style={{
                      width: 50,
                      height: 50,
                      objectFit: "cover",
                      borderRadius: 4,
                    }}
                  />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" noWrap>
                    {nombreArchivo}
                  </Typography>
                  <Box display="flex" gap={1} mt={0.5}>
                    <Chip
                      label={area}
                      size="small"
                      sx={{ height: 20, fontSize: "10px" }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {fecha}
                    </Typography>
                  </Box>
                </Box>
                <FolderOpen fontSize="small" color="action" />
              </Box>
            );
          })}
        </Box>
      )}

      {/* Modal para ver imagen en grande */}
      <Dialog
        open={!!imagenSeleccionada}
        onClose={() => setImagenSeleccionada(null)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0, position: "relative" }}>
          <IconButton
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.5)",
              color: "white",
            }}
            onClick={() => setImagenSeleccionada(null)}
          >
            <Close />
          </IconButton>
          <img
            src={imagenSeleccionada}
            alt=""
            style={{ width: "100%", maxHeight: "90vh", objectFit: "contain" }}
          />
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default Galeria;
