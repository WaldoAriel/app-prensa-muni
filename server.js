import express from "express";
import multer from "multer";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Sequelize, DataTypes } from "sequelize";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// ========== CONEXIÓN A BASE DE DATOS ==========
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  },
);

// Modelo Usuario
const Usuario = sequelize.define(
  "Usuario",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    rol: { type: DataTypes.ENUM("campo", "admin"), defaultValue: "campo" },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "usuarios",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

// Modelo Subida
const Subida = sequelize.define(
  "Subida",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    area: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.STRING, allowNull: false },
    archivos: { type: DataTypes.JSON, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    ip: { type: DataTypes.STRING },
  },
  {
    tableName: "subidas",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

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

  return {
    rutaCompleta: path.join(carpetaBase, nombreArchivo),
    nombreArchivo,
    carpetaBase,
  };
}

// ========== MIDDLEWARE DE AUTENTICACIÓN ==========
const verificarToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido" });
  }
};

// ========== ENDPOINTS DE AUTENTICACIÓN ==========
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ where: { email, activo: true } });

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const valido = bcrypt.compareSync(password, usuario.password);
    if (!valido) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error en login: " + error.message });
  }
});

// ========== ENDPOINT PARA SUBIR FOTOS (con autenticación) ==========
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/subir", verificarToken, upload.array("fotos"), async (req, res) => {
  try {
    const { area, descripcion } = req.body;
    const archivos = req.files;
    const fechaActual = new Date();
    const usuarioId = req.usuario.id;
    const ip = req.ip || req.connection.remoteAddress;

    if (!archivos?.length)
      return res.status(400).json({ error: "No se recibieron archivos" });
    if (!area) return res.status(400).json({ error: "Área requerida" });
    if (!descripcion?.trim())
      return res.status(400).json({ error: "Descripción requerida" });

    console.log(
      `📸 ${req.usuario.nombre} sube ${archivos.length} archivos a ${area}: ${descripcion}`,
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

    // Guardar en base de datos
    await Subida.create({
      usuario_id: usuarioId,
      area,
      descripcion,
      archivos: JSON.stringify(resultados),
      cantidad: resultados.length,
      ip,
    });

    console.log(`✅ Guardados ${resultados.length} archivos. Registro en BD.`);
    res.json({
      mensaje: `✅ Subidos ${resultados.length} archivos`,
      archivos: resultados,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error interno: " + error.message });
  }
});

// ========== ENDPOINT PARA LISTAR FOTOS (con autenticación) ==========
app.get("/fotos", verificarToken, (req, res) => {
  const listarArchivos = (dir) => {
    let resultados = [];
    if (!fs.existsSync(dir)) return resultados;

    for (const item of fs.readdirSync(dir)) {
      const ruta = path.join(dir, item);
      if (fs.statSync(ruta).isDirectory()) {
        resultados = resultados.concat(listarArchivos(ruta));
      } else {
        resultados.push(ruta.replace(/\\/g, "/").replace("uploads/", ""));
      }
    }
    return resultados;
  };

  try {
    const archivos = listarArchivos("uploads");
    res.json({ fotos: archivos });
  } catch (error) {
    res.status(500).json({ error: "Error al leer archivos" });
  }
});

// ========== ENDPOINT PARA VER HISTORIAL DE SUBIDAS ==========
app.get("/historial", verificarToken, async (req, res) => {
  try {
    const subidas = await Subida.findAll({
      include: [{ model: Usuario, attributes: ["nombre", "email"] }],
      order: [["created_at", "DESC"]],
      limit: 100,
    });
    res.json({ subidas });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

// Definir la relación (después de definir los modelos)
Usuario.hasMany(Subida, { foreignKey: "usuario_id" });
Subida.belongsTo(Usuario, { foreignKey: "usuario_id" });

// ========== SINCRONIZAR BD Y ARRANCAR ==========
await sequelize.sync({ alter: true });
app.listen(PORT, () => {
  console.log(`
    🐋 Servidor de Prensa Municipal funcionando!
    📡 http://localhost:${PORT}
    📁 Estructura: uploads/AREA/AÑO/MES/DIA/
    🔐 Autenticación activada
    `);
});
