import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    // 1. Obtener credenciales crudas
    const u_raw = process.env.TURSO_DATABASE_URL || "";
    const t_raw = process.env.TURSO_AUTH_TOKEN || "";

    // 2. Limpieza Ultra-Violenta idéntica a la que hacemos en db.ts
    let u = u_raw.trim().replace(/["']/g, "").replace(/\s/g, "").replace(/[^\x20-\x7E]/g, "");
    u = u.replace(/\\n/g, "").replace(/\\r/g, "").replace(/\\t/g, "");
    if (u.includes('?')) u = u.split('?')[0];
    while (u.endsWith('/')) u = u.slice(0, -1);
    if (u.startsWith("libsql://")) u = u.replace("libsql://", "https://");

    let t = t_raw.trim().replace(/["']/g, "").replace(/\s/g, "").replace(/[^\x20-\x7E]/g, "");
    t = t.replace(/\\n/g, "").replace(/\\r/g, "").replace(/\\t/g, "");
    if (t.toLowerCase().startsWith("bearer ")) t = t.substring(7).trim();

    const fetch_url = `${u}/v2/pipeline`;
    let raw_response = null;
    let raw_status = 0;

    try {
        // Intentamos una petición cruda al protocolo de Turso
        const res = await fetch(fetch_url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${t}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [
                    { type: 'execute', stmt: { sql: 'SELECT 1' } },
                    { type: 'close' }
                ]
            })
        });

        raw_status = res.status;
        raw_response = await res.text();

        return NextResponse.json({
            status: raw_status === 200 ? "success" : "error",
            http_status_code: raw_status,
            turso_raw_body: raw_response,
            diagnosis: {
                endpoint_used: fetch_url,
                token_len: t.length,
                original_u_len: u_raw.length
            }
        });

    } catch (e: any) {
        return NextResponse.json({
            status: "fatal_error",
            error: e.message,
            diagnosis: {
                attempted_url: fetch_url
            }
        }, { status: 500 });
    }
}
