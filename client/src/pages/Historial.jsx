import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme,
  Grid,
  Stack,
  Button,
  Divider,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Download,
  Visibility,
  History,
  CloudDownload,
} from "@mui/icons-material";
import api from "../services/api";

const Historial = () => {
  const [subidas, setSubidas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroArea, setFiltroArea] = useState("todas");
  const [filtroUsuario, setFiltroUsuario] = useState("todos");
  const [usuarios, setUsuarios] = useState([]);
  const [openCard, setOpenCard] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const areas = [
    "todas",
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

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const response = await api.get("/historial");
      setSubidas(response.data.subidas || []);
      const usuariosUnicos = [
        ...new Set(
          response.data.subidas
            .map((s) => s.Usuario?.nombre)
            .filter(Boolean),
        ),
      ];
      setUsuarios(usuariosUnicos);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || "Error al cargar el historial");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const subidasFiltradas = subidas.filter((subida) => {
    if (filtroArea !== "todas" && subida.area !== filtroArea) return false;
    if (filtroUsuario !== "todos" && subida.Usuario?.nombre !== filtroUsuario)
      return false;
    return true;
  });

  const exportarCSV = () => {
    const headers = [
      "Fecha",
      "Usuario",
      "Área",
      "Descripción",
      "Cantidad",
      "IP",
    ];
    const rows = subidasFiltradas.map((s) => [
      new Date(s.created_at).toLocaleString(),
      s.Usuario?.nombre || "Desconocido",
      s.area,
      s.descripcion,
      s.cantidad,
      s.ip || "No registrada",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute(
      "download",
      `historial_subidas_${new Date().toISOString().slice(0, 19)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (cargando)
    return (
      <Box display="flex" justifyContent="center" my={6}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Historial
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subidasFiltradas.length} subida(s)
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="success"
          startIcon={<Download />}
          onClick={exportarCSV}
          sx={{ textTransform: "none" }}
        >
          Exportar CSV
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Área</InputLabel>
            <Select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              label="Área"
            >
              {areas.map((a) => (
                <MenuItem key={a} value={a}>
                  {a === "todas" ? "Todas" : a}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Usuario</InputLabel>
            <Select
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              label="Usuario"
            >
              <MenuItem value="todos">Todos</MenuItem>
              {usuarios.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {subidasFiltradas.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            bgcolor: "grey.50",
          }}
        >
          <History sx={{ fontSize: 64, color: "grey.300", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay subidas registradas
          </Typography>
        </Paper>
      ) : isMobile ? (
        <Grid container spacing={2}>
          {subidasFiltradas.map((subida) => {
            const archivos = JSON.parse(subida.archivos || "[]");
            const isOpen = openCard === subida.id;
            return (
              <Grid item xs={12} key={subida.id}>
                <Card>
                  <CardContent sx={{ pb: 1 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(subida.created_at).toLocaleString()}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mt: 0.5, fontWeight: 600 }}>
                          {subida.descripcion}
                        </Typography>
                        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                          <Chip label={subida.area} size="small" color="primary" variant="outlined" />
                          <Chip label={subida.Usuario?.nombre} size="small" variant="outlined" />
                          <Chip label={`${subida.cantidad} archivos`} size="small" />
                        </Stack>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() =>
                          window.open(`/api/uploads/${archivos[0]}`, "_blank")
                        }
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ pt: 0 }}>
                    <IconButton
                      size="small"
                      onClick={() => setOpenCard(isOpen ? null : subida.id)}
                    >
                      {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                    <Typography variant="caption" color="text.secondary">
                      Ver archivos
                    </Typography>
                  </CardActions>
                  <Collapse in={isOpen}>
                    <Box sx={{ px: 2, pb: 2 }}>
                      {subida.contexto_redes && (
                        <Alert severity="info" sx={{ mb: 1.5, py: 0 }}>
                          {subida.contexto_redes}
                        </Alert>
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 1 }}
                      >
                        Archivos:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {archivos.map((archivo, idx) => (
                          <Chip
                            key={idx}
                            label={archivo.split("/").pop()}
                            size="small"
                            clickable
                            onClick={() =>
                              window.open(`/api/uploads/${archivo}`, "_blank")
                            }
                            sx={{ maxWidth: "100%" }}
                          />
                        ))}
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1.5, display: "block" }}
                      >
                        IP: {subida.ip || "No registrada"}
                      </Typography>
                    </Box>
                  </Collapse>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper>
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Fecha</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Usuario</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Área</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Descripción</th>
                  <th style={{ textAlign: "center", padding: "12px 16px" }}>Archivos</th>
                  <th style={{ textAlign: "center", padding: "12px 16px" }}>Vista</th>
                </tr>
              </thead>
              <tbody>
                {subidasFiltradas.map((subida) => {
                  const archivos = JSON.parse(subida.archivos || "[]");
                  return (
                    <tr
                      key={subida.id}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        window.open(`/api/uploads/${archivos[0]}`, "_blank")
                      }
                    >
                      <td style={{ padding: "12px 16px" }}>
                        {new Date(subida.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {subida.Usuario?.nombre || "Desconocido"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Chip label={subida.area} size="small" />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div>{subida.descripcion}</div>
                        {subida.contexto_redes && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#666",
                              fontStyle: "italic",
                              marginTop: 4,
                              maxWidth: 250,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {subida.contexto_redes}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 16px" }}>
                        {subida.cantidad}
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 16px" }}>
                        <IconButton size="small">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Historial;
