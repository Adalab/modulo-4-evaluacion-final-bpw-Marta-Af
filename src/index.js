//Importar Bibliotecas
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');   

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
        database: 'recetas_db',
    });
    await connection.connect();

    console.log(
        `Conexión establecida con la base de datos (identificador=${connection.threadId})`
    );

    return connection;
}

//Consultar si el id existe
async function checkededId( conn, recetaId) {
    try {

        const checkId = `
            SELECT * FROM recetas
            WHERE id = ?
        `;
 
        const [result] = await conn.execute(checkId, [recetaId]);
        if (result.length === 0) {
            return {
                success: false,
                message: 'El ID seleccionado no existe'
            };
        } else {
            return {
                success: true
            };
        }
    } catch (error) {
      
        return {
            success: false,
            message: 'Error en la base de datos'
        };
    }
}

//Arrancar servidor
server.listen(port, () => {
    console.log(`Server has been started in http://localhost:${port}`)
});
//EndPoint
//Listar recetas ok
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

server.get('/api/usuarios_db', async (req, res) => {
    try {
        const conn = await getConnection();
        const queryGetUser =
            `SELECT * FROM usuarios_db;
    `;
        const [results] = await conn.query(queryGetUser);

        conn.end();
        res.json({
            info: { count: results.length },
            result: results,
        });
    }
    catch (error) {
        console.error("Error al obtener el listado de usuarios:", error);
        res.status(500).json({ error: "Error en la Base de datos" });
    }
});

//Obtener receta por id ok
server.get('/api/recetas/:id', async (req, res) => {
    try {
        const recetaId = req.params.id; // Obtener por query params el id de la receta
        if (!recetaId || recetaId === '') {
            return res.status(400).json({ success: false, error: 'Debe añadir un id' });
        }
        if (isNaN(recetaId)) {
            return res.status(400).json({ success: false, error: 'El id debe ser un numero' });
        }
        if (!/^\d+$/.test(recetaId)) {
            return res.status(400).json({ success: false, error: 'El ID debe contener solo números' });
        }
        const conn = await getConnection();
        const json = await checkededId(conn, recetaId); //Funcion que conecta con la bd y revisa si esta el id
        console.log(json);
        if (json.success === false) {
            conn.end();
            res.json(json);
            return;
        }
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
server.post('/api/recetas', async (req, res) => {
    try {
        const { nombre, ingredientes, instrucciones } = req.body; 
   
        if (!nombre || nombre === '' || 
        !ingredientes|| ingredientes === ''  || 
        !instrucciones || instrucciones === '' ) {
            return res.status(400).json({ success: false, error: 'Todos los campos son obligatorios' });
        }      
        const conn = await getConnection();
        const insertRecipe = `
        INSERT INTO recetas (nombre,ingredientes,instrucciones) 
        VALUES ( ?, ?, ?)`;
        const [insertResult] = await conn.execute(insertRecipe, [nombre, ingredientes, instrucciones]);
        console.log(insertResult);
        conn.end();  
        res.json({
            success: true,
            id: insertResult.insertId
        });
    } catch (error) {
        console.error("Error al añadir nueva receta", error);
        res.json({
            success: false,
            error: 'Error en la base de datos al crear una nueva receta'
        });
    }
});


//Actualizar datos de la receta ok
server.put('/api/recetas/:recetaId', async (req, res) => {
try {
        const recetaId = parseInt(req.params.recetaId); // id de la receta
        const conn = await getConnection();
        const json = await checkededId( conn , recetaId ); //Funcion que conecta con la bd y revisa si esta el id
       
        if( json.success === false ) {
            conn.end();
            res.json(json);
            return;
        }
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

//Eliminar receta ok
server.delete('/api/recetas/:recetaId', async (req, res) => {
    try {
        const conn = await getConnection();
        let recetaId = parseInt(req.params.recetaId);
        const deleteRecipe = `
            DELETE FROM recetas 
            WHERE id = ?
        `;
        const [deleteResult] = await conn.execute(deleteRecipe, [recetaId]);
        console.log(deleteResult);
        conn.end();
        if (deleteResult.affectedRows > 0) {
                res.json({
                    success: true,
                    message: `Receta con id ${recetaId} eliminada correctamente`
                });
                } else {
                res.json({
                    success: false,
                    message: 'No se ha encontrado la receta'
                });
            }
        }catch (error) {
        console.error("Error al eliminar la receta:", error);
        res.json({
            success: false,
            error: 'Error en la base de datos'
        });
    }
});
 
//Registro de usuario (POST /registro):
server.post('/api/usuarios_db/registred', async (req, res) => {

try {
    if (!req.body.userName || !req.body.email || !req.body.password) {
        res.json({
            success: false,
            error: 'Debe rellenar todos los campos'
        });
        return;
    }
    // Comprobar si hay un usuario con el mismo nombre
    const conn = await getConnection();
    const checkUser = 'SELECT * FROM usuarios_db WHERE userName = ?';
    const [result] = await conn.query(checkUser, [req.body.userName]);

    if (result.length > 0) {
        res.json({
            success: false,
            error: 'El nombre de usuario ya existe'
        });
        conn.end();
        return;
    }
    const crypedPass = await bcrypt.hash( req.body.password, 10 );
    const insertUser = 'INSERT INTO usuarios_db (email, userName, password) VALUES (?, ?, ?)';
    const { email, userName, password } = req.body;
    const [insertResults] = await conn.execute(insertUser, [email, userName, crypedPass]);
    conn.end();

    if (insertResults.affectedRows === 1) {
        res.json({
            success: true,
            message: `El usuario ${userName} se ha creado correctamente`
        });
    } else {
        res.json({
            success: false,
            error: `Error al crear el usuario`
        });
    }
} catch (error) {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        error: `Error en la base de datos`
    });
}
});

//Inicio de sesión (POST /login)
server.post('/api/usuarios_db/loging', async (req, res ) => {
try{
 console.log(req.body);
 // comprobamos que los datos esten rellenos
 if (!req.body.email || !req.body.userName ) {
    res.json({
        success: false,
        error: 'El email del usuario y el  nombre no puedes estar vacíos'
    });
    return;
}
    //Comprobar si el usuario y contraseña existe
 const conn = await getConnection();
 const checkUser = ` 
    SELECT id, userName, password 
    FROM usuarios_db 
    WHERE userName = ?`;
    const [result] = await conn.query(checkUser, [req.body.userName]);
 conn.end();

 if (result.length !== 1) {
    return res.json({
        success: false,
        error: 'Las credenciales no son correctas'
    });
}


const userData = result[0];
console.log(userData);

const correctPassword = await bcrypt.compare(req.body.password, userData.password);
console.log("Nombre de usuario:", req.body.userName);
console.log("Contraseña:", req.body.password);
console.log("Comparación de contraseñas:", correctPassword);
 if (correctPassword) {
    return res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        userId: userData.id
    });
} else {
    return res.json({
        success: false,
        error: 'Las credenciales no son correctas'
    });
}
} catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
        success: false,
        error: `Error en la base de datos`
    });
}
});