import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'node:fs';
import path from 'node:path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), '21 ejercicios conectores n2.txt');

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({
                status: "error",
                message: "Archivo de ejercicios no encontrado en el servidor",
                path: filePath
            }, { status: 404 });
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').map(l => l.trim());

        const db = await getDb();
        let count = 0;
        let currentEnunciado = "";
        let currentOptions: string[] = [];
        let currentAnswer = "";

        // Limpiar tabla antes si se desea, o solo insertar
        // await db.run("DELETE FROM ejercicios_n2");

        for (const line of lines) {
            if (line.match(/_{2,}/) || line.includes('__')) {
                // Guardar previo
                if (currentEnunciado && currentOptions.length > 0 && currentAnswer) {
                    await db.run(
                        "INSERT INTO ejercicios_n2 (enunciado_incorrecto, opciones, conector_correcto, explicacion) VALUES (?, ?, ?, ?)",
                        [currentEnunciado, JSON.stringify(currentOptions), currentAnswer, ""]
                    );
                    count++;
                }
                currentEnunciado = line;
                currentOptions = [];
                currentAnswer = "";
            } else if (line.length > 0) {
                let optionText = line;
                if (line.endsWith('*')) {
                    optionText = line.slice(0, -1).trim();
                    currentAnswer = optionText;
                }
                currentOptions.push(optionText);
            }
        }

        // Guardar el último
        if (currentEnunciado && currentOptions.length > 0 && currentAnswer) {
            await db.run(
                "INSERT INTO ejercicios_n2 (enunciado_incorrecto, opciones, conector_correcto, explicacion) VALUES (?, ?, ?, ?)",
                [currentEnunciado, JSON.stringify(currentOptions), currentAnswer, ""]
            );
            count++;
        }

        return NextResponse.json({
            status: "success",
            message: `Se han importado ${count} ejercicios exitosamente.`,
            details: "La base de datos Turso ha sido poblada."
        });

    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            message: error.message
        }, { status: 500 });
    }
}
