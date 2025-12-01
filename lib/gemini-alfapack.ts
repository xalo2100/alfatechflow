import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiApiKey } from "./gemini";

export async function generarReporteTecnicoAlfapack(notas: string) {
  console.log("🚀 Iniciando generación con Gemini Alfapack...");

  // Obtener API key de forma segura desde la base de datos o variables de entorno
  const apiKey = await getGeminiApiKey();

  try {
    // 3. INICIALIZACIÓN DE GEMINI
    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos el modelo flash que es más rápido y barato
    // Usamos el modelo clásico gemini-pro que siempre funciona
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 4. EL PROMPT DE INGENIERÍA (Ajustado a tu reporte Alfapack)
    const prompt = `
      Eres un experto técnico de Alfapack.
      Basa tu respuesta en estas notas informales: "${notas}".
      
      Genera un JSON estricto con estos 3 campos para el reporte técnico:
      - diagnostico: (Texto técnico formal describiendo el problema detectado)
      - trabajoRealizado: (Descripción profesional de la solución aplicada, ej: cambio de flexible)
      - observacion: (Estado final del equipo y recomendaciones cortas)

      RESPONDER SOLO EL JSON.
    `;

    console.log("Envio a Gemini...", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 5. LIMPIEZA Y PARSEO (Crítico para evitar errores de formato)
    const jsonString = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonString);

    console.log("✅ Respuesta recibida:", data);
    return data;

  } catch (error: any) {
    console.error("🔥 Error en Gemini Alfapack:", error);
    // Relanzamos el error para que la UI muestre el mensaje bonito si quieres
    throw new Error(`Fallo en IA: ${error.message}`);
  }
}