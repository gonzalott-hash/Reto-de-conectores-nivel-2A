import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function updateDb() {
    const dbPath = path.join(process.cwd(), 'sqlite.db');

    console.log("Conectando a SQLite en:", dbPath);
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
    });

    console.log("Borrando duplicados...");
    // Borrar duplicados dejando el ID mas reciente (max ID) para cada enunciado_incorrecto
    await db.run(`
        DELETE FROM ejercicios
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM ejercicios
            GROUP BY enunciado_incorrecto
        )
    `);
    console.log("¡Duplicados eliminados!");

    console.log("Creando tabla de configuracion...");
    await db.run(`
        CREATE TABLE IF NOT EXISTS configuracion (
            clave TEXT PRIMARY KEY,
            valor TEXT NOT NULL
        )
    `);

    // Insert initial 'num_ejercicios' record if not exists.
    const configExists = await db.get("SELECT * FROM configuracion WHERE clave = 'num_ejercicios'");
    if (!configExists) {
        await db.run("INSERT INTO configuracion (clave, valor) VALUES ('num_ejercicios', '10')");
        console.log("Configuracion inicial establecida en 10 ejercicios.");
    } else {
        console.log("La configuracion ya existia:", configExists.valor);
    }

    await db.close();
    console.log("¡Actualizacion terminada!");
}

updateDb().catch(console.error);
