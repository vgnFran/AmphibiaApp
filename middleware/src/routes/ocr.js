const express = require('express');
const router = express.Router();
const tesseract = require('node-tesseract-ocr');
const sharp = require('sharp');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const tesseractConfig = {
  lang: 'spa+eng',
  oem: 1,
  psm: 3,
  binary: 'D:\\Tesseract\\tesseract.exe',
};

async function extraerTextoConTesseract(imageBase64) {
  const tmpInput = path.join(os.tmpdir(), `ocr_in_${Date.now()}.png`);
  const tmpOutput = path.join(os.tmpdir(), `ocr_out_${Date.now()}.png`);

  try {
    const buffer = Buffer.from(imageBase64, 'base64');

    await sharp(buffer)
      .grayscale()
      .normalize()
      .sharpen()
      .resize({ width: 2000, withoutEnlargement: false })
      .png()
      .toFile(tmpOutput);

    const text = await tesseract.recognize(tmpOutput, tesseractConfig);
    return text.trim();
  } finally {
    [tmpInput, tmpOutput].forEach(f => { try { fs.unlinkSync(f); } catch {} });
  }
}

async function interpretarConIA(textoOcr, campos) {
  const camposList = campos.map(c => `- "${c.campo}"`).join('\n');

  const prompt = `Sos un asistente de clasificación documental para una empresa argentina.
  Se extrajo el siguiente texto de un documento mediante OCR:

  ---
  ${textoOcr}
  ---

  Tu tarea es identificar qué valor corresponde a cada uno de estos campos del formulario:
  ${camposList}

  Respondé ÚNICAMENTE con un JSON válido con el formato:
  { "nombre_del_campo": "valor_extraido", ... }

  Donde "nombre_del_campo" es exactamente el nombre del campo tal como aparece en la lista, y "valor_extraido" es el texto que encontraste en el documento para ese campo.
  Si no podés determinar el valor de un campo, dejá el string vacío "".
  No agregues explicaciones, solo el JSON.`;

  const response = await client.chat.completions.create({
    model: 'google/gemma-4-31b-it:free',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.choices[0].message.content.trim();
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const porNombre = JSON.parse(clean);

  // Convertir de { nombre: valor } a { orden: valor }
  const porOrden = {};
  campos.forEach(c => {
    const valor = porNombre[c.campo];
    if (valor !== undefined) porOrden[c.orden] = valor;
  });
  return porOrden;
}

router.post('/', async (req, res) => {
  const { imageBase64, campos } = req.body;

  if (!imageBase64 || !campos || !Array.isArray(campos)) {
    return res.status(400).json({ error: 'Faltan campos: imageBase64, campos[]' });
  }

  try {
    // Paso 1: OCR con Tesseract
    console.log('[OCR] Extrayendo texto con Tesseract...');
    const textoOcr = await extraerTextoConTesseract(imageBase64);
    console.log('[OCR] Texto extraído:', textoOcr.substring(0, 200));

    if (!textoOcr || textoOcr.length < 10) {
      return res.status(422).json({ error: 'No se pudo extraer texto de la imagen. Intentá con mejor iluminación.' });
    }

    // Paso 2: Interpretación con IA (solo texto, sin imagen)
    console.log('[OCR] Interpretando campos con IA...');
    const valores = await interpretarConIA(textoOcr, campos);

    return res.json({ success: true, valores, textoOcr });
  } catch (err) {
    console.error('[OCR] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
