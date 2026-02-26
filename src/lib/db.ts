import { createClient, Client } from "@libsql/client";

// Caché global para evitar reinicializaciones DDL en la misma instancia de Vercel
declare global {
    var _db_initialized: boolean | undefined;
}

let clientInstance: Client | null = null;
let wrapperInstance: DbWrapper | null = null;

class DbWrapper {
    constructor(private client: Client) { }

    private async query(sql: string, args: any[] = []) {
        try {
            // Normalizamos la ejecución para usar siempre el formato de objeto.
            // Algunos servidores de Turso pueden responder con 400 si el JSON del body es ambiguo.
            return await this.client.execute({
                sql: sql.trim(),
                args: args || []
            });
        } catch (e: any) {
            const shortSql = sql.trim().substring(0, 100);
            console.error(`DB_QUERY_ERROR: ${e.message} | SQL: ${shortSql}`);
            throw new Error(`SQL_ERROR: ${e.message} (Consulta: ${shortSql}...)`);
        }
    }

    async all(sql: string, args: any[] = []) {
        const res = await this.query(sql, args);
        return res.rows;
    }

    async get(sql: string, args: any[] = []) {
        const res = await this.query(sql, args);
        return res.rows[0];
    }

    async run(sql: string, args: any[] = []) {
        const res = await this.query(sql, args);
        return {
            lastID: res.lastInsertRowid?.toString() || 0,
            changes: res.rowsAffected
        };
    }

    async prepare(sql: string) {
        return {
            run: async (...args: any[]) => await this.run(sql, args),
            finalize: async () => { }
        }
    }
}

export async function getDb(): Promise<DbWrapper> {
    if (wrapperInstance) {
        return wrapperInstance;
    }

    // Limpieza de credenciales
    let currentUrl = (process.env.TURSO_DATABASE_URL || "").trim();
    let currentToken = (process.env.TURSO_AUTH_TOKEN || "").trim();

    // 1. Eliminar comillas accidentales
    currentUrl = currentUrl.replace(/["']/g, "");
    currentToken = currentToken.replace(/["']/g, "");

    // 2. Si el usuario pegó "Bearer " por error en Vercel, lo quitamos
    if (currentToken.toLowerCase().startsWith("bearer ")) {
        currentToken = currentToken.substring(7).trim();
    }

    // 3. Limpiar espacios y saltos de línea invisibles finales
    currentUrl = currentUrl.replace(/\s/g, "");
    currentToken = currentToken.replace(/\s/g, "");

    // Normalizamos el protocolo a https para máxima estabilidad en funciones serverless
    if (currentUrl.startsWith("libsql://")) {
        currentUrl = currentUrl.replace("libsql://", "https://");
    }

    if (process.env.NODE_ENV === 'production') {
        if (!currentUrl || !currentToken) {
            throw new Error("Variables de base de datos faltantes (TURSO_DATABASE_URL o TURSO_AUTH_TOKEN).");
        }
    }

    clientInstance = createClient({
        url: currentUrl || "file:./sqlite.db",
        authToken: currentToken,
    });

    const wrapper = new DbWrapper(clientInstance);

    // Solo ejecutamos los DDLs si no se han hecho ya en esta instancia
    if (!global._db_initialized) {
        try {
            await wrapper.run("CREATE TABLE IF NOT EXISTS ejercicios_n2 (id INTEGER PRIMARY KEY AUTOINCREMENT, enunciado_incorrecto TEXT NOT NULL, opciones TEXT NOT NULL, conector_correcto TEXT NOT NULL, explicacion TEXT NOT NULL DEFAULT '', es_activo BOOLEAN NOT NULL DEFAULT 1, creado_en DATETIME DEFAULT CURRENT_TIMESTAMP)");
            await wrapper.run("CREATE TABLE IF NOT EXISTS config_n2 (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)");
            await wrapper.run("INSERT OR IGNORE INTO config_n2 (clave, valor) VALUES ('num_ejercicios', '10')");
            global._db_initialized = true;
        } catch (initError: any) {
            console.error("Aviso: Error durante inicialización automática:", initError.message);
        }
    }

    wrapperInstance = wrapper;
    return wrapperInstance;
}

