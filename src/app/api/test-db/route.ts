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
        const url = process.env.TURSO_DATABASE_URL || "";
        const token = process.env.TURSO_AUTH_TOKEN || "";

        return NextResponse.json({
            status: "error",
            message: error?.message || 'Error desconocido',
            debug_info: {
                url_length: url.length,
                url_prefix: url.substring(0, 15),
                token_length: token.length,
                token_prefix: token.substring(0, 10),
                node_env: process.env.NODE_ENV
            }
        }, { status: 400 });
    }
}
