import 'dotenv/config';
import { getDb } from './src/lib/db';

async function test() {
    try {
        console.log("Conectando a Turso...");
        const db = await getDb();
        console.log("Tablas creadas/verificadas");

        console.log("Insertando ejercicio de prueba en ejercicios_n2...");
        const res = await db.run("INSERT INTO ejercicios_n2 (enunciado_incorrecto, opciones, conector_correcto, explicacion) VALUES (?, ?, ?, ?)", [
            "El carro es rojo __ es rápido.",
            JSON.stringify(["y", "o", "pero"]),
            "y",
            "Conjunción copulativa"
        ]);
        console.log("Insert result:", res);

        console.log("Consultando config_n2...");
        const config = await db.all("SELECT * FROM config_n2");
        console.log("Config:", config);

        console.log("Consultando ejercicios_n2...");
        const rows = await db.all("SELECT * FROM ejercicios_n2");
        console.log("Ejercicios:", rows);

        console.log("Test exitoso");
    } catch (e) {
        console.error("Test falló:", e);
    }
}

test();
