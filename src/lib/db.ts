import { createClient, Client } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const safeUrl = url || "file:./sqlite.db";

let clientInstance: Client | null = null;

class DbWrapper {
    client: Client;
    constructor(client: Client) {
        this.client = client;
    }

    async all(sql: string, args: any[] = []) {
        try {
            const res = await this.client.execute({ sql, args });
            return res.rows;
        } catch (e: any) {
            console.error(`Error SQL en all: ${sql}`, e);
            throw new Error(`SQL_ERROR en all: ${e.message} (SQL: ${sql.substring(0, 50)}...)`);
        }
    }

    async get(sql: string, args: any[] = []) {
        try {
            const res = await this.client.execute({ sql, args });
            return res.rows[0];
        } catch (e: any) {
            console.error(`Error SQL en get: ${sql}`, e);
            throw new Error(`SQL_ERROR en get: ${e.message} (SQL: ${sql.substring(0, 50)}...)`);
        }
    }

    async run(sql: string, args: any[] = []) {
        try {
            const res = await this.client.execute({ sql, args });
            return { lastID: res.lastInsertRowid?.toString() || 0, changes: res.rowsAffected };
        } catch (e: any) {
            console.error(`Error SQL en run: ${sql}`, e);
            throw new Error(`SQL_ERROR en run: ${e.message} (SQL: ${sql.substring(0, 50)}...)`);
        }
    }

    async prepare(sql: string) {
        return {
            run: async (...args: any[]) => {
                return await this.run(sql, args);
            },
            finalize: async () => { }
        }
    }
}

let wrapperInstance: DbWrapper | null = null;

export async function getDb(): Promise<DbWrapper> {
    if (wrapperInstance) {
        return wrapperInstance;
    }

    // Limpieza ULTRA agresiva de URL y Token (solo caracteres ASCII válidos para URLs y JWTs)
    let currentUrl = process.env.TURSO_DATABASE_URL?.replace(/[^a-zA-Z0-9:/._-]/g, '').trim();
    const currentToken = process.env.TURSO_AUTH_TOKEN?.replace(/[^a-zA-Z0-9._-]/g, '').trim();

    // Convertir libsql:// a https:// si es necesario (más compatible con ambientes serverless)
    if (currentUrl?.startsWith('libsql://')) {
        currentUrl = currentUrl.replace('libsql://', 'https://');
    }

    if (process.env.NODE_ENV === 'production') {
        if (!currentUrl || !currentToken) {
            throw new Error("Variables de base de datos faltantes (TURSO_DATABASE_URL o TURSO_AUTH_TOKEN).");
        }
    }

    console.log("Conectando a:", currentUrl?.substring(0, 20) + "...");

    clientInstance = createClient({
        url: currentUrl || "file:./sqlite.db",
        authToken: currentToken,
    });

    wrapperInstance = new DbWrapper(clientInstance);

    // Initial table creations if they dont exist
    await wrapperInstance.run(`
        CREATE TABLE IF NOT EXISTS ejercicios_n2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            enunciado_incorrecto TEXT NOT NULL,
            opciones TEXT NOT NULL,
            conector_correcto TEXT NOT NULL,
            explicacion TEXT NOT NULL DEFAULT '',
            es_activo BOOLEAN NOT NULL DEFAULT 1,
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await wrapperInstance.run(`
        CREATE TABLE IF NOT EXISTS configuracion (
            clave TEXT PRIMARY KEY,
            valor TEXT NOT NULL
        )
    `);

    await wrapperInstance.run(`
        INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('num_ejercicios', '10')
    `);

    return wrapperInstance;
}
