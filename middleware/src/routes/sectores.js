const express = require('express');
const router = express.Router();
const { getSectores } = require('../soapClient');

router.get('/', async (req, res) => {
  const { empresa, usuario } = req.query;
  if (!empresa || !usuario)
    return res.status(400).json({ error: 'Faltan parámetros: empresa, usuario' });

  try {
    const text = await getSectores(empresa, usuario);

    // Respuesta: pares <string>codigo</string><string>nombresector</string>
    const matches = text.match(/<string[^>]*>([^<]*)<\/string>/g) || [];
    const raw = matches.map(s => s.replace(/<\/?string[^>]*>/g, ''));

    // raw[0] = "1" (ok) o "0" (error), raw[1] = "Sector1|Sector2|..."
    if (!raw[0] || raw[0] === '0') {
      return res.status(400).json({ error: raw[1] || 'Error al obtener sectores' });
    }

    const sectores = (raw[1] || '')
      .split('|')
      .map(s => s.trim())
      .filter(Boolean)
      .map(nombre => ({ codigo: nombre, nombre }));

    return res.json({ success: true, sectores });
  } catch (err) {
    console.error('getSectores error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
