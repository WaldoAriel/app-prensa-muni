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
  Divider,
  useMediaQuery,
  useTheme,
  Avatar,
} from "@mui/material";
import {
  CameraAlt,
  CloudUpload,
  PhotoLibrary,
  History,
  Logout,
  Menu as MenuIcon,
  AdminPanelSettings,
  Person,
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

  const itemsVisibles = menuItems.filter(
    (item) => !item.soloAdmin || usuario?.rol === "admin",
  );

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          bgcolor: "primary.dark",
          backgroundImage: "none",
        }}
      >
        <Toolbar sx={{ px: { xs: 1.5, md: 3 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={toggleDrawer(true)}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={pendientesCount} color="error" variant="dot">
                <MenuIcon />
              </Badge>
            </IconButton>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1 }}>
            <Avatar
              sx={{
                bgcolor: "secondary.main",
                width: 36,
                height: 36,
              }}
            >
              <CameraAlt sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ lineHeight: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  fontSize: { xs: "0.95rem", md: "1.05rem" },
                }}
              >
                Prensa Municipal
              </Typography>
              {!isMobile && (
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, fontSize: "0.7rem" }}
                >
                  Sistema de Gestión de Medios
                </Typography>
              )}
            </Box>
          </Box>

          {!isMobile && (
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              {itemsVisibles.map((item) => (
                <Button
                  key={item.id}
                  color="inherit"
                  onClick={() => handleClick(item.id)}
                  startIcon={item.icon}
                  sx={{
                    position: "relative",
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    bgcolor:
                      seccion === item.id
                        ? "rgba(255,255,255,0.12)"
                        : "transparent",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                  }}
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

              <Divider
                orientation="vertical"
                flexItem
                sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: 1 }}
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Person sx={{ fontSize: 18, opacity: 0.7 }} />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {usuario?.nombre}
                </Typography>
                <Button
                  color="inherit"
                  onClick={logout}
                  startIcon={<Logout />}
                  sx={{ ml: 0.5 }}
                >
                  Salir
                </Button>
              </Box>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 280, pt: 1 }} role="presentation">
          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: "primary.dark",
              color: "white",
              mb: 1,
            }}
          >
            <Avatar
              sx={{
                bgcolor: "secondary.main",
                width: 40,
                height: 40,
              }}
            >
              <CameraAlt sx={{ fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Prensa Municipal
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {usuario?.nombre} ({usuario?.rol})
              </Typography>
            </Box>
          </Box>

          <List sx={{ px: 1 }}>
            {itemsVisibles.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleClick(item.id)}
                  selected={seccion === item.id}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "white",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                      "& .MuiListItemIcon-root": {
                        color: "white",
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color:
                        seccion === item.id
                          ? "white"
                          : "text.secondary",
                    }}
                  >
                    {item.id === "subir" && pendientesCount > 0 ? (
                      <Badge badgeContent={pendientesCount} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: seccion === item.id ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ mx: 2, my: 1 }} />

          <List sx={{ px: 1 }}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={logout}
                sx={{ borderRadius: 2, color: "error.main" }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
                  <Logout />
                </ListItemIcon>
                <ListItemText primary="Cerrar sesión" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
