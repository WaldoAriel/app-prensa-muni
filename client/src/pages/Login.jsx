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
  alpha,
} from "@mui/material";
import { Waves, Login as LoginIcon } from "@mui/icons-material";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 5,
            width: "100%",
            background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decoración ballena */}
          <Box
            sx={{ position: "absolute", top: -20, right: -20, opacity: 0.1 }}
          >
            <Waves sx={{ fontSize: 150 }} />
          </Box>

          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: "4rem",
                background: "linear-gradient(135deg, #1a5276 0%, #2e86c1 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                mb: 1,
              }}
            >
              🐋
            </Typography>
            <Typography variant="h4" gutterBottom fontWeight={700}>
              Prensa Muni
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Sistema de Gestión de Medios
            </Typography>
          </Box>

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
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="outlined"
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
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
                cargando ? <CircularProgress size={20} /> : <LoginIcon />
              }
              disabled={cargando}
              sx={{ mt: 3, py: 1.5 }}
            >
              {cargando ? "Ingresando..." : "Ingresar al Sistema"}
            </Button>
          </form>

          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mt: 3, display: "block", textAlign: "center" }}
          >
            Sistema exclusivo para personal de prensa
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
