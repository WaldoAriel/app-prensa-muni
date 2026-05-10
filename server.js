import express from "express";
import multer from "multer";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ========== FUNCIONES AUXILIARES ==========

function limpiarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function generarNombreYRuta(area, descripcion, correlativo, extension, fecha) {
  const areaLimpia = limpiarTexto(area);
  const descLimpia = limpiarTexto(descripcion);

  const fechaStr = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, "0")}${String(fecha.getDate()).padStart(2, "0")}`;

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  const carpetaBase = path.join("uploads", areaLimpia, String(anio), mes, dia);

  if (!fs.existsSync(carpetaBase)) {
    fs.mkdirSync(carpetaBase, { recursive: true });
  }

  const archivosExistentes = fs.readdirSync(carpetaBase);
  let num = correlativo;
  let nombreArchivo = `${fechaStr}_${areaLimpia}_${descLimpia}_${String(num).padStart(3, "0")}${extension}`;

  while (archivosExistentes.includes(nombreArchivo)) {
    num++;
    nombreArchivo = `${fechaStr}_${areaLimpia}_${descLimpia}_${String(num).padStart(3, "0")}${extension}`;
  }

  const rutaCompleta = path.join(carpetaBase, nombreArchivo);
  return { rutaCompleta, nombreArchivo, carpetaBase };
}

// ========== CONFIGURACIÓN MULTER ==========
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ========== ENDPOINTS ==========

app.post("/subir", upload.array("fotos"), async (req, res) => {
  try {
    const { area, descripcion } = req.body;
    const archivos = req.files;
    const fechaActual = new Date();

    if (!archivos || archivos.length === 0) {
      return res.status(400).json({ error: "No se recibieron archivos" });
    }
    if (!area) {
      return res.status(400).json({ error: "Área es requerida" });
    }
    if (!descripcion || !descripcion.trim()) {
      return res.status(400).json({ error: "Descripción es requerida" });
    }

    console.log(
      `📸 Recibiendo ${archivos.length} archivos de ${area}: ${descripcion}`,
    );

    const resultados = [];
    let correlativo = 1;

    for (const archivo of archivos) {
      const extension = path.extname(archivo.originalname);
      const { rutaCompleta, nombreArchivo } = generarNombreYRuta(
        area,
        descripcion,
        correlativo,
        extension,
        fechaActual,
      );

      fs.writeFileSync(rutaCompleta, archivo.buffer);
      resultados.push(nombreArchivo);
      correlativo++;
    }

    console.log(`✅ Guardados ${resultados.length} archivos`);

    res.json({
      mensaje: `✅ Subidos ${resultados.length} archivos correctamente`,
      archivos: resultados,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error interno: " + error.message });
  }
});

app.get("/fotos", (req, res) => {
  const listarArchivos = (dir) => {
    let resultados = [];
    if (!fs.existsSync(dir)) return resultados;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const ruta = path.join(dir, item);
      if (fs.statSync(ruta).isDirectory()) {
        resultados = resultados.concat(listarArchivos(ruta));
      } else {
        const rutaRelativa = ruta.replace(/\\/g, "/").replace("uploads/", "");
        resultados.push(rutaRelativa);
      }
    }
    return resultados;
  };

  try {
    const archivos = listarArchivos("uploads");
    res.json({ fotos: archivos });
  } catch (error) {
    console.error("Error al listar:", error);
    res.status(500).json({ error: "Error al leer archivos" });
  }
});

app.listen(PORT, () => {
  console.log(`
    🐋 Servidor de Prensa Municipal funcionando!
    📡 http://localhost:${PORT}
    📁 Estructura: uploads/AREA/AÑO/MES/DIA/
    📝 Formato: YYYYMMDD_area_descripcion_XXX.ext
    `);
});
