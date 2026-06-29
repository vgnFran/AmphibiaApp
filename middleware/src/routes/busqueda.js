const express = require('express');
const router = express.Router();
const { getDocumentoConsulta } = require('../soapClient');

router.post('/', async (req, res) => {
  const { empresa, usuario, documento, valores } = req.body;

  if (!empresa || !usuario || !documento) {
    return res.status(400).json({ error: 'Faltan campos: empresa, usuario, documento' });
  }

  try {
    // Formato: "orden=valororden=valor" — concatenado sin separador entre pares
    const camposStr = Object.entries(valores || {})
      .filter(([_, valor]) => valor !== '' && valor !== null && valor !== undefined)
      .map(([orden, valor]) => `${orden}=${valor}`)
      .join('');

    console.log('[busqueda] documento:', documento);
    console.log('[busqueda] camposStr:', camposStr);

    const text = await getDocumentoConsulta(empresa, usuario, documento, camposStr);

    console.log('[busqueda] respuesta SOAP completa:', text);

    return res.json({ success: true, resultados: [], _raw: text });

  } catch (err) {
    console.error('[busqueda] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
