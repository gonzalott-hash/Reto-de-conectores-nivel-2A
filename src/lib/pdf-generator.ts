import { jsPDF } from 'jspdf';
import { EjercicioBase, RespuestaUsuario } from '@/store/game-session';

type GenerarPDFParams = {
    nombreAlumno: string;
    score: number;
    totalEjercicios: number;
    tiempoUsado: string;
    respuestas: RespuestaUsuario[];
    ejerciciosData: EjercicioBase[];
};

export const generarPDFResultados = ({
    nombreAlumno,
    score,
    totalEjercicios,
    tiempoUsado,
    respuestas,
    ejerciciosData
}: GenerarPDFParams) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue 600
    doc.text("Reporte: Reto de Conectores Lógicos Nivel 2A", pageWidth / 2, 20, { align: "center" });

    // Info del Estudiante
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85); // Slate 700
    doc.text(`Estudiante: ${nombreAlumno}`, 20, 40);
    doc.text(`Puntuación: ${score} / ${totalEjercicios}`, 20, 50);
    doc.text(`Tiempo invertido: ${tiempoUsado}`, 20, 60);

    doc.setDrawColor(226, 232, 240); // line color slate 200
    doc.line(20, 65, pageWidth - 20, 65);

    let cursorY = 80;

    // Encontrar errores
    const errores = respuestas.filter(r => {
        const ej = ejerciciosData.find(e => e.id === r.ejercicioId);
        return ej && ej.conector_correcto !== r.respuestaSeleccionada;
    });

    if (errores.length === 0) {
        doc.setFontSize(14);
        doc.setTextColor(22, 163, 74); // Green 600
        doc.text("¡Excelente trabajo! No tuviste ningún error.", 20, cursorY);
    } else {
        doc.setFontSize(14);
        doc.setTextColor(220, 38, 38); // Red 600
        doc.text(`Análisis de Errores (${errores.length}):`, 20, cursorY);
        cursorY += 15;

        errores.forEach((error, index) => {
            const ejercicio = ejerciciosData.find(e => e.id === error.ejercicioId);
            if (!ejercicio) return;

            // Ensure we don't go out of bounds on Y
            if (cursorY > 240) {
                doc.addPage();
                cursorY = 20;
            }

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(37, 99, 235);
            doc.text(`Ejercicio ${index + 1}:`, 20, cursorY);
            cursorY += 7;

            // Reconstrucción del enunciado con la respuesta del usuario (Incorrecto)
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            doc.text("Tu respuesta (incorrecta):", 20, cursorY);
            cursorY += 6;

            doc.setTextColor(220, 38, 38); // Rojo
            doc.setFont("helvetica", "italic");
            const fraseUsuario = ejercicio.enunciado_incorrecto.replace(/_{2,}/, `[ ${error.respuestaSeleccionada.toUpperCase()} ]`);
            const splitFraseUsuario = doc.splitTextToSize(fraseUsuario, pageWidth - 40);
            doc.text(splitFraseUsuario, 20, cursorY);
            cursorY += (splitFraseUsuario.length * 5) + 4;

            // Reconstrucción del enunciado con la respuesta correcta (Correcto)
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            doc.text("Forma correcta:", 20, cursorY);
            cursorY += 6;

            doc.setTextColor(22, 163, 74); // Verde
            doc.setFont("helvetica", "bold");
            const fraseCorrecta = ejercicio.enunciado_incorrecto.replace(/_{2,}/, `[ ${ejercicio.conector_correcto.toUpperCase()} ]`);
            const splitFraseCorrecta = doc.splitTextToSize(fraseCorrecta, pageWidth - 40);
            doc.text(splitFraseCorrecta, 20, cursorY);
            cursorY += (splitFraseCorrecta.length * 5) + 6;

            // Explicación
            if (ejercicio.explicacion) {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139); // Slate 500
                doc.setFontSize(10);
                const splitExplicacion = doc.splitTextToSize(`Nota pedagógica: ${ejercicio.explicacion}`, pageWidth - 40);
                doc.text(splitExplicacion, 20, cursorY);
                cursorY += (splitExplicacion.length * 5) + 10;
            } else {
                cursorY += 4;
            }

            doc.setDrawColor(241, 245, 249); // slate 100
            doc.line(20, cursorY - 5, pageWidth - 20, cursorY - 5);
            cursorY += 5;
        });
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text("Generado automáticamente por Antigravity EdTech App", pageWidth / 2, 290, { align: "center" });

    // Descargar
    const safeName = nombreAlumno.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`reporte_${safeName}_conectores.pdf`);
};
