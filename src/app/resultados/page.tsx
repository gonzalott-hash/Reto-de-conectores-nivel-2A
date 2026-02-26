"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-session";
import { generarPDFResultados } from "@/lib/pdf-generator";
import { Download, Trophy, RotateCcw } from "lucide-react";

export default function Resultados() {
    const router = useRouter();
    const {
        nombreAlumno,
        ejercicios,
        respuestas,
        tiempoTotalConfigurado,
        tiempoRestante,
        resetearReto
    } = useGameStore();

    const [score, setScore] = useState(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (!nombreAlumno || ejercicios.length === 0) {
            router.push("/");
            return;
        }

        // Calcular score
        let aciertos = 0;
        respuestas.forEach(r => {
            const ejercicio = ejercicios.find(e => e.id === r.ejercicioId);
            if (ejercicio && ejercicio.conector_correcto === r.respuestaSeleccionada) {
                aciertos++;
            }
        });
        setScore(aciertos);
    }, [nombreAlumno, ejercicios, respuestas, router]);

    const handleDescargarPDF = () => {
        const tiempoUsadoSegundos = tiempoTotalConfigurado - tiempoRestante;
        const min = Math.floor(tiempoUsadoSegundos / 60);
        const sec = tiempoUsadoSegundos % 60;
        const tiempoFormat = `${min}:${sec.toString().padStart(2, "0")}`;

        generarPDFResultados({
            nombreAlumno,
            score,
            totalEjercicios: ejercicios.length,
            tiempoUsado: tiempoFormat,
            respuestas,
            ejerciciosData: ejercicios
        });
    };

    const handleVolverJugar = () => {
        resetearReto();
        router.push("/");
    };

    if (!isClient || !nombreAlumno) return null;

    const porcentaje = (score / ejercicios.length) * 100;

    let mensaje = "";
    if (porcentaje === 100) mensaje = "¡Perfección absoluta!";
    else if (porcentaje >= 80) mensaje = "¡Excelente desempeño!";
    else if (porcentaje >= 60) mensaje = "¡Buen trabajo!";
    else mensaje = "Sigue practicando";

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden text-center border border-slate-700">

                <div className="bg-emerald-600/90 p-10 text-white flex flex-col items-center border-b border-emerald-700/50">
                    <div className="h-20 w-20 bg-emerald-500/80 rounded-full flex items-center justify-center mb-4 ring-4 ring-emerald-400/50 shadow-lg">
                        <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Reto Finalizado</h1>
                    <p className="text-emerald-100/90 text-lg">{mensaje}</p>
                </div>

                <div className="p-8">
                    <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Puntuación de {nombreAlumno}</h2>
                    <div className="text-6xl font-black text-slate-100 mb-8">
                        {score} <span className="text-3xl text-slate-500">/ {ejercicios.length}</span>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleDescargarPDF}
                            className="w-full py-4 px-4 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all flex items-center justify-center group"
                        >
                            <Download className="w-5 h-5 mr-2 group-hover:-translate-y-1 transition-transform" />
                            Descargar Análisis en PDF
                        </button>

                        <button
                            onClick={handleVolverJugar}
                            className="w-full py-4 px-4 rounded-xl text-slate-300 font-medium bg-slate-700 hover:bg-slate-600 border border-slate-600 transition-all flex items-center justify-center"
                        >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Volver al inicio
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
