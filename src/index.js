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
const createErrorResponse = (message) => { //Crear mensaje de eror
    return {
        success: false,
        error: message
    };
}
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
        const connection = await getConnection();
        
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

server.post('/api/recetas/:recetaId', async (req, res) => {
    try {

        console.log(req.body);
        if (!req.body.nombre || !req.body.ingredientes || !req.body.instrucciones) {
            res.json(createErrorResponse('Todos los campos son obligatorios'));
            return;
        }      
        const conn = await getConnection();
        let instertRecipe =
        `INSERT INTO recetas ( nombre, ingredientes, instrucciones,)
        VALUES( ?,  ? , ? )`;

        const [insertResult] = await conn.execute(instertRecipe, [req.body.nombre, req.body.ingredientes, req.body.instrucciones]);

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
server.put('/api/recetas/:recetaId', async (req, res) => {
    try {
        const recetaId = parseInt(req.params.recetaId); // id de la receta

        const conn = await getConnection();
        const updateRecipe = `
            UPDATE recetas
            SET nombre = ?, ingredientes = ?, instrucciones = ?
            WHERE id = ?
        `;

        const { nombre, ingredientes, instrucciones } = req.body;

        const [resultUpRecipe] = await conn.execute(updateRecipe, [nombre, ingredientes, instrucciones, recetaId]);
        console.log(resultUpRecipe);
        conn.end();

        res.json({
            success: true,   
            message:`Receta con id ${recetaId} actualizada correctamente`
       
      
        });
    } catch (error) {
        console.error("Error al actualizar la receta:", error);
        res.json({
            success: false,
            message: `Error en la base de datos`
        });
    }
});

//Eliminar receta
server.delete('/api/recetas/:recetaId', async (req, res) => {
    try {
        const conn = await getConnection();
        const recetaId = parseInt(req.params.recetaId);

        const deleteRecipe = `
            DELETE FROM recetas 
            WHERE id = ?
        `;
        
        const [deleteResult] = await conn.execute(deleteRecipe, [recetaId]);
        console.log(deleteResult);
        conn.end();
        
       
        res.json({
            
            success: true,
            message: `Receta con id ${recetaId} eliminada correctamente`
        });
    }
    catch (error) {
        console.error("Error al eliminar la receta:", error);
        res.json({
            success: false,
            error: 'Error en la base de datos'
        });
    }
});
 
// Filtrar por ingredientes
server.get('/api/recetas/', async (req, res) =>  {

    const resultIngredientes = body.query.ingredientes;

    const conn = await getConnection();
    

    const  resultFilter = `
    SELECT * FROM recetas
    WHERE ingredientes
    LIKE '%ajo%'
    `;
const [results] = await conn.execute(query, [`%${ingredientes}%`]);
conn.end();

res.json ({
    success: true,
    results: results,
     count: results.length
})

})


