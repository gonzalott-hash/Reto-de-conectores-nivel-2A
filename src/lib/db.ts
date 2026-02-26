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
            // Turso recomienda llamar a execute con el string directamente si no hay parámetros
            // Esto evita que algunos clientes manden un objeto JSON que cause 400 en el servidor
            if (!args || args.length === 0) {
                return await this.client.execute(sql.trim());
            }
            return await this.client.execute({ sql: sql.trim(), args });
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

    // Limpieza EXTREMA de credenciales: eliminamos espacios, comillas y saltos de línea accidentales
    let currentUrl = (process.env.TURSO_DATABASE_URL || "").replace(/[\s"']/g, "").trim();
    const currentToken = (process.env.TURSO_AUTH_TOKEN || "").replace(/[\s"']/g, "").trim();

    // Normalizamos el protocolo a https para máxima estabilidad en el entorno HTTP de Vercel
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

    // Solo ejecutamos los DDLs si no se han hecho ya en esta instancia para reducir latencia y riesgos
    if (!global._db_initialized) {
        try {
            await wrapper.run("CREATE TABLE IF NOT EXISTS ejercicios_n2 (id INTEGER PRIMARY KEY AUTOINCREMENT, enunciado_incorrecto TEXT NOT NULL, opciones TEXT NOT NULL, conector_correcto TEXT NOT NULL, explicacion TEXT NOT NULL DEFAULT '', es_activo BOOLEAN NOT NULL DEFAULT 1, creado_en DATETIME DEFAULT CURRENT_TIMESTAMP)");
            await wrapper.run("CREATE TABLE IF NOT EXISTS config_n2 (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)");
            await wrapper.run("INSERT OR IGNORE INTO config_n2 (clave, valor) VALUES ('num_ejercicios', '10')");
            global._db_initialized = true;
        } catch (initError) {
            console.error("Aviso: Error durante inicialización automática (puede ser ignorado si las tablas existen):", initError);
        }
    }

    wrapperInstance = wrapper;
    return wrapperInstance;
}

