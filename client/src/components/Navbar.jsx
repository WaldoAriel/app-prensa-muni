import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Badge
} from '@mui/material';
import { CloudUpload, PhotoLibrary, History, Logout } from '@mui/icons-material';

const Navbar = ({ seccion, setSeccion, pendientesCount }) => {
  const { usuario, logout } = useAuth();

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>🐋</span> Prensa Muni
          <Typography variant="caption" sx={{ ml: 1 }}>
            {usuario?.nombre} ({usuario?.rol})
          </Typography>
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            color="inherit" 
            onClick={() => setSeccion('subir')}
            variant={seccion === 'subir' ? 'outlined' : 'text'}
            startIcon={<CloudUpload />}
          >
            Subir
            {pendientesCount > 0 && (
              <Badge 
                badgeContent={pendientesCount} 
                color="error" 
                sx={{ ml: 1 }} 
              />
            )}
          </Button>
          
          <Button 
            color="inherit" 
            onClick={() => setSeccion('galeria')}
            variant={seccion === 'galeria' ? 'outlined' : 'text'}
            startIcon={<PhotoLibrary />}
          >
            Galería
          </Button>
          
          <Button 
            color="inherit" 
            onClick={() => setSeccion('historial')}
            variant={seccion === 'historial' ? 'outlined' : 'text'}
            startIcon={<History />}
          >
            Historial
          </Button>
          
          <Button 
            color="inherit" 
            onClick={logout}
            startIcon={<Logout />}
          >
            Salir
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;