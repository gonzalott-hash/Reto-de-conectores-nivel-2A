import { getDb } from './db.js';

const EJERCICIOS_INICIALES = [
    {
        enunciado_incorrecto: "Los equipos trabajaron arduamente durante meses; __________ no lograron alcanzar los objetivos establecidos para este semestre.",
        opciones: ["Además", "por lo tanto", "sin embargo", "asimismo", "en consecuencia"],
        conector_correcto: "sin embargo",
        explicacion: "Indica contraste entre el trabajo arduo y el no lograr los objetivos."
    },
    {
        enunciado_incorrecto: "Debemos ahorrar energía en casa, __________ contribuiremos activamente a la protección del medio ambiente global.",
        opciones: ["pero", "así", "no obstante", "aunque", "sino"],
        conector_correcto: "así",
        explicacion: "Indica consecuencia o modo en el que se contribuye al medio ambiente."
    },
    {
        enunciado_incorrecto: "El estudio es fundamental para el éxito; __________, es necesario mantener un equilibrio con la vida personal.",
        opciones: ["asimismo", "pues", "porque", "ya que", "mientas"],
        conector_correcto: "asimismo",
        explicacion: "Añade información de igual importancia a la idea principal."
    },
    {
        enunciado_incorrecto: "No pudo asistir a la reunión importante __________ se encontraba fuera de la ciudad por motivos personales.",
        opciones: ["pero", "aunque", "porque", "sino", "si bien"],
        conector_correcto: "porque",
        explicacion: "Introduce la causa o razón de no asistir a la reunión."
    },
    {
        enunciado_incorrecto: "Juan es un excelente profesional; __________, su calidad humana es admirada por todos sus compañeros cercanos.",
        opciones: ["además", "pero", "sin embargo", "aunque", "sino que"],
        conector_correcto: "además",
        explicacion: "Añade una cualidad positiva a la idea anterior."
    },
    {
        enunciado_incorrecto: "La situación económica es compleja, __________ los expertos sugieren mantener la calma y actuar con mucha cautela.",
        opciones: ["pues", "por lo tanto", "ya que", "porque", "como"],
        conector_correcto: "por lo tanto",
        explicacion: "Introduce una consecuencia o conclusión de la situación descrita."
    },
    {
        enunciado_incorrecto: "No compró el coche rojo __________ el azul, que tenía un precio mucho más accesible para él.",
        opciones: ["pero", "aunque", "sino", "mas", "y"],
        conector_correcto: "sino",
        explicacion: "Indica una opción alternativa después de una negación."
    },
    {
        enunciado_incorrecto: "El examen fue bastante difícil; __________, la mayoría de los estudiantes lograron obtener una nota aprobatoria satisfactoria.",
        opciones: ["no obstante", "además", "asimismo", "pues", "porque"],
        conector_correcto: "no obstante",
        explicacion: "Introduce una situación que ocurre a pesar de una objeción."
    },
    {
        enunciado_incorrecto: "Estudia con mucha dedicación cada día, __________ pretende obtener una beca para realizar sus estudios de posgrado.",
        opciones: ["ya que", "pero", "aunque", "sino", "no obstante"],
        conector_correcto: "ya que",
        explicacion: "Introduce la causa o motivo de su dedicación al estudio."
    },
    {
        enunciado_incorrecto: "Había mucha gente en la plaza; __________, se sentía un silencio profundo que sorprendía a los transeúntes.",
        opciones: ["además", "asimismo", "sin embargo", "por consiguiente", "así que"],
        conector_correcto: "sin embargo",
        explicacion: "Indica un contraste inesperado entre la multitud y el silencio."
    }
];

async function setup() {
    const db = await getDb();

    console.log('Creando tabla ejercicios_n2...');
    await db.run(`
    CREATE TABLE IF NOT EXISTS ejercicios_n2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enunciado_incorrecto TEXT NOT NULL,
      opciones TEXT NOT NULL,
      conector_correcto TEXT NOT NULL,
      explicacion TEXT NOT NULL,
      es_activo BOOLEAN NOT NULL DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

    const countQuery = await db.get('SELECT COUNT(*) as count FROM ejercicios_n2');

    if (countQuery && Number(countQuery.count) === 0) {
        console.log('Poblando base de datos con ejercicios iniciales...');
        const insertStatement = await db.prepare(
            'INSERT INTO ejercicios_n2 (enunciado_incorrecto, opciones, conector_correcto, explicacion) VALUES (?, ?, ?, ?)'
        );

        for (const ejercicio of EJERCICIOS_INICIALES) {
            await insertStatement.run(
                ejercicio.enunciado_incorrecto,
                JSON.stringify(ejercicio.opciones),
                ejercicio.conector_correcto,
                ejercicio.explicacion
            );
        }
        await insertStatement.finalize();
        console.log('Ejercicios insertados.');
    } else {
        console.log('La base de datos ya contiene ejercicios.');
    }

    console.log('Setup completado.');
}

setup().catch(console.error);
