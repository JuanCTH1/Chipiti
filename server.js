const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
const client = new Anthropic();

app.use(express.static(path.join(__dirname)));

app.get("/api/alimento", async (req, res) => {
  const nombre = req.query.nombre?.trim();
  if (!nombre) {
    return res.status(400).json({ error: "Parámetro 'nombre' requerido." });
  }

  const prompt = `Eres un nutricionista experto en índice glucémico. El usuario consulta: "${nombre}".

Responde ÚNICAMENTE con un JSON válido (sin texto adicional) con esta estructura exacta:
{
  "nombre": "nombre del alimento con porción si aplica",
  "color": "rojo" | "amarillo" | "verde",
  "iconos": ["emoji1", "emoji2"],
  "porcion": "porción estándar o la indicada por el usuario",
  "glucosa_nivel": "Alto" | "Medio" | "Bajo",
  "glucosa_valor": "número estimado del índice glucémico (ej. 72)",
  "glucosa_post": "rango estimado de glucosa postprandial (ej. 140-160 mg/dL)",
  "descripcion": "descripción nutricional breve del alimento",
  "recomendacion": "recomendación personalizada de consumo",
  "alternativas": ["alternativa1", "alternativa2", "alternativa3"]
}

Reglas:
- color "rojo" = índice glucémico alto (>70), "amarillo" = medio (56-70), "verde" = bajo (<55)
- iconos: 1-3 emojis relevantes al alimento
- alternativas: 3 alimentos con menor impacto glucémico similares al consultado
- Si no es un alimento, responde: {"error": "No reconozco ese alimento. Por favor intenta con otro."}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].text.trim();
    const data = JSON.parse(text);
    res.json(data);
  } catch (e) {
    if (e instanceof SyntaxError) {
      res.status(500).json({ error: "Error procesando la respuesta. Intenta de nuevo." });
    } else {
      console.error(e);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dr. Chipiti corriendo en http://localhost:${PORT}`);
});
