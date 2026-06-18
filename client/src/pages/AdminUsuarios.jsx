import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Block,
  CheckCircle,
  Refresh,
  AdminPanelSettings,
  PersonAdd,
} from "@mui/icons-material";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogEditar, setDialogEditar] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const { usuario: usuarioLogueado } = useAuth();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "campo",
  });

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const response = await api.get("/admin/usuarios");
      setUsuarios(response.data.usuarios);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || "Error al cargar usuarios");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCrear = async () => {
    try {
      await api.post("/admin/usuarios", form);
      setDialogAbierto(false);
      setForm({ nombre: "", email: "", password: "", rol: "campo" });
      cargarUsuarios();
    } catch (error) {
      alert(error.response?.data?.error || "Error al crear usuario");
    }
  };

  const handleActualizar = async () => {
    try {
      const data = {};
      if (usuarioActual.nombre !== form.nombre) data.nombre = form.nombre;
      if (usuarioActual.email !== form.email) data.email = form.email;
      if (usuarioActual.rol !== form.rol) data.rol = form.rol;
      if (form.password) data.password = form.password;

      await api.put(`/admin/usuarios/${usuarioActual.id}`, data);
      setDialogEditar(false);
      setForm({ nombre: "", email: "", password: "", rol: "campo" });
      setUsuarioActual(null);
      cargarUsuarios();
    } catch (error) {
      alert(error.response?.data?.error || "Error al actualizar usuario");
    }
  };

  const handleToggleActivo = async (usuario) => {
    try {
      await api.put(`/admin/usuarios/${usuario.id}`, {
        activo: !usuario.activo,
      });
      cargarUsuarios();
    } catch (error) {
      alert(error.response?.data?.error || "Error al cambiar estado");
    }
  };

  const handleEliminar = async (usuario) => {
    if (
      window.confirm(
        `¿Eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`,
      )
    ) {
      try {
        await api.delete(`/admin/usuarios/${usuario.id}`);
        cargarUsuarios();
      } catch (error) {
        alert(error.response?.data?.error || "Error al eliminar usuario");
      }
    }
  };

  const abrirEditar = (usuario) => {
    setUsuarioActual(usuario);
    setForm({
      nombre: usuario.nombre,
      email: usuario.email,
      password: "",
      rol: usuario.rol,
    });
    setDialogEditar(true);
  };

  if (cargando) {
    return (
      <Box display="flex" justifyContent="center" my={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Administración de Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {usuarios.length} usuario(s) registrado(s)
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Actualizar">
            <IconButton onClick={cargarUsuarios}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setDialogAbierto(true)}
          >
            Nuevo Usuario
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Registro</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((user) => (
                <TableRow
                  key={user.id}
                  sx={{ opacity: user.activo ? 1 : 0.5 }}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.nombre}
                      </Typography>
                      {user.id === usuarioLogueado?.id && (
                        <Chip label="Tú" size="small" color="primary" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.rol === "admin" ? "Admin" : "Campo"}
                      color={user.rol === "admin" ? "primary" : "default"}
                      size="small"
                      icon={user.rol === "admin" ? <AdminPanelSettings /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={user.activo ? <CheckCircle /> : <Block />}
                      label={user.activo ? "Activo" : "Inactivo"}
                      color={user.activo ? "success" : "error"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(user.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Activar/Desactivar">
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActivo(user)}
                      >
                        {user.activo ? (
                          <Block fontSize="small" />
                        ) : (
                          <CheckCircle fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => abrirEditar(user)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {user.id !== usuarioLogueado?.id && (
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleEliminar(user)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog CREAR */}
      <Dialog
        open={dialogAbierto}
        onClose={() => setDialogAbierto(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonAdd color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Nuevo Usuario
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre completo"
            margin="normal"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            margin="normal"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rol</InputLabel>
            <Select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              label="Rol"
            >
              <MenuItem value="campo">Fotógrafo (campo)</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogAbierto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrear}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog EDITAR */}
      <Dialog
        open={dialogEditar}
        onClose={() => setDialogEditar(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Edit color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Editar Usuario
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre completo"
            margin="normal"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Nueva contraseña (dejar vacío para no cambiar)"
            type="password"
            margin="normal"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rol</InputLabel>
            <Select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              label="Rol"
            >
              <MenuItem value="campo">Fotógrafo (campo)</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogEditar(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleActualizar}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsuarios;
