import { getDb } from '../src/lib/db';

async function check() {
    try {
        const db = await getDb();
        const countN2 = await db.get('SELECT COUNT(*) as count FROM ejercicios_n2');
        console.log('--- CONTEXTO DE TABLAS ---');
        console.log('Registros en ejercicios_n2:', countN2.count);

        // Buscar otras posibles tablas de ejercicios (por si acaso hay versiones anteriores)
        const allTables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('\nTodas las tablas en la BD:');
        for (const t of allTables) {
            const c = await db.get(`SELECT COUNT(*) as count FROM ${t.name}`);
            console.log(`- ${t.name}: ${c.count} registros`);
        }
    } catch (e) {
        console.error('Error durante la verificación:', e);
    }
}

check();
