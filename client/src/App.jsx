import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  CircularProgress,
  Box,
} from "@mui/material";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Subir from "./pages/Subir";
import Navbar from "./components/Navbar";
import { contarPendientes } from "./utils/db";
import api from "./services/api";
import Historial from "./pages/Historial";
import { Alert, Typography } from "@mui/material";
import Galeria from "./pages/Galeria";
import AdminUsuarios from "./pages/AdminUsuarios";

// Tema personalizado de Material UI
const theme = createTheme({
  palette: {
    primary: {
      main: "#007bff",
    },
    secondary: {
      main: "#6c757d",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
  },
});

// Componente del Dashboard (pantalla principal después del login)
const Dashboard = () => {
  const [seccion, setSeccion] = useState("subir");
  const [galeria, setGaleria] = useState([]);
  const [pendientesCount, setPendientesCount] = useState(0);
  const [cargandoGaleria, setCargandoGaleria] = useState(false);
  const { token, usuario } = useAuth();

  const actualizarContadorPendientes = async () => {
    const count = await contarPendientes();
    setPendientesCount(count);
  };

  const cargarGaleria = async () => {
    if (!token) return;

    setCargandoGaleria(true);
    try {
      const response = await api.get("/fotos");
      // Mostrar las últimas 30 fotos
      const ultimasFotos = response.data.fotos?.slice(-30) || [];
      setGaleria(ultimasFotos);
    } catch (error) {
      console.error("Error al cargar galería:", error);
    } finally {
      setCargandoGaleria(false);
    }
  };

  // Cargar galería al montar el componente y cuando cambia la sección
  useEffect(() => {
    if (token && seccion === "galeria") {
      cargarGaleria();
    }
  }, [token, seccion]);

  // Actualizar contador de pendientes periódicamente
  useEffect(() => {
    if (token) {
      actualizarContadorPendientes();
      const interval = setInterval(actualizarContadorPendientes, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleSubidaExitosa = () => {
    cargarGaleria();
    actualizarContadorPendientes();
  };

  return (
    <>
      <Navbar
        seccion={seccion}
        setSeccion={setSeccion}
        pendientesCount={pendientesCount}
      />
      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }} className="fade-in-up">
        {seccion === "subir" && (
          <Subir
            onSubidaExitosa={handleSubidaExitosa}
            actualizarContador={actualizarContadorPendientes}
          />
        )}

        {seccion === "galeria" && <Galeria />}

        {seccion === "historial" && <Historial />}

        {seccion === "admin" && usuario?.rol === "admin" && <AdminUsuarios />}
      </Container>
    </>
  );
};

// Componente que maneja las rutas según autenticación
const AppRoutes = () => {
  const { token, cargando } = useAuth();

  if (cargando) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {" "}
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      <Route
        path="/"
        element={token ? <Dashboard /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

// Componente principal
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
