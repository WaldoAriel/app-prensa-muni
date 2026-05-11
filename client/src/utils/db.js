import { openDB } from 'idb';

const DB_NAME = 'PrensaOffline';
const DB_VERSION = 1;
const STORE_NAME = 'pendientes';

// Inicializar la base de datos
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('area', 'area');
      }
    },
  });
};

// Guardar una subida pendiente
export const guardarPendiente = async (area, descripcion, archivos) => {
  const db = await initDB();
  const timestamp = Date.now();
  
  const pendientesGuardados = [];
  
  for (const archivo of archivos) {
    const id = await db.add(STORE_NAME, {
      area,
      descripcion,
      archivo: archivo, // El objeto File
      nombreOriginal: archivo.name,
      tipo: archivo.type,
      tamaño: archivo.size,
      timestamp,
    });
    
    pendientesGuardados.push({
      id,
      nombre: archivo.name,
      area,
      descripcion
    });
  }
  
  return pendientesGuardados;
};

// Obtener todos los pendientes
export const obtenerPendientes = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

// Eliminar un pendiente específico
export const eliminarPendiente = async (id) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};

// Contar cuántos pendientes hay
export const contarPendientes = async () => {
  const db = await initDB();
  const pendientes = await db.getAll(STORE_NAME);
  return pendientes.length;
};

// Limpiar todos los pendientes
export const limpiarTodosPendientes = async () => {
  const db = await initDB();
  const pendientes = await db.getAll(STORE_NAME);
  for (const p of pendientes) {
    await db.delete(STORE_NAME, p.id);
  }
};