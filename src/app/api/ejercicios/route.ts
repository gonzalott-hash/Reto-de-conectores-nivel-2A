import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = await getDb();
        // Return all exercises for the admin panel (including inactive ones)
        const ejercicios = await db.all('SELECT * FROM ejercicios_n2 ORDER BY creado_en DESC');

        // Parse the JSON string options back to arrays
        const parsedEjercicios = ejercicios.map(e => ({
            ...e,
            opciones: JSON.parse(String(e.opciones))
        }));

        return NextResponse.json(parsedEjercicios);
    } catch (error) {
        console.error("Error fetching ejercicios:", error);
        return NextResponse.json({ error: 'Failed to fetch ejercicios' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { enunciado_incorrecto, opciones, conector_correcto, explicacion, es_activo = 1 } = body;

        // Basic validation
        if (!enunciado_incorrecto || !opciones || !conector_correcto || !explicacion) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb();

        const result = await db.run(
            `INSERT INTO ejercicios_n2 (enunciado_incorrecto, opciones, conector_correcto, explicacion, es_activo) 
       VALUES (?, ?, ?, ?, ?)`,
            [enunciado_incorrecto, JSON.stringify(opciones), conector_correcto, explicacion, es_activo]
        );

        return NextResponse.json(
            { message: 'Ejercicio creado', id: result.lastID },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating ejercicio:", error);
        return NextResponse.json({ error: 'Failed to create ejercicio' }, { status: 500 });
    }
}
