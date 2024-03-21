//Importar Bibliotecas
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mysql = require('mysql2/promise');

//Crear Variables
const server = express();
const port = process.env.PORT || 3000;

//Configurar expres
server.use(cors());
server.use(express.json({ limit: '25mb' }));

//Configurar MSQL
async function getConnection() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASS,
        database: 'recetas_db'
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
});

//EndPoint
//Listar recetas
server.get('/api/recetas', async (req, res) => {
    try {
        const conn = await getConnection();
        const queryGetRecetas =
            `SELECT * FROM recetas;
    `;
        const [results] = await conn.query(queryGetRecetas);
        conn.end();
        res.json({
            info: { count: results.length },
            result: results,
        });
    }
    catch (error) {
        console.error("Error al obtener el listado de recetas:", error);
        res.status(500).json({ error: "Error en la Base de datos" });
    }

});

//Obtener receta por id
server.get('/api/recetas/:id', async (req, res) => {
    const recetaId = req.params.id; // Obtener por query params el id de la receta

    try {
        const conn = await getConnection();
        let queryGetId = `
        SELECT * 
        FROM recetas
        WHERE id = ?;`;

        const [results] = await conn.query(queryGetId, [recetaId]);

        if (results.length === 0) {
            return res.status(404).json({ error: "Receta no encontrada" });
        }
        const receta = results[0];

        res.json({
            results: {

                name: receta.nombre,
                ingredientes: receta.ingredientes,
                instrucciones: receta.instrucciones

            }
        });
        conn.end();

    } catch (error) {
        console.error("Error al obtener la receta:", error);
        res.status(500).json({ error: "Error en la Base de datos" });
    }
});

//Crear nueva receta

const createErrorResponse = (message) => { //Crear mensaje de eror
    return {
        success: false,
        error: message
    };
}
server.post('/api/recetas/:recetaId', async (req, res) => {
    try {
        if (!req.body.nombre === '' || !req.body.ingredientes === '' || !req.body.instrucciones === '') {
            res.status(400).json(createErrorResponse('Todos los campos son obligatorios'));
            return;
        }
        const conn = await getConnection();
        const instertRecipe =
        `INSERT INTO recetas ( nombre, ingredientes, instruccione, completed)
        VALUES( ?,  ? , ? ,?)`;

        const [insertResult] = await conn.execute(instertRecipe, [req.body.nombre, req.body.ingredientes, req.body.instrucciones, false]);
        conn.end();
        
        res.json(
            {
                success: true,
                id: insertResult.insertId
            }
        );
    }
    catch (error) {
        console.error("Error al añadir nueva receta", error);
        res.json({
            success: false,
            error: 'Eror en la base de datos al crear una nueva receta'
        });
    }
    
});
//Actualizar datos de la receta
server.put ('/api/recetas/:recetaId' , async (req, res) => {

    try{
        const conn = await getConnection();
        const upDateRecipe = `UPDATE recetas
        SET id = ?
       WHERE id = ?;`

const [resultUpDate] = await conn.execute(upDateRecipe, [req.body.id, req.params.recetaId]);
conn.end();

res.json({
    success: true
});
} catch (error) {
console.error("Error al actualizar la receta:", error);
res.status(500).json({
    success: false,
    error: 'Error en la base de datos al actualizar la receta'
});
}
});




