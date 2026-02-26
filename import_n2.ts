import fs from 'node:fs';
import path from 'node:path';
import { getDb } from './src/lib/db';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function importEjercicios() {
    const filePath = path.join(process.cwd(), '21 ejercicios conectores n2.txt');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Normalize newlines
    const lines = content.replace(/\r\n/g, '\n').split('\n').map(l => l.trim());

    let currentEnunciado = "";
    let currentOptions: string[] = [];
    let currentAnswer = "";

    const db = await getDb();

    // Wipe all existing exercises first
    console.log("Eliminando ejercicios anteriores...");
    await db.run("DELETE FROM ejercicios");
    await db.run("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'ejercicios'");

    let count = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.match(/_{2,}/)) {
            // Save previous if exists
            if (currentEnunciado && currentOptions.length > 0 && currentAnswer) {
                await saveEjercicio(db, currentEnunciado, currentOptions, currentAnswer);
                count++;
                currentEnunciado = "";
                currentOptions = [];
                currentAnswer = "";
            }
            currentEnunciado = line;
        } else if (line.length > 0) {
            let optionText = line;
            if (line.endsWith('*')) {
                optionText = line.slice(0, -1).trim();
                currentAnswer = optionText;
            }
            currentOptions.push(optionText);
        }
    }

    // Save last one
    if (currentEnunciado && currentOptions.length > 0 && currentAnswer) {
        await saveEjercicio(db, currentEnunciado, currentOptions, currentAnswer);
        count++;
    }

    console.log(`Importados ${count} ejercicios exitosamente.`);
}

async function saveEjercicio(db: any, enunciado: string, opciones: string[], correcto: string) {
    try {
        await db.run(
            "INSERT INTO ejercicios (enunciado_incorrecto, opciones, conector_correcto, explicacion) VALUES (?, ?, ?, ?)",
            [enunciado, JSON.stringify(opciones), correcto, ""]
        );
    } catch (e) {
        console.error("Error guardando ejercicio:", enunciado, e);
    }
}

importEjercicios().catch(console.error);
