import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        // En caso de que la variable de entorno no se cargue correctamente
        const adminPassword = process.env.ADMIN_PASSWORD || "eduadmin2026";

        if (!adminPassword) {
            console.error("[Auth Error] ADMIN_PASSWORD environment variable is missing!");
            return NextResponse.json({
                success: false,
                message: 'Server configuration error: Admin credentials not configured.'
            }, { status: 500 });
        }

        if (password === adminPassword) {
            // En un caso real, aquí generaríamos un JWT o cookie HTTP-only.
            // Para este prototipo, simplemente devolvemos éxito y el frontend manejará el estado.
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: 'Contraseña incorrecta' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Bad request' }, { status: 400 });
    }
}
