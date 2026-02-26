"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-session";
import { BookOpen, ArrowRight } from "lucide-react";

export default function Home() {
  const [nombre, setNombre] = useState("");
  const setNombreAlumno = useGameStore((state) => state.setNombreAlumno);
  const router = useRouter();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim().length > 0) {
      setNombreAlumno(nombre.trim());
      router.push("/instrucciones");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-8 sm:p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-blue-900/30 rounded-full flex items-center justify-center ring-1 ring-blue-500/50">
              <BookOpen className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Reto de Conectores Lógicos Nivel 2A
          </h1>
          <p className="text-slate-400 mb-8">
            Demuestra tu dominio sobre los conectores textuales y mejora tu redacción.
          </p>

          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 text-left">
                Tu Nombre y Apellido
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center group"
            >
              Comenzar Reto
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700 text-sm text-slate-400">
            ¿Eres profesor? {" "}
            <a href="/admin/login" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
              Acceso Administrativo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
