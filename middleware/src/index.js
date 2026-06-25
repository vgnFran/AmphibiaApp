require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const sectoresRoutes = require('./routes/sectores');
const documentosRoutes = require('./routes/documentos');
const camposRoutes = require('./routes/campos');
const clasificacionesRoutes = require('./routes/clasificaciones');
const tipodocRoutes = require('./routes/tipodoc');
const normalizarRoutes = require('./routes/normalizar');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/sectores', sectoresRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/campos', camposRoutes);
app.use('/api/tipodoc', tipodocRoutes);
app.use('/api/normalizar', normalizarRoutes);
app.use('/api/clasificaciones', clasificacionesRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Middleware corriendo en http://localhost:${PORT}`);
});
