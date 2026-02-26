"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-session";
import { Clock } from "lucide-react";

export default function Reto() {
    const router = useRouter();
    const {
        ejercicios,
        ejercicioActualIndex,
        tiempoRestante,
        temporizadorActivo,
        tickTemporizador,
        responderEjercicio,
        finalizarReto
    } = useGameStore();

    const tiempoInicio = useRef<number>(0);

    useEffect(() => {
        if (ejercicios.length === 0) {
            router.push("/");
            return;
        }

        tiempoInicio.current = new Date().getTime(); // Resetear tiempo cada vez que entra a un nuevo ejercicio
    }, [ejercicioActualIndex, ejercicios, router]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (temporizadorActivo && tiempoRestante > 0) {
            interval = setInterval(() => {
                tickTemporizador();
            }, 1000);
        } else if (tiempoRestante === 0 && temporizadorActivo) {
            finalizarReto();
            router.push("/resultados");
        }

        return () => clearInterval(interval);
    }, [temporizadorActivo, tiempoRestante, tickTemporizador, finalizarReto, router]);

    // Navigate to results when all exercises are complete and timer stops 
    useEffect(() => {
        if (ejercicios.length > 0 && ejercicioActualIndex >= ejercicios.length) {
            router.push("/resultados");
        }
    }, [ejercicioActualIndex, ejercicios, router]);

    const handleResponder = (respuesta: string) => {
        const tiempoTomado = Math.round((new Date().getTime() - tiempoInicio.current) / 1000);

        responderEjercicio({
            ejercicioId: currentEjercicio.id,
            respuestaSeleccionada: respuesta,
            tiempoTomadoEnSegundos: tiempoTomado
        });
    };

    if (ejercicios.length === 0 || ejercicioActualIndex >= ejercicios.length) return null;

    const currentEjercicio = ejercicios[ejercicioActualIndex];

    // Format MM:SS
    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    };

    const partesEnunciado = currentEjercicio.enunciado_incorrecto.split(/_{2,}/);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            {/* Top Bar / Hub */}
            <div className="max-w-3xl w-full flex justify-between items-center mb-8">
                <div className="bg-slate-800 rounded-full px-5 py-2 shadow-sm border border-slate-700 text-slate-300 font-medium text-sm">
                    Pregunta <span className="text-blue-400 ml-1">{ejercicioActualIndex + 1}</span> de {ejercicios.length}
                </div>

                <div className={`bg-slate-800 rounded-full px-5 py-2 shadow-sm border font-medium text-sm flex items-center transition-colors ${tiempoRestante < 60 ? 'border-red-900 text-red-400 bg-red-900/20' : 'border-slate-700 text-slate-300'
                    }`}>
                    <Clock className="w-4 h-4 mr-2" />
                    {formatTime(tiempoRestante)}
                </div>
            </div>

            <div className="max-w-3xl w-full bg-slate-800 rounded-3xl shadow-2xl overflow-hidden mb-8 border border-slate-700">
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-700">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${((ejercicioActualIndex) / ejercicios.length) * 100}%` }}
                    />
                </div>

                <div className="p-8 sm:p-12">
                    {/* El Enunciado */}
                    <div className="text-xl sm:text-2xl text-slate-100 leading-relaxed font-serif text-center mb-12">
                        {partesEnunciado.map((parte, index) => (
                            <span key={index}>
                                {parte}
                                {index < partesEnunciado.length - 1 && (
                                    <span className="inline-block border-b-2 border-dashed border-blue-400/50 w-24 mx-2 align-middle"></span>
                                )}
                            </span>
                        ))}
                    </div>

                    {/* Opciones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentEjercicio.opciones.map((opcion, i) => (
                            <button
                                key={i}
                                onClick={() => handleResponder(opcion)}
                                className="py-4 px-6 rounded-xl border-2 border-slate-700 hover:border-blue-500/50 hover:bg-slate-700/50 text-slate-300 font-medium transition-all text-lg group text-center"
                            >
                                <span className="group-hover:text-blue-300">{opcion}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
