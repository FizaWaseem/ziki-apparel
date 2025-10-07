import bcrypt from 'bcryptjs';

// Change this to your desired password
const plainPassword = 'admin123';

// Generate hash
const hash = bcrypt.hashSync(plainPassword, 12);

console.log('Password:', plainPassword);
console.log('Bcrypt Hash:', hash);
console.log('\nCopy the hash above and paste it into the password field in Prisma Studio');