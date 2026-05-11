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
  const { token } = useAuth();

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
      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
        {seccion === "subir" && (
          <Subir
            onSubidaExitosa={handleSubidaExitosa}
            actualizarContador={actualizarContadorPendientes}
          />
        )}

        {seccion === "galeria" && (
          <div>
            <h2>📁 Galería de Medios</h2>
            {cargandoGaleria ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : galeria.length === 0 ? (
              <p>No hay fotos o videos subidos aún.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                {galeria.map((foto, i) => {
                  const esVideo = foto.match(/\.(mp4|webm|mov)$/i);
                  const ruta = `/api/uploads/${foto}`;
                  return (
                    <div
                      key={i}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      {esVideo ? (
                        <video
                          src={ruta}
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                          }}
                          controls
                        />
                      ) : (
                        <img
                          src={ruta}
                          alt={foto}
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                          }}
                          onClick={() => window.open(ruta, "_blank")}
                        />
                      )}
                      <div
                        style={{
                          fontSize: "10px",
                          padding: "4px",
                          textAlign: "center",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {foto.split("/").pop()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {seccion === "historial" && (
          <div>
            <h2>📋 Historial de Subidas</h2>
            <p>
              Próximamente: Historial detallado de todas las subidas con filtros
              por fecha, área y usuario.
            </p>
            <p>
              💡 Los datos ya se están registrando en la base de datos. Pronto
              tendremos el panel de historial completo.
            </p>
          </div>
        )}
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
