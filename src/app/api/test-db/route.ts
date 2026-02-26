import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = await getDb();
        const test = await db.all("SELECT 1 as connection_test");
        return NextResponse.json({
            status: "success",
            message: "Conexión a base de datos exitosa",
            data: test
        });
    } catch (error: any) {
        const u_raw = process.env.TURSO_DATABASE_URL || "";
        const t_raw = process.env.TURSO_AUTH_TOKEN || "";

        // Simulamos la limpieza para reporte
        let u_clean = u_raw.trim().replace(/["']/g, "").replace(/\s/g, "").replace(/[^\x20-\x7E]/g, "");
        u_clean = u_clean.replace(/\\n/g, "").replace(/\\r/g, "").replace(/\\t/g, "");
        if (u_clean.includes('?')) u_clean = u_clean.split('?')[0];
        while (u_clean.endsWith('/')) u_clean = u_clean.slice(0, -1);

        const final_u = u_clean.replace("libsql://", "https://");

        let t_clean = t_raw.trim().replace(/["']/g, "").replace(/\s/g, "").replace(/[^\x20-\x7E]/g, "");
        t_clean = t_clean.replace(/\\n/g, "").replace(/\\r/g, "").replace(/\\t/g, "");

        return NextResponse.json({
            status: "error",
            message: error?.message || 'Error desconocido',
            diagnosis: {
                original_url: {
                    len: u_raw.length,
                    start: u_raw.substring(0, 15),
                    end: u_raw.substring(u_raw.length - 10)
                },
                cleaned_url: {
                    len: final_u.length,
                    start: final_u.substring(0, 15),
                    end: final_u.substring(final_u.length - 10),
                    has_escaped_newlines: u_raw.includes('\\n') || u_raw.includes('\\r')
                },
                token: {
                    original_len: t_raw.length,
                    cleaned_len: t_clean.length,
                    has_escaped_newlines: t_raw.includes('\\n') || t_raw.includes('\\r'),
                    end_raw_json: JSON.stringify(t_raw.substring(t_raw.length - 5))
                },
                node_env: process.env.NODE_ENV
            }
        }, { status: 400 });
    }
}
