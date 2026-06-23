import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  CameraAlt,
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    const resultado = await login(email, password);

    if (!resultado.success) {
      setError(resultado.error || "Error al iniciar sesión");
    }

    setCargando(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
        px: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 0,
          width: "100%",
          maxWidth: 420,
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: "primary.dark",
            color: "white",
            py: { xs: 3, sm: 4 },
            textAlign: "center",
          }}
        >
          <Avatar
            sx={{
              bgcolor: "secondary.main",
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2,
            }}
          >
            <CameraAlt sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Prensa Municipal
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            Sistema de Gestión de Medios
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography
            variant="h6"
            sx={{ mb: 0.5, fontWeight: 600, color: "text.primary" }}
          >
            Iniciar sesión
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresá tus credenciales para acceder
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              size="medium"
            />

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="medium"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
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
                  <LoginIcon />
                )
              }
              disabled={cargando}
              sx={{ mt: 3, py: 1.5, fontSize: "1rem" }}
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <Divider sx={{ my: 3 }} />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center" }}
          >
            Sistema exclusivo para personal de prensa
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
