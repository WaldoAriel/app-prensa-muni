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
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || "./uploads");

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
    contexto_redes: { type: DataTypes.TEXT, allowNull: false },
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
app.use("/uploads", express.static(UPLOADS_DIR));

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

  // 👈 ORDEN CORRECTO: AREA/AÑO/MES/DIA
  const carpetaBase = path.join(
    UPLOADS_DIR,
    areaLimpia,
    String(anio),
    mes,
    dia,
  );

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

  // 👈 Guardar la ruta RELATIVA para la base de datos (sin "uploads/")
  const rutaRelativa = path
    .join(areaLimpia, String(anio), mes, dia, nombreArchivo)
    .replace(/\\/g, "/");

  return { rutaCompleta, nombreArchivo, carpetaBase, rutaRelativa };
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
    const { area, descripcion, contexto_redes } = req.body;
    const archivos = req.files;
    const fechaActual = new Date();
    const usuarioId = req.usuario.id;
    const ip = req.ip || req.connection.remoteAddress;

    if (!archivos?.length)
      return res.status(400).json({ error: "No se recibieron archivos" });
    if (!area) return res.status(400).json({ error: "Área requerida" });
    if (!descripcion?.trim())
      return res.status(400).json({ error: "Descripción requerida" });
    if (!contexto_redes?.trim())
      return res.status(400).json({ error: "Contexto para redes requerido" });

    console.log(
      `📸 ${req.usuario.nombre} sube ${archivos.length} archivos a ${area}: ${descripcion}`,
    );

    const resultados = [];
    let correlativo = 1;

    for (const archivo of archivos) {
      const extension = path.extname(archivo.originalname);
      const { rutaCompleta, nombreArchivo, rutaRelativa } = generarNombreYRuta(
        area,
        descripcion,
        correlativo,
        extension,
        fechaActual,
      );
      fs.writeFileSync(rutaCompleta, archivo.buffer);
      resultados.push(rutaRelativa);
      correlativo++;
    }

    // Guardar en base de datos
    await Subida.create({
      usuario_id: usuarioId,
      area,
      descripcion,
      contexto_redes,
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
        resultados.push(
          ruta
            .replace(/\\/g, "/")
            .replace(
              UPLOADS_DIR.replace(/\\/g, "/").replace(/\/$/, "") + "/",
              "",
            ),
        );
      }
    }
    return resultados;
  };

  try {
    const archivos = listarArchivos(UPLOADS_DIR);
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

// ========== ADMIN: Obtener todos los usuarios ==========
app.get("/admin/usuarios", verificarToken, async (req, res) => {
  try {
    // Solo admins pueden ver la lista
    if (req.usuario.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "Acceso denegado. Se requiere rol admin." });
    }

    const usuarios = await Usuario.findAll({
      attributes: ["id", "nombre", "email", "rol", "activo", "created_at"],
      order: [["created_at", "DESC"]],
    });
    res.json({ usuarios });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// ========== ADMIN: Crear usuario ==========
app.post("/admin/usuarios", verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Verificar si ya existe
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res
        .status(400)
        .json({ error: "Ya existe un usuario con ese email" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password: hashedPassword,
      rol: rol || "campo",
      activo: true,
    });

    res.json({
      mensaje: "Usuario creado exitosamente",
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        activo: nuevoUsuario.activo,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// ========== ADMIN: Actualizar usuario ==========
app.put("/admin/usuarios/:id", verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const { id } = req.params;
    const { nombre, email, rol, activo, password } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email;
    if (rol) usuario.rol = rol;
    if (activo !== undefined) usuario.activo = activo;
    if (password) usuario.password = bcrypt.hashSync(password, 10);

    await usuario.save();

    res.json({
      mensaje: "Usuario actualizado",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// ========== ADMIN: Eliminar usuario ==========
app.delete("/admin/usuarios/:id", verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const { id } = req.params;

    // No permitir eliminarse a sí mismo
    if (parseInt(id) === req.usuario.id) {
      return res.status(400).json({ error: "No puedes eliminarte a vos" });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await usuario.destroy();
    res.json({ mensaje: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});
// ========== USUARIO: Cambiar mi contraseña ==========
app.put("/usuarios/mi-password", verificarToken, async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;

    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ error: "Ambas contraseñas son requeridas" });
    }

    if (passwordNueva.length < 4) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 4 caracteres" });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const valido = bcrypt.compareSync(passwordActual, usuario.password);
    if (!valido) {
      return res.status(401).json({ error: "La contraseña actual es incorrecta" });
    }

    usuario.password = bcrypt.hashSync(passwordNueva, 10);
    await usuario.save();

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
});

app.listen(PORT, () => {
  console.log(`
    🤳 Servidor de Prensa Municipal funcionando!
    📡 http://localhost:${PORT}
    📁 Estructura: ${UPLOADS_DIR}/AREA/AÑO/MES/DIA/
    🔐 Autenticación activada
    `);
});
