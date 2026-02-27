import { getDb } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function deleteAllEjercicios() {
    try {
        console.log('Conectando a la base de datos...');
        const db = await getDb();

        console.log('Borrando todos los ejercicios de la tabla ejercicios_n2...');
        const resultN2 = await db.run('DELETE FROM ejercicios_n2');
        console.log(`¡Éxito! Se han borrado ${resultN2.changes} ejercicios de ejercicios_n2.`);

        let resultOld: { changes: number | bigint } | null = null;
        try {
            console.log('Borrando datos de la tabla antigua "ejercicios" (si existe)...');
            resultOld = await db.run('DELETE FROM ejercicios');
            console.log(`¡Éxito! Se han borrado ${resultOld.changes} ejercicios de la tabla antigua.`);
        } catch (e) {
            console.log('Nota: La tabla "ejercicios" no existe o ya estaba limpia.');
        }

        const countN2 = Number(resultN2.changes) || 0;
        const countOld = resultOld ? (Number(resultOld.changes) || 0) : 0;
        const totalBorrados = countN2 + countOld;
        console.log(`Total de ejercicios eliminados: ${totalBorrados}`);

        // También reiniciamos el contador de autoincremento para empezar desde 1 si es SQLite local
        try {
            await db.run("DELETE FROM sqlite_sequence WHERE name='ejercicios_n2'");
            console.log('Contador de ID reiniciado.');
        } catch (e) {
            // sqlite_sequence puede no existir en algunas configuraciones de Turso/libsql
            console.log('Nota: No se pudo reiniciar el contador de ID (esto es normal en algunos entornos).');
        }

    } catch (error) {
        console.error('Error al borrar los ejercicios:', error);
        process.exit(1);
    }
}

deleteAllEjercicios();
