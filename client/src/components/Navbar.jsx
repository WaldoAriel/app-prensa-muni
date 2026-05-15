import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Badge,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CloudUpload,
  PhotoLibrary,
  History,
  Logout,
  Menu as MenuIcon,
  AdminPanelSettings,
} from "@mui/icons-material";

const Navbar = ({ seccion, setSeccion, pendientesCount }) => {
  const { usuario, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { id: "subir", label: "Subir", icon: <CloudUpload /> },
    { id: "galeria", label: "Galería", icon: <PhotoLibrary /> },
    { id: "historial", label: "Historial", icon: <History /> },
    {
      id: "admin",
      label: "Admin",
      icon: <AdminPanelSettings />,
      soloAdmin: true,
    },
  ];

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const handleClick = (seccionId) => {
    setSeccion(seccionId);
    setDrawerOpen(false);
  };

  // Filtrar items según rol
  const itemsVisibles = menuItems.filter(
    (item) => !item.soloAdmin || usuario?.rol === "admin",
  );

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: "linear-gradient(135deg, #1a5276 0%, #1e6f9f 100%)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {" "}
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <span>🐋</span>
            {!isMobile && "Prensa Muni"}
          </Typography>

          {isMobile ? (
            <>
              <Badge badgeContent={pendientesCount} color="error">
                <IconButton color="inherit" onClick={toggleDrawer(true)}>
                  <MenuIcon />
                </IconButton>
              </Badge>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              {itemsVisibles.map((item) => (
                <Button
                  key={item.id}
                  color="inherit"
                  onClick={() => handleClick(item.id)}
                  variant={seccion === item.id ? "outlined" : "text"}
                  startIcon={item.icon}
                >
                  {item.label}
                  {item.id === "subir" && pendientesCount > 0 && (
                    <Badge
                      badgeContent={pendientesCount}
                      color="error"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Button>
              ))}
              <Button color="inherit" onClick={logout} startIcon={<Logout />}>
                Salir
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Menú mobile (Drawer) */}
      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {itemsVisibles.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton onClick={() => handleClick(item.id)}>
                  <ListItemIcon>
                    {item.id === "subir" && pendientesCount > 0 ? (
                      <Badge badgeContent={pendientesCount} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton onClick={logout}>
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText primary="Salir" />
              </ListItemButton>
            </ListItem>
          </List>
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="textSecondary">
              {usuario?.nombre} ({usuario?.rol})
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
