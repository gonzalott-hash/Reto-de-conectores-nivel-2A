"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore, EjercicioBase } from "@/store/game-session";
import { ListChecks, Timer, AlertCircle, ArrowRight } from "lucide-react";

export default function Instrucciones() {
    const router = useRouter();
    const { nombreAlumno, iniciarReto } = useGameStore();
    const [ejercicios, setEjercicios] = useState<EjercicioBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [numEjercicios, setNumEjercicios] = useState(10);
    const TIEMPO_MINUTOS = numEjercicios;

    useEffect(() => {
        if (!nombreAlumno) {
            router.push("/");
            return;
        }

        const loadEjercicios = async () => {
            try {
                let limit = 10;
                try {
                    const confRes = await fetch("/api/config");
                    if (confRes.ok) {
                        const confData = await confRes.json();
                        if (confData.num_ejercicios) {
                            limit = parseInt(confData.num_ejercicios, 10);
                        }
                    }
                } catch (confErr) {
                    console.error("Error cargando configuracion", confErr);
                }

                setNumEjercicios(limit);

                const res = await fetch(`/api/ejercicios/random?limit=${limit}`);
                if (!res.ok) throw new Error("Error cargando ejercicios");

                const data = await res.json();

                if (data.length === 0) {
                    setError("No hay ejercicios disponibles en la base de datos.");
                } else {
                    setEjercicios(data);
                }
            } catch {
                setError("Error de red al cargar el reto.");
            } finally {
                setLoading(false);
            }
        };

        loadEjercicios();
    }, [nombreAlumno, router]);

    const handleStartReto = () => {
        iniciarReto(ejercicios, TIEMPO_MINUTOS);
        router.push("/reto");
    };

    if (!nombreAlumno) return null;

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
                <div className="bg-blue-900/80 p-8 text-center text-white border-b border-blue-800">
                    <h1 className="text-2xl font-bold mb-2 text-blue-100">Hola, {nombreAlumno} 👋</h1>
                    <p className="text-blue-200">Prepárate para iniciar el Reto de Conectores Lógicos Nivel 2A</p>
                </div>

                <div className="p-8 sm:p-10">
                    <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-700 pb-2">Reglas del Reto</h2>

                    <ul className="space-y-6 mb-8">
                        <li className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-900/40 text-blue-400 rounded-full flex items-center justify-center mr-4 ring-1 ring-blue-500/50">
                                <ListChecks className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-200">Múltiple Opción</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Enfrentarás <strong className="text-slate-300">{ejercicios.length} ejercicios</strong> consecutivos. Cada uno presenta un enunciado con un espacio en blanco y varias opciones de conectores.
                                </p>
                            </div>
                        </li>

                        <li className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 bg-amber-900/40 text-amber-400 rounded-full flex items-center justify-center mr-4 ring-1 ring-amber-500/50">
                                <Timer className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-200">Tiempo Limitado</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Tendrás exactamente <strong className="text-slate-300">{TIEMPO_MINUTOS} minutos</strong> para terminar. Si el tiempo se agota, el reto terminará automáticamente.
                                </p>
                            </div>
                        </li>

                        <li className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 bg-purple-900/40 text-purple-400 rounded-full flex items-center justify-center mr-4 ring-1 ring-purple-500/50">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-200">Análisis Pedagógico</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Al finalizar, obtendrás una puntuación y podrás descargar un PDF con tus errores y la explicación de cada repuesta correcta.
                                </p>
                            </div>
                        </li>
                    </ul>

                    {loading ? (
                        <div className="text-center p-4 bg-slate-900/50 rounded-lg text-slate-400 border border-slate-700">
                            Cargando banco de preguntas...
                        </div>
                    ) : error ? (
                        <div className="text-center p-4 bg-red-900/30 text-red-400 rounded-lg border border-red-800/50">
                            {error}
                        </div>
                    ) : (
                        <button
                            onClick={handleStartReto}
                            className="w-full py-4 px-4 rounded-xl text-white font-medium bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center group text-lg ring-1 ring-emerald-500/50"
                        >
                            ¡Estoy listo, comenzar!
                            <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
