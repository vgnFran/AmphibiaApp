const express = require('express');
const router = express.Router();
const { getDocumentos } = require('../soapClient');

router.get('/', async (req, res) => {
  const { empresa, usuario, sector } = req.query;
  if (!empresa || !usuario || !sector)
    return res.status(400).json({ error: 'Faltan parámetros: empresa, usuario, sector' });

  try {
    const text = await getDocumentos(empresa, usuario, sector);

    const matches = text.match(/<string[^>]*>([^<]*)<\/string>/g) || [];
    const raw = matches.map(s => s.replace(/<\/?string[^>]*>/g, ''));

    // raw[0] = "1" (ok) o "0" (error), raw[1] = "codigo*nombre|codigo*nombre|..."
    if (!raw[0] || raw[0] === '0') {
      return res.status(400).json({ error: raw[1] || 'Error al obtener documentos' });
    }

    const documentos = (raw[1] || '')
      .split('|')
      .map(s => s.trim())
      .filter(Boolean)
      .map(item => {
        const [codigo, nombre] = item.split('*');
        return { codigo: codigo?.trim(), nombre: nombre?.trim() || codigo?.trim() };
      });

    return res.json({ success: true, documentos });
  } catch (err) {
    console.error('getDocumentos error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
