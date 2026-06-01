const express = require('express');
const router = express.Router();
const { autenticar } = require('../soapClient');

router.post('/login', async (req, res) => {
  const { empresa, usuario, contrasena } = req.body;
  if (!empresa || !usuario || !contrasena)
    return res.status(400).json({ error: 'Faltan campos: empresa, usuario, contrasena' });

  try {
    const { tokens } = await autenticar(empresa, usuario, contrasena);
    return res.json({ success: true, tokens, empresa, usuario });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
});

module.exports = router;
