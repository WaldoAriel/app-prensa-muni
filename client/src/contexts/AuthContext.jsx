import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [cargando, setCargando] = useState(true);

  // Configurar axios para incluir el token automáticamente en todas las peticiones
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Recuperar usuario del localStorage
      const usuarioGuardado = localStorage.getItem("usuario");
      if (usuarioGuardado) {
        setUsuario(JSON.parse(usuarioGuardado));
      }
    }
    setCargando(false);
  }, [token]);

  // Función de login
  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/login", { email, password });
      const { token, usuario } = response.data;

      console.log("Token recibido:", token); // 👈 Agregá este log

      // Guardar en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      // Configurar axios para futuras peticiones
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Actualizar estado
      setToken(token);
      setUsuario(usuario);

      return { success: true };
    } catch (error) {
      console.error("Error en login:", error);
      return {
        success: false,
        error:
          error.response?.data?.error || "Error de conexión con el servidor",
      };
    }
  };

  // Función de logout
  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    // Limpiar axios
    delete axios.defaults.headers.common["Authorization"];

    // Limpiar estado
    setToken(null);
    setUsuario(null);
  };

  // Valores que vamos a exponer
  const value = {
    usuario,
    token,
    cargando,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
