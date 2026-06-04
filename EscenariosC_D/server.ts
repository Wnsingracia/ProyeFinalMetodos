/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const port = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Set up the server Gemini client using recommended SDK
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

  // Numerical Methods & Economic Report Generator API endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { productName, unit, points, targetDay, interpolatedValues } = req.body;

      if (!productName || !points) {
        return res.status(400).json({ error: "Faltan parámetros requeridos (productName, points)." });
      }

      const lagrangeVal = typeof interpolatedValues.lagrange === 'number' ? interpolatedValues.lagrange.toFixed(2) : "N/A";
      const newtonVal = typeof interpolatedValues.newton === 'number' ? interpolatedValues.newton.toFixed(2) : "N/A";
      const splineVal = typeof interpolatedValues.splines === 'number' ? interpolatedValues.splines.toFixed(2) : "N/A";

      if (!ai) {
        // Fallback info panel when Gemini Key is absent
        const localReport = `### ⚠️ API Key de Gemini No Configurada
Por favor, configura tu \`GEMINI_API_KEY\` en el panel de **Settings > Secrets** para obtener un reporte socio-económico con análisis de métodos numéricos completo impulsado por Inteligencia Artificial.

#### Análisis Matemático de Respaldo por Consola:
- **Producto Seleccionado:** ${productName} (Unidad: ${unit})
- **Puntos Registrados:** ${points.length} días de muestreo.
- **Día de Estimación Seleccionado:** Día ${targetDay}
- **Valor interpolado por Lagrange:** ${lagrangeVal} Bs
- **Valor interpolado por Newton:** ${newtonVal} Bs (Coincide idénticamente con el polinomio de Lagrange)
- **Valor interpolado por Trazadores Cúbicos (Splines):** ${splineVal} Bs

*Nota Teórica:* Los trazadores cúbicos (Spline Cúbico Natural) son infinitamente mejores para simular dinámicas sociales porque minimizan el esfuerzo de flexión total de la curva. Esto evita el fenómeno de oscilación extrema (Efecto de Runge) típico de Lagrange y Newton de alto grado.`;

        return res.json({ report: localReport });
      }

      const prompt = `Actúa como un experto en Métodos Numéricos y Analista Socioeconómico.
Se te presentan los siguientes datos sobre la variación de precios en mercados bolivianos para el producto alimentario de primera necesidad "${productName}" (unidad: ${unit}) bajo un escenario de desabastecimiento de alimentos y curva de precios dispersos (Escenario C).

Datos reales de precios recopilados (Días y precios en Bs):
${points.map((p: any) => `- Día ${p.x}: ${p.y} Bs`).join("\n")}

Se ha realizado una estimación matemática del precio para el día ${targetDay} usando tres métodos numéricos de interpolación:
1. Interpolación polinomial de Lagrange: ${lagrangeVal} Bs
2. Interpolación de Newton (Diferencias Divididas): ${newtonVal} Bs
3. Trazadores Cúbicos Naturales (Cubic Splines): ${splineVal} Bs

Por favor, elabora un informe profesional, detallado y riguroso en español organizado en las siguientes secciones markdown con títulos atractivos y académicos:

1. **Análisis de la Tendencia Alimentaria y Poder Adquisitivo:** Analiza la curva de precios de la ${productName} durante el mes de acuerdo a la dirección y concavidad de la curva. ¿Se observa un incremento alarmante que impacte severamente a las familias bolivianas? Explica la relación del desabastecimiento con la pérdida de poder adquisitivo.
2. **Comparativa Científica de los Métodos Numéricos:** Compara Lagrange, Newton y Splines. Explica por qué Lagrange y Newton dan exactamente el mismo valor matemático (por el teorema de unicidad del polinomio interpolador) pero por qué los Splines Cúbicos Naturales son superiores y más plausibles físicamente para modelar variaciones de mercado real. Habla sobre cómo la dispersión de datos afecta la estabilidad del polinomio de alto grado (Fenómeno de Runge).
3. **Evaluación Concreta de Predicción para el Día ${targetDay}:** Indica cuál de las estimaciones considera más realista y por qué.
4. **Propuestas de Mitigación basadas en Modelado Matemático:** Sin emitir juicios ni discursos políticos, provee dos estrategias prácticas basadas en la analítica de datos para la toma de decisiones (por ejemplo, sistemas inteligentes de previsión logística de stock, optimización de rutas de transporte de comida, o establecimiento de precios de referencia usando interpolación).

Mantén un lenguaje impecable, técnico y pedagógico. Evita metáforas floridas exageradas; mantén la elegancia académica.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ report: response.text });
    } catch (e: any) {
      console.error("Gemini call error:", e);
      res.status(500).json({ error: "Error interno al procesar el reporte de la IA.", details: e.message });
    }
  });

  // Serve static UI assets to avoid server.tsx from blocking Vite dev/prod cycles
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`[FULLSTACK] Server running on http://localhost:${port}`);
  });
}

startServer();
