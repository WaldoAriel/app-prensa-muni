import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  Container,
  CssBaseline,
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
import Galeria from "./pages/Galeria";
import AdminUsuarios from "./pages/AdminUsuarios";
import MiPerfil from "./pages/MiPerfil";

const Dashboard = () => {
  const [seccion, setSeccion] = useState("subir");
  const [pendientesCount, setPendientesCount] = useState(0);
  const { token, usuario } = useAuth();

  const actualizarContadorPendientes = async () => {
    const count = await contarPendientes();
    setPendientesCount(count);
  };

  useEffect(() => {
    if (token) {
      actualizarContadorPendientes();
      const interval = setInterval(actualizarContadorPendientes, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleSubidaExitosa = () => {
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
        {seccion === "perfil" && <MiPerfil />}
      </Container>
    </>
  );
};

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
          bgcolor: "background.default",
        }}
      >
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

function App() {
  return (
    <>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
