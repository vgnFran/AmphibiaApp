const express = require('express');
const router = express.Router();
const { getTipoDoc } = require('../soapClient');

router.get('/', async (req, res) => {
  const { empresa, usuario } = req.query;
  if (!empresa || !usuario)
    return res.status(400).json({ error: 'Faltan parámetros: empresa, usuario' });

  try {
    const text = await getTipoDoc(empresa, usuario);

    const matches = text.match(/<string[^>]*>([^<]*)<\/string>/g) || [];
    const raw = matches.map(s => s.replace(/<\/?string[^>]*>/g, ''));

    if (!raw[0] || raw[0] === '0') {
      return res.status(400).json({ error: raw[1] || 'Error al obtener tipos de documento' });
    }

    const tipoDoc = (raw[1] || '')
      .split('|')
      .map(s => s.trim())
      .filter(Boolean)
      .map(nombre => ({ codigo: nombre, nombre }));

    return res.json({ success: true, tipoDoc });
  } catch (err) {
    console.error('getTipoDoc error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
