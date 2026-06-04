var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var port = 3e3;
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json());
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  }) : null;
  app.post("/api/analyze", async (req, res) => {
    try {
      const { productName, unit, points, targetDay, interpolatedValues } = req.body;
      if (!productName || !points) {
        return res.status(400).json({ error: "Faltan par\xE1metros requeridos (productName, points)." });
      }
      const lagrangeVal = typeof interpolatedValues.lagrange === "number" ? interpolatedValues.lagrange.toFixed(2) : "N/A";
      const newtonVal = typeof interpolatedValues.newton === "number" ? interpolatedValues.newton.toFixed(2) : "N/A";
      const splineVal = typeof interpolatedValues.splines === "number" ? interpolatedValues.splines.toFixed(2) : "N/A";
      if (!ai) {
        const localReport = `### \u26A0\uFE0F API Key de Gemini No Configurada
Por favor, configura tu \`GEMINI_API_KEY\` en el panel de **Settings > Secrets** para obtener un reporte socio-econ\xF3mico con an\xE1lisis de m\xE9todos num\xE9ricos completo impulsado por Inteligencia Artificial.

#### An\xE1lisis Matem\xE1tico de Respaldo por Consola:
- **Producto Seleccionado:** ${productName} (Unidad: ${unit})
- **Puntos Registrados:** ${points.length} d\xEDas de muestreo.
- **D\xEDa de Estimaci\xF3n Seleccionado:** D\xEDa ${targetDay}
- **Valor interpolado por Lagrange:** ${lagrangeVal} Bs
- **Valor interpolado por Newton:** ${newtonVal} Bs (Coincide id\xE9nticamente con el polinomio de Lagrange)
- **Valor interpolado por Trazadores C\xFAbicos (Splines):** ${splineVal} Bs

*Nota Te\xF3rica:* Los trazadores c\xFAbicos (Spline C\xFAbico Natural) son infinitamente mejores para simular din\xE1micas sociales porque minimizan el esfuerzo de flexi\xF3n total de la curva. Esto evita el fen\xF3meno de oscilaci\xF3n extrema (Efecto de Runge) t\xEDpico de Lagrange y Newton de alto grado.`;
        return res.json({ report: localReport });
      }
      const prompt = `Act\xFAa como un experto en M\xE9todos Num\xE9ricos y Analista Socioecon\xF3mico.
Se te presentan los siguientes datos sobre la variaci\xF3n de precios en mercados bolivianos para el producto alimentario de primera necesidad "${productName}" (unidad: ${unit}) bajo un escenario de desabastecimiento de alimentos y curva de precios dispersos (Escenario C).

Datos reales de precios recopilados (D\xEDas y precios en Bs):
${points.map((p) => `- D\xEDa ${p.x}: ${p.y} Bs`).join("\n")}

Se ha realizado una estimaci\xF3n matem\xE1tica del precio para el d\xEDa ${targetDay} usando tres m\xE9todos num\xE9ricos de interpolaci\xF3n:
1. Interpolaci\xF3n polinomial de Lagrange: ${lagrangeVal} Bs
2. Interpolaci\xF3n de Newton (Diferencias Divididas): ${newtonVal} Bs
3. Trazadores C\xFAbicos Naturales (Cubic Splines): ${splineVal} Bs

Por favor, elabora un informe profesional, detallado y riguroso en espa\xF1ol organizado en las siguientes secciones markdown con t\xEDtulos atractivos y acad\xE9micos:

1. **An\xE1lisis de la Tendencia Alimentaria y Poder Adquisitivo:** Analiza la curva de precios de la ${productName} durante el mes de acuerdo a la direcci\xF3n y concavidad de la curva. \xBFSe observa un incremento alarmante que impacte severamente a las familias bolivianas? Explica la relaci\xF3n del desabastecimiento con la p\xE9rdida de poder adquisitivo.
2. **Comparativa Cient\xEDfica de los M\xE9todos Num\xE9ricos:** Compara Lagrange, Newton y Splines. Explica por qu\xE9 Lagrange y Newton dan exactamente el mismo valor matem\xE1tico (por el teorema de unicidad del polinomio interpolador) pero por qu\xE9 los Splines C\xFAbicos Naturales son superiores y m\xE1s plausibles f\xEDsicamente para modelar variaciones de mercado real. Habla sobre c\xF3mo la dispersi\xF3n de datos afecta la estabilidad del polinomio de alto grado (Fen\xF3meno de Runge).
3. **Evaluaci\xF3n Concreta de Predicci\xF3n para el D\xEDa ${targetDay}:** Indica cu\xE1l de las estimaciones considera m\xE1s realista y por qu\xE9.
4. **Propuestas de Mitigaci\xF3n basadas en Modelado Matem\xE1tico:** Sin emitir juicios ni discursos pol\xEDticos, provee dos estrategias pr\xE1cticas basadas en la anal\xEDtica de datos para la toma de decisiones (por ejemplo, sistemas inteligentes de previsi\xF3n log\xEDstica de stock, optimizaci\xF3n de rutas de transporte de comida, o establecimiento de precios de referencia usando interpolaci\xF3n).

Mant\xE9n un lenguaje impecable, t\xE9cnico y pedag\xF3gico. Evita met\xE1foras floridas exageradas; mant\xE9n la elegancia acad\xE9mica.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      res.json({ report: response.text });
    } catch (e) {
      console.error("Gemini call error:", e);
      res.status(500).json({ error: "Error interno al procesar el reporte de la IA.", details: e.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`[FULLSTACK] Server running on http://localhost:${port}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
