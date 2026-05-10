const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());           // Permite conexiones desde el celular
app.use(morgan('dev'));    // Muestra logs en consola
app.use(express.static('public'));  // Para servir el HTML

// Configuración de multer (dónde y cómo guardar los archivos)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');   // Carpeta donde se guardan
    },
    filename: (req, file, cb) => {
        // Nombre temporal: timestamp + nombre original
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// Asegurar que existe la carpeta uploads
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// ENDPOINT para subir archivos
app.post('/subir', upload.array('fotos'), (req, res) => {
    console.log(`📸 Recibidas ${req.files.length} fotos`);
    res.json({
        mensaje: `✅ Subidas ${req.files.length} fotos correctamente`,
        archivos: req.files.map(f => f.filename)
    });
});

// ENDPOINT para listar las fotos subidas
app.get('/fotos', (req, res) => {
    fs.readdir('uploads', (err, archivos) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer archivos' });
        }
        res.json({ fotos: archivos });
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`
    🐋 Servidor de Prensa Municipal funcionando!
    📡 Accede desde tu PC: http://localhost:${PORT}
    📱 Accede desde tu celular: http://[TU_IP]:${PORT}
    `);
});