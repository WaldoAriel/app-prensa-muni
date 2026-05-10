import bcrypt from 'bcryptjs';

const password = '123456';  // Cambiala por la contraseña que quieras
const hash = bcrypt.hashSync(password, 10);
console.log('Hash:', hash);