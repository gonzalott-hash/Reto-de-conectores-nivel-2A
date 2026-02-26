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
            // Turso recomienda usar el string directo si no hay argumentos para evitar 400 por JSON malformado
            if (!args || args.length === 0) {
                return await this.client.execute(sql.trim());
            }
            return await this.client.execute({
                sql: sql.trim(),
                args: args
            });
        } catch (e: any) {
            const shortSql = sql.trim().substring(0, 100);
            // Capturamos el error para el diagnóstico
            throw new Error(`SQL_ERROR: ${e.message} | SQL: ${shortSql}`);
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

    // Limpieza ULTRA-VIOLENTA de credenciales
    let u = (process.env.TURSO_DATABASE_URL || "").trim();
    let t = (process.env.TURSO_AUTH_TOKEN || "").trim();

    // 1. Quitar comillas, espacios y caracteres no imprimibles (limpieza de basura invisible)
    u = u.replace(/["']/g, "").replace(/\s/g, "").replace(/[^\x20-\x7E]/g, "");
    t = t.replace(/["']/g, "").replace(/\s/g, "").replace(/[^\x20-\x7E]/g, "");

    // 2. Quitar secuencias literales de escape que el usuario haya podido pegar ( \n, \r, etc )
    // Esto es vital porque el diagnóstico detectó "\n" literales al final del token
    u = u.replace(/\\n/g, "").replace(/\\r/g, "").replace(/\\t/g, "");
    t = t.replace(/\\n/g, "").replace(/\\r/g, "").replace(/\\t/g, "");

    // 3. Quitar prefijo "Bearer " si existe
    if (t.toLowerCase().startsWith("bearer ")) t = t.substring(7).trim();

    // 4. Limpieza de URL (barras finales y parámetros)
    if (u.includes('?')) u = u.split('?')[0];
    while (u.endsWith('/')) u = u.slice(0, -1);

    // 5. Normalizar protocolo a HTTPS (CRÍTICO para estabilidad en Vercel)
    if (u.startsWith("libsql://")) {
        u = u.replace("libsql://", "https://");
    }

    if (process.env.NODE_ENV === 'production') {
        if (!u || !t) {
            throw new Error("Variables de base de datos faltantes (TURSO_DATABASE_URL o TURSO_AUTH_TOKEN).");
        }
    }

    clientInstance = createClient({
        url: u || "file:./sqlite.db",
        authToken: u.startsWith("file:") ? "" : t,
    });

    const wrapper = new DbWrapper(clientInstance);

    if (!global._db_initialized) {
        try {
            await wrapper.run("CREATE TABLE IF NOT EXISTS ejercicios_n2 (id INTEGER PRIMARY KEY AUTOINCREMENT, enunciado_incorrecto TEXT NOT NULL, opciones TEXT NOT NULL, conector_correcto TEXT NOT NULL, explicacion TEXT NOT NULL DEFAULT '', es_activo BOOLEAN NOT NULL DEFAULT 1, creado_en DATETIME DEFAULT CURRENT_TIMESTAMP)");
            await wrapper.run("CREATE TABLE IF NOT EXISTS config_n2 (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)");
            await wrapper.run("INSERT OR IGNORE INTO config_n2 (clave, valor) VALUES ('num_ejercicios', '10')");
            global._db_initialized = true;
        } catch (initError: any) {
            console.error("Aviso: Error de inicialización:", initError.message);
        }
    }

    wrapperInstance = wrapper;
    return wrapperInstance;
}

