"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                // En una app real, el backend enviaría una cookie HTTP-only con un JWT
                // y este auth state no dependería de localStorage.
                localStorage.setItem("admin_auth", "true");
                router.push("/admin");
            } else {
                const data = await res.json();
                setError(data.message || "Contraseña incorrecta");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
                <div className="p-8 sm:p-10">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 bg-blue-900/30 rounded-full flex items-center justify-center ring-1 ring-blue-500/50">
                            <Lock className="h-8 w-8 text-blue-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-slate-100 mb-8">
                        Acceso Profesores
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Contraseña Administrativa
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none pr-12"
                                    placeholder="Ingresa la contraseña"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/30 text-red-400 text-sm rounded-lg border border-red-800/50">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${loading
                                ? "bg-blue-900/50 text-blue-200 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg ring-1 ring-blue-500/50"
                                }`}
                        >
                            {loading ? "Verificando..." : "Ingresar al Panel"}
                        </button>
                        <div className="text-center mt-4">
                            <Link href="/" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
                                Volver al inicio
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
