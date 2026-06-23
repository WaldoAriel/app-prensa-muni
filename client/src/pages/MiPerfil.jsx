import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
} from "@mui/material";
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
  Save,
} from "@mui/icons-material";
import api from "../services/api";

const MiPerfil = () => {
  const { usuario } = useAuth();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (passwordNueva !== passwordConfirmar) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    if (passwordNueva.length < 4) {
      setError("La nueva contraseña debe tener al menos 4 caracteres");
      return;
    }

    setCargando(true);
    try {
      await api.put("/usuarios/mi-password", {
        passwordActual,
        passwordNueva,
      });
      setExito("Contraseña actualizada correctamente");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
    } catch (error) {
      setError(error.response?.data?.error || "Error al cambiar contraseña");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Mi Perfil
      </Typography>

      <Paper sx={{ p: { xs: 2, sm: 4 }, maxWidth: 500 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 56,
              height: 56,
            }}
          >
            <Person sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {usuario?.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {usuario?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rol: {usuario?.rol === "admin" ? "Administrador" : "Fotógrafo"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Cambiar contraseña
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Contraseña actual"
            type={showActual ? "text" : "password"}
            margin="normal"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowActual(!showActual)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showActual ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            fullWidth
            label="Nueva contraseña"
            type={showNueva ? "text" : "password"}
            margin="normal"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNueva(!showNueva)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showNueva ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            fullWidth
            label="Confirmar nueva contraseña"
            type={showNueva ? "text" : "password"}
            margin="normal"
            value={passwordConfirmar}
            onChange={(e) => setPasswordConfirmar(e.target.value)}
            required
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {exito && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {exito}
            </Alert>
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={
              cargando ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save />
              )
            }
            disabled={cargando}
            sx={{ mt: 3, py: 1.5 }}
          >
            {cargando ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default MiPerfil;
