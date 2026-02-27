import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.ejercicios || !Array.isArray(body.ejercicios)) {
            return NextResponse.json({ message: "Formato no válido. Se esperaba un array de ejercicios." }, { status: 400 });
        }

        const db = await getDb();

        const stmt = await db.prepare(`
            INSERT INTO ejercicios_n2 (enunciado_incorrecto, opciones, conector_correcto, explicacion)
            VALUES (?, ?, ?, ?)
        `);

        // Ejecutar inserciones directamente. Las transacciones explicitas a veces bloquean los drivers de Serverless (Vercel)
        let insertados = 0;

        try {
            for (const ej of body.ejercicios) {
                if (ej.enunciado_incorrecto && ej.opciones && ej.conector_correcto) {
                    const opcionesArray = Array.isArray(ej.opciones)
                        ? ej.opciones
                        : ej.opciones.split(",").map((o: string) => o.trim());

                    await stmt.run(
                        ej.enunciado_incorrecto,
                        JSON.stringify(opcionesArray),
                        ej.conector_correcto.trim(),
                        ej.explicacion || ""
                    );
                    insertados++;
                }
            }
        } catch (txnErr) {
            console.error("Error intertando lote de ejercicios:", txnErr);
            throw txnErr; // Rethrow to be caught by the outer catch
        } finally {
            await stmt.finalize();
        }

        return NextResponse.json({
            message: "Importación exitosa",
            insertados
        }, { status: 201 });

    } catch (error: any) {
        console.error("Error en bulk import:", error);
        return NextResponse.json({
            message: "Error interno del servidor al importar",
            details: error?.message || String(error)
        }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const db = await getDb();
        const result = await db.run('DELETE FROM ejercicios_n2');

        // Intentar reiniciar el contador de autoincremento
        try {
            await db.run("DELETE FROM sqlite_sequence WHERE name='ejercicios_n2'");
        } catch (e) {
            // Ignorar si falla reinicio de secuencia (común en ciertos entornos remotos)
        }

        return NextResponse.json({
            message: "Todos los ejercicios han sido eliminados correctamente",
            borrados: result.changes
        });
    } catch (error: any) {
        console.error("Error al borrar ejercicios masivamente:", error);
        return NextResponse.json({
            message: "Error al intentar borrar los ejercicios",
            details: error?.message || String(error)
        }, { status: 500 });
    }
}

