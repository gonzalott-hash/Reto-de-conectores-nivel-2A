import { create } from 'zustand';

export type EjercicioBase = {
    id: number;
    enunciado_incorrecto: string;
    opciones: string[];
    conector_correcto: string;
    explicacion: string;
};

export type RespuestaUsuario = {
    ejercicioId: number;
    respuestaSeleccionada: string;
    tiempoTomadoEnSegundos: number;
};

type GameState = {
    nombreAlumno: string;
    ejercicios: EjercicioBase[];
    ejercicioActualIndex: number;
    respuestas: RespuestaUsuario[];
    temporizadorActivo: boolean;
    tiempoRestante: number; // en segundos
    tiempoTotalConfigurado: number; // en segundos

    // Acciones
    setNombreAlumno: (nombre: string) => void;
    iniciarReto: (ejercicios: EjercicioBase[], tiempoTotalMinutos: number) => void;
    responderEjercicio: (respuesta: RespuestaUsuario) => void;
    tickTemporizador: () => void;
    finalizarReto: () => void;
    resetearReto: () => void;
};

export const useGameStore = create<GameState>((set) => ({
    nombreAlumno: "",
    ejercicios: [],
    ejercicioActualIndex: 0,
    respuestas: [],
    temporizadorActivo: false,
    tiempoRestante: 0,
    tiempoTotalConfigurado: 0,

    setNombreAlumno: (nombre) => set({ nombreAlumno: nombre }),

    iniciarReto: (ejercicios, tiempoTotalMinutos) => set({
        ejercicios,
        tiempoTotalConfigurado: tiempoTotalMinutos * 60,
        tiempoRestante: tiempoTotalMinutos * 60,
        ejercicioActualIndex: 0,
        respuestas: [],
        temporizadorActivo: true
    }),

    responderEjercicio: (respuesta) => set((state) => {
        const isEightyPercentFinished = state.ejercicioActualIndex >= state.ejercicios.length - 1;

        return {
            respuestas: [...state.respuestas, respuesta],
            ejercicioActualIndex: state.ejercicioActualIndex + 1,
            // Si era el último, detenemos el tiempo
            temporizadorActivo: !isEightyPercentFinished
        };
    }),

    tickTemporizador: () => set((state) => {
        if (state.tiempoRestante <= 0) {
            return { temporizadorActivo: false, tiempoRestante: 0 };
        }
        return { tiempoRestante: state.tiempoRestante - 1 };
    }),

    finalizarReto: () => set({ temporizadorActivo: false }),

    resetearReto: () => set({
        ejercicios: [],
        ejercicioActualIndex: 0,
        respuestas: [],
        temporizadorActivo: false,
        tiempoRestante: 0
    })
}));
