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
        return NextResponse.json({
            status: "error",
            message: error?.message || 'Error desconocido desche api/test-db',
            details: "Si ves un error 400 aquí, es un problema de protocolo/auth global."
        }, { status: 400 });
    }
}
