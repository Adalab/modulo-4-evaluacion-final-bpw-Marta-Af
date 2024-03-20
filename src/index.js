//Importar Bibliotecas
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mysql = require('mysql2/promise');

//Crear Variables
const server = express();
const port = 3000;

//Configurar expres
server.use(cors());
server.use(express.json({ limit: '25mb' }));

//Configurar MSQL
async function getConnection()  {

   
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST  || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASS,
        database: process.env.MYSQL_SCHEMA || 'recetas_db'
    });
    await connection.connect();

    console.log(
      `Conexión establecida con la base de datos (identificador=${connection.threadId})`
    );
  
    return connection;
}


//Arrancar servidor
server.listen(port, () => {
    console.log(`Server has been started in http://localhost:${port}`)
})

//EndPoint
getConnection();
