import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const db = await getDb();

        // Obtener limite dinámico
        const paramRow = await db.get("SELECT valor FROM config_n2 WHERE clave = 'num_ejercicios'");
        const dbLimit = paramRow && paramRow.valor ? parseInt(String(paramRow.valor), 10) : null;
        const limitNum = dbLimit || parseInt(searchParams.get('limit') || '10', 10);

        // Sólo trae ejercicios activos y ordenados al azar
        const ejercicios = await db.all(`
      SELECT id, enunciado_incorrecto, opciones, conector_correcto, explicacion 
      FROM ejercicios_n2 
      WHERE es_activo = 1 
      ORDER BY RANDOM() 
      LIMIT ?
    `, [limitNum]);

        const parsedEjercicios = ejercicios.map(e => {
            const opcionesArr: string[] = JSON.parse(String(e.opciones));
            // Shuffle opciones
            for (let i = opcionesArr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [opcionesArr[i], opcionesArr[j]] = [opcionesArr[j], opcionesArr[i]];
            }
            return {
                ...e,
                opciones: opcionesArr
            };
        });

        return NextResponse.json(parsedEjercicios);
    } catch (error: any) {
        console.error("Error fetching random ejercicios:", error);
        return NextResponse.json({ error: error?.message || 'Failed to fetch ejercicios' }, { status: 500 });
    }
}
