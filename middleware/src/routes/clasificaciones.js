const express = require('express');
const router = express.Router();
const { setAddDocumentVersion } = require('../soapClient');

router.post('/', async (req, res) => {
  const { empresa, usuario, imageBase64, fileName, valores } = req.body;

  if (!empresa || !usuario || !imageBase64 || !fileName || !valores) {
    return res.status(400).json({ error: 'Faltan campos: empresa, usuario, imageBase64, fileName, valores' });
  }

  console.log('[clasificar] fileName:', fileName)
  console.log('[clasificar] base64 length:', imageBase64?.length)
  console.log('[clasificar] base64 preview:', imageBase64?.substring(0, 100))
  console.log('[clasificar] tiene saltos de linea:', imageBase64?.includes('\n'))
  console.log('[clasificar] valores:', valores)

  try {

    const camposStr = Object.entries(valores)
      .filter(([_, valor]) => valor !== '')
      .map(([orden, valor]) => `${orden}=${valor}`)
      .join('|');

    console.log('[clasificar] camposStr:', camposStr);

    const text = await setAddDocumentVersion(empresa, usuario, imageBase64, fileName, camposStr);

    const matches = text.match(/<string[^>]*>([^<]*)<\/string>/g) || [];
    const raw = matches.map(s => s.replace(/<\/?string[^>]*>/g, ''));

    if (!raw[0] || raw[0] === '0') {
      return res.status(400).json({ error: raw[1] || 'Error al guardar la clasificación' });
    }

    return res.json({ success: true, mensaje: raw[1] || 'Clasificación guardada correctamente' });
    
  } catch (err) {
    console.error('setAddDocumentVersion error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
