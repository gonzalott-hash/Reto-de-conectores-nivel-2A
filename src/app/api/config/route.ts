import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = await getDb();
        const configParams = await db.all("SELECT * FROM configuracion");

        const confObj: Record<string, string> = {};
        for (const item of configParams) {
            const clave = typeof item.clave === 'string' ? item.clave : String(item.clave);
            const valor = typeof item.valor === 'string' ? item.valor : String(item.valor);
            confObj[clave] = valor;
        }

        return NextResponse.json(confObj);
    } catch (error: any) {
        console.error("Error fetching config:", error);
        return NextResponse.json({ error: error?.message || 'Failed to fetch config' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const db = await getDb();

        // Upsert all keys
        for (const key of Object.keys(body)) {
            const val = body[key].toString();
            await db.run(
                `INSERT INTO configuracion (clave, valor) VALUES (?, ?) 
                 ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor`,
                [key, val]
            );
        }

        return NextResponse.json({ message: 'Configuracion actualizada' }, { status: 200 });
    } catch (error) {
        console.error("Error updating config:", error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
