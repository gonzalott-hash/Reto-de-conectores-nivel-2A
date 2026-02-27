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

            const checkPageBreak = (neededHeight: number) => {
                if (cursorY + neededHeight > 275) {
                    doc.addPage();
                    cursorY = 20;
                    return true;
                }
                return false;
            };

            const renderFraseConResaltado = (label: string, conector: string, color: [number, number, number], isBold: boolean) => {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105);
                checkPageBreak(15);
                doc.text(label, 20, cursorY);
                cursorY += 6;

                // Dividir el enunciado por los espacios en blanco (______)
                const enunciadoPartes = ejercicio.enunciado_incorrecto.split(/_{2,}/);

                // Dividir el conector en sus partes componentes
                // Soporta separadores comunes como " - ", " – ", " — "
                const conectorPartes = conector.split(/\s+[-–—]\s+/);

                const margin = 20;
                let currentX = margin;

                const renderSegment = (text: string, segmentColor: [number, number, number], segmentBold: boolean) => {
                    doc.setTextColor(segmentColor[0], segmentColor[1], segmentColor[2]);
                    doc.setFont("helvetica", segmentBold ? "bold" : "normal");

                    const words = text.split(" ");
                    for (let i = 0; i < words.length; i++) {
                        const word = words[i] + (i === words.length - 1 ? "" : " ");
                        const wordWidth = doc.getTextWidth(word);

                        if (currentX + wordWidth > pageWidth - margin) {
                            cursorY += 6;
                            currentX = margin;
                            checkPageBreak(6);
                        }

                        doc.text(word, currentX, cursorY);
                        currentX += wordWidth;
                    }
                };

                // Intercalar partes del enunciado con partes del conector
                for (let j = 0; j < enunciadoPartes.length; j++) {
                    // Renderizar parte del enunciado
                    if (enunciadoPartes[j]) {
                        renderSegment(enunciadoPartes[j], [71, 85, 105], false);
                    }

                    // Renderizar conector correspondiente si existe
                    if (j < enunciadoPartes.length - 1) {
                        const conPart = conectorPartes[j] || "_______";
                        const conText = ` ${conPart.trim().toUpperCase()} `;
                        renderSegment(conText, color, true);
                    }
                }

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
