const express = require('express');
const router = express.Router();
const { setNormalizar } = require('../soapClient');

router.get('/', async (req, res) => {
  const { empresa, usuario, campo } = req.query;
  if (!empresa || !usuario || !campo)
    return res.status(400).json({ error: 'Faltan parámetros: empresa, usuario, campo' });

  try {
    const text = await setNormalizar(empresa, usuario, campo);

    const matches = text.match(/<string[^>]*>([^<]*)<\/string>/g) || [];
    const raw = matches.map(s => s.replace(/<\/?string[^>]*>/g, ''));

    if (!raw[0] || raw[0] === '0') {
      return res.status(400).json({ error: raw[1] || 'Error al obtener opciones' });
    }

    const opciones = (raw[1] || '')
      .split('*')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.includes('|') ? s.split('|')[1]?.trim() : s)
      .filter(Boolean);

    return res.json({ success: true, opciones });
  } catch (err) {
    console.error('setNormalizar error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
