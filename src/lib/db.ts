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
        const res = await this.client.execute({ sql, args });
        return res.rows;
    }

    async get(sql: string, args: any[] = []) {
        const res = await this.client.execute({ sql, args });
        return res.rows[0];
    }

    async run(sql: string, args: any[] = []) {
        const res = await this.client.execute({ sql, args });
        return { lastID: res.lastInsertRowid?.toString() || 0, changes: res.rowsAffected };
    }

    async prepare(sql: string) {
        // Just return a dummy statement that calls run
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

    if (process.env.NODE_ENV === 'production') {
        if (!url || !authToken) {
            throw new Error("Variables de base de datos faltantes (TURSO_DATABASE_URL o TURSO_AUTH_TOKEN). Verifica la configuración de Vercel.");
        }
    }

    clientInstance = createClient({
        url: safeUrl,
        authToken: authToken,
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
