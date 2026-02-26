import 'dotenv/config';
import { getDb } from './src/lib/db';

async function test() {
    try {
        console.log("Conectando a Turso...");
        const db = await getDb();
        console.log("Tablas creadas/verificadas");

        console.log("Insertando ejercicio de prueba...");
        const res = await db.run("INSERT INTO ejercicios (enunciado_incorrecto, opciones, conector_correcto, explicacion) VALUES (?, ?, ?, ?)", [
            "El carro es rojo __ es rápido.",
            JSON.stringify(["y", "o", "pero"]),
            "y",
            "Conjunción copulativa"
        ]);
        console.log("Insert result:", res);

        console.log("Consultando configuracion...");
        const config = await db.all("SELECT * FROM configuracion");
        console.log("Config:", config);

        console.log("Consultando ejercicios...");
        const rows = await db.all("SELECT * FROM ejercicios");
        console.log("Ejercicios:", rows);

        console.log("Test exitoso");
    } catch (e) {
        console.error("Test falló:", e);
    }
}

test();
