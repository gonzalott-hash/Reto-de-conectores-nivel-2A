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
            if (cursorY > 230) {
                doc.addPage();
                cursorY = 20;
            }

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(37, 99, 235);
            doc.text(`Ejercicio ${index + 1}:`, 20, cursorY);
            cursorY += 8;

            const renderFraseConResaltado = (label: string, conector: string, color: [number, number, number], isBold: boolean) => {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105);
                doc.text(label, 20, cursorY);
                cursorY += 6;

                const partes = ejercicio.enunciado_incorrecto.split(/_{2,}/);
                const firstPart = partes[0] || "";
                const secondPart = partes[1] || "";
                const conectorFormateado = ` ${conector.toUpperCase()} `;

                // Renderizado por partes para colores dinámicos
                let currentX = 20;

                // Texto antes del conector
                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105);
                const splitFirst = doc.splitTextToSize(firstPart, pageWidth - 40);

                // Si la primera parte es multilínea, imprimimos todas menos la última normalmente
                if (splitFirst.length > 1) {
                    for (let i = 0; i < splitFirst.length - 1; i++) {
                        doc.text(splitFirst[i], 20, cursorY);
                        cursorY += 5;
                    }
                }

                // La última línea de la primera parte (o la única) se imprime y se guarda su ancho
                const lastLineFirstPart = splitFirst[splitFirst.length - 1];
                doc.text(lastLineFirstPart, 20, cursorY);
                currentX += doc.getTextWidth(lastLineFirstPart);

                // El conector con su color y estilo
                doc.setTextColor(color[0], color[1], color[2]);
                if (isBold) doc.setFont("helvetica", "bold");
                else doc.setFont("helvetica", "bolditalic");
                doc.text(conectorFormateado, currentX, cursorY);
                currentX += doc.getTextWidth(conectorFormateado);

                // El resto de la frase después del conector
                doc.setTextColor(71, 85, 105);
                doc.setFont("helvetica", "normal");
                doc.text(secondPart, currentX, cursorY);

                cursorY += 10;
            };

            // 1. Renderizar Tu respuesta (Error en Rojo)
            renderFraseConResaltado("Tu respuesta (incorrecta):", error.respuestaSeleccionada, [220, 38, 38], false);

            // 2. Renderizar Forma correcta (Acierto en Verde)
            renderFraseConResaltado("Forma correcta:", ejercicio.conector_correcto, [22, 163, 74], true);

            // Explicación
            if (ejercicio.explicacion) {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139); // Slate 500
                doc.setFontSize(10);
                const splitExplicacion = doc.splitTextToSize(`Nota pedagógica: ${ejercicio.explicacion}`, pageWidth - 40);
                doc.text(splitExplicacion, 20, cursorY);
                cursorY += (splitExplicacion.length * 5) + 12;
            } else {
                cursorY += 6;
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
