import * as mysql from 'mysql2/promise'
//Création de la connexion à la base de données MySQL
const connection =  await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})
// Tentative de connexion à la base de données
connection
    .connect()
    .then(() => console.log(`Connexion établie avec MySQL`))
    .catch(err => console.log(err));

export default connection;