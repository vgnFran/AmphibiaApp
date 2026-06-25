const express = require('express');
const router = express.Router();
const { getCampos, getTipoDoc } = require('../soapClient');

router.get('/', async (req, res) => {
  const { empresa, usuario, documento } = req.query;
  if (!empresa || !usuario || !documento)
    return res.status(400).json({ error: 'Faltan parámetros: empresa, usuario, documento' });

  try {
    const text = await getCampos(empresa, usuario, documento);

    // El webservice requiere que se llame getTipoDoc antes de poder clasificar
    await getTipoDoc(empresa, usuario);

    const matches = text.match(/<string[^>]*>([^<]*)<\/string>/g) || [];
    const raw = matches.map(s => s.replace(/<\/?string[^>]*>/g, ''));

    // raw[0] = "1" siempre, raw[1] = campos separados por *
    if (!raw[1] || !raw[1].trim()) {
      return res.status(404).json({ error: 'No se encontraron campos para el documento indicado' });
    }

    const campos = raw[1]
      .split('*')
      .map(s => s.trim())
      .filter(Boolean)
      .map(item => {
        const p = item.split('|');
        return {
          campo:          p[0]?.trim()  || '',   // label del campo
          tipo:           p[1]?.trim()  || '',   // varchar, int, datetime...
          tam:            p[2]?.trim()  || '',   // tamaño
          prec:           p[3]?.trim()  || '',   // precisión
          pk:             p[4]?.trim()  || '',
          requerido:      p[5]?.trim() === '1',  // true/false
          clase:          p[6]?.trim()  || '',   // Cedit, Cdatetime...
          process:        p[7]?.trim()  || '',
          valid:          p[8]?.trim()  || '',
          normal:         p[9]?.trim()  || '',
          orden:          p[10]?.trim() || '',   // identificador para el upload
          estado:         p[11]?.trim() === '1', // visible
          createoptions:  p.slice(12).join('|'), // WS_VISIBLE|WS_BORDER|...
        };
      });

    return res.json({ success: true, campos });
  } catch (err) {
    console.error('getCampos error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
