# Guia de Instalacion — Prensa Municipal

## Requisitos previos en la PC de la oficina

| Programa | Version minima | Descarga |
|----------|---------------|----------|
| **Node.js** | v18+ | https://nodejs.org (version LTS) |
| **MySQL** | 5.7+ / 8.0+ | https://dev.mysql.com/downloads/mysql/ |
| **Git** (opcional) | cualquiera | https://git-scm.com |

---

## Paso 1 — Clonar o copiar el proyecto

**Opcion A (con Git):**
```bash
cd C:\Users\TU_USUARIO\Documents
git clone https://TU_REPOSITORIO.git app-prensa-muni
```

**Opcion B (sin Git — copiar carpeta):**
Copiar la carpeta `app-prensa-muni` a `C:\Users\TU_USUARIO\Documents\`

---

## Paso 2 — Crear la base de datos

Abrir MySQL Workbench (o la consola de MySQL) y ejecutar:

```sql
CREATE DATABASE IF NOT EXISTS prensa_muni
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

---

## Paso 3 — Configurar el archivo `.env`

Crear el archivo `.env` en la raiz del proyecto (`app-prensa-muni/.env`) con estos valores:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_PASSWORD_DE_MYSQL
DB_NAME=prensa_muni
JWT_SECRET=una_clave_secreta_larga_y_dificil
PORT=3000
UPLOADS_DIR=C:/Fotos/Prensa
```

> **`UPLOADS_DIR`**: Elegi la ruta donde se van a guardar las fotos/videos. Puede ser cualquier carpeta, por ejemplo `C:/Fotos/Prensa` o `D:/Archivos/subidas`. **Usar `/` (barra normal), no `\`.**

---

## Paso 4 — Instalar dependencias

```bash
cd app-prensa-muni
npm install

cd client
npm install
cd ..
```

---

## Paso 5 — Crear el usuario administrador

Necesitas generar el hash de la contrasena. Abrir la consola y ejecutar:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('123456', 10));"
```

Copiar el hash que imprime. Despues, en MySQL, ejecutar:

```sql
INSERT INTO Usuarios (nombre, email, password, rol, activo, created_at, updated_at)
VALUES (
  'Administrador',
  'admin@prensa.local',
  'PEGAR_AQUI_EL_HASH',
  'admin',
  true,
  NOW(),
  NOW()
);
```

> Cambiar `123456` por la contrasena que quieras para el admin. El email puede ser cualquier cosa, se usa para login.

---

## Paso 6 — Iniciar el servidor

En la consola, desde la raiz del proyecto:

```bash
node server.js
```

Deberia mostrar:
```
Servidor de Prensa Municipal funcionando!
http://localhost:3000
Estructura: C:/Fotos/Prensa/AREA/ANO/MES/DIA/
Autenticacion activada
```

**Dejar esta consola abierta.**

---

## Paso 7 — Iniciar el frontend (en otra consola)

Abrir una **segunda consola** y ejecutar:

```bash
cd app-prensa-muni\client
npm run dev
```

Mostrara:
```
Local:   http://localhost:5173/
Network: http://192.168.X.X:5173/
```

> Anotar la direccion **Network** (ej: `http://192.168.1.50:5173`). Esa es la que usan los celulares.

---

## Paso 8 — Acceder desde los celulares

1. Los celulares deben estar conectados al **WiFi de la oficina**
2. Abrir el navegador del celular
3. Escribir la direccion: **`http://192.168.X.X:5173`** (la que aparecio en el Paso 7)
4. Se carga la pantalla de login
5. Iniciar sesion con el email y contrasena del admin

> **Nota**: La PWA (instalar como app) solo funciona con HTTPS o localhost. Por ahora, los celulares van a usar la app como pagina web normal. Cuando configuremos Cloudflare Tunnel, la PWA va a funcionar.

---

## Paso 9 — Crear usuarios para los fotografos

Desde el navegador de la PC, iniciar sesion como admin e ir a **Admin > Nuevo Usuario**. Crear una cuenta para cada fotografо con rol "Campo".

---

## Resumen de puertos

| Servicio | Puerto | Quien lo usa |
|----------|--------|-------------|
| Backend (Express) | 3000 | Solo la PC (interno) |
| Frontend (Vite) | 5173 | PC + celulares por WiFi |

---

## Si se cierra la PC o se apaga

Hay que volver a arrancar ambos servidores:
1. `node server.js` (consola 1)
2. `npm run dev` en `client/` (consola 2)

## Para futuro: Cloudflare Tunnel

Cuando se quiera acceder desde afuera de la oficina (sin estar en el WiFi), ahi si configuramos Cloudflare Tunnel con un dominio propio, y la PWA va a poder instalarse en los celulares.
