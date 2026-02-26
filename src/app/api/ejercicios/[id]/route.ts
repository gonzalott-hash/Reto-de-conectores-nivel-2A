import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;
        const body = await request.json();
        const { enunciado_incorrecto, opciones, conector_correcto, explicacion, es_activo } = body;

        if (!enunciado_incorrecto || !opciones || !conector_correcto || !explicacion) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb();

        // Update the record
        await db.run(
            `UPDATE ejercicios_n2 SET 
        enunciado_incorrecto = ?, 
        opciones = ?, 
        conector_correcto = ?, 
        explicacion = ?, 
        es_activo = ? 
       WHERE id = ?`,
            [enunciado_incorrecto, JSON.stringify(opciones), conector_correcto, explicacion, es_activo !== undefined ? es_activo : 1, id]
        );

        return NextResponse.json(
            { message: 'Ejercicio actualizado exitosamente' },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating ejercicio:", error);
        return NextResponse.json({ error: 'Failed to update ejercicio' }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    // We'll use a soft delete/toggle logic rather than actual DELETE to keep data integrity if needed in the future
    // Or hard delete if explicitly preferred. We'll do hard delete here as requested for a simple admin panel.
    try {
        const params = await props.params;
        const { id } = params;
        const db = await getDb();

        await db.run('DELETE FROM ejercicios_n2 WHERE id = ?', [id]);

        return NextResponse.json(
            { message: 'Ejercicio eliminado exitosamente' },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting ejercicio:", error);
        return NextResponse.json({ error: 'Failed to delete ejercicio' }, { status: 500 });
    }
}
