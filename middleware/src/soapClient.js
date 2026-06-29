const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const SOAP_URL = 'https://amphibiaqa.digitrack.com.ar/webservice/amphibiawebservice.asmx';
const NS = 'https://amphibiaqa.digitrack.com.ar/webservice/';

// Almacena la cookie de sesión ASP.NET por empresa+usuario
const sessions = new Map();

function sessionKey(empresa, usuario) {
  return `${empresa}|${usuario}`;
}

async function soapPost(action, body, sessionCookie = null) {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>${body}</soap:Body>
</soap:Envelope>`;

  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': `"${NS}${action}"`,
  };
  if (sessionCookie) headers['Cookie'] = sessionCookie;

  const response = await fetch(SOAP_URL, { method: 'POST', headers, body: xml });
  const text = await response.text();
  const cookie = response.headers.get('set-cookie');
  return { text, cookie };
}

async function autenticar(empresa, usuario, contrasena) {
  const body = `<Autenticar xmlns="${NS}">
      <Empresa>${empresa}</Empresa>
      <Usuario>${usuario}</Usuario>
      <Contraseña>${contrasena}</Contraseña>
      <modulo>Modulo Web</modulo>
    </Autenticar>`;

  const { text, cookie } = await soapPost('Autenticar', body);
  const matches = text.match(/<string[^>]*>([^<]*)<\/string>/g) || [];
  const tokens = matches.map(s => s.replace(/<\/?string[^>]*>/g, ''));

  if (!tokens.length || tokens[0] === '0') {
    throw new Error(tokens[1] || 'Credenciales inválidas');
  }

  if (cookie) {
    const cookieValue = cookie.split(';')[0].trim();
    sessions.set(sessionKey(empresa, usuario), cookieValue);
  }
  return { tokens, cookie };
}

async function getSectores(empresa, usuario) {
  const cookie = sessions.get(sessionKey(empresa, usuario));
  const body = `<getSectores xmlns="${NS}" />`;
  const { text } = await soapPost('getSectores', body, cookie);
  return text;
}

async function getDocumentos(empresa, usuario, sector) {
  const cookie = sessions.get(sessionKey(empresa, usuario));
  const body = `<getDocumentos xmlns="${NS}"><sector>${sector}</sector></getDocumentos>`;
  const { text } = await soapPost('getDocumentos', body, cookie);
  return text;
}

async function setNormalizar(empresa, usuario, campo) {
  const cookie = sessions.get(sessionKey(empresa, usuario));
  const body = `<setNormalizar xmlns="${NS}">
      <Campo>${campo}</Campo>
      <flag>1</flag>
    </setNormalizar>`;
  const { text } = await soapPost('setNormalizar', body, cookie);
  return text;
}

async function getCampos(empresa, usuario, documento) {
  const cookie = sessions.get(sessionKey(empresa, usuario));
  const body = `<getCampos xmlns="${NS}"><documento>${documento}</documento></getCampos>`;
  const { text } = await soapPost('getCampos', body, cookie);
  return text;
}

async function getTipoDoc(empresa, usuario) {
  const cookie = sessions.get(sessionKey(empresa, usuario));
  const body = `<getTipoDoc xmlns="${NS}" />`;
  const { text } = await soapPost('getTipoDoc', body, cookie);
  return text;
}

async function getDocumentoConsulta(empresa, usuario, documento, camposStr) {
  const cookie = sessions.get(sessionKey(empresa, usuario));
  const body = `<getDocumentoConsulta xmlns="${NS}">
      <documento>${documento}</documento>
      <campos>${camposStr}</campos>
    </getDocumentoConsulta>`;
  const { text } = await soapPost('getDocumentoConsulta', body, cookie);
  return text;
}

async function setAddDocumentVersion(empresa, usuario, fileBase64, fileName, camposStr) {
  const cookie = sessions.get(sessionKey(empresa, usuario));
  const body = `<setAddDocumentVersion xmlns="${NS}">
      <file>${fileBase64}</file>
      <FileName>${fileName}</FileName>
      <Campos>${camposStr}</Campos>
    </setAddDocumentVersion>`;
  const { text } = await soapPost('setAddDocumentVersion', body, cookie);
  return text;
}

module.exports = { autenticar, getSectores, getDocumentos, getTipoDoc, getCampos, setNormalizar, setAddDocumentVersion, getDocumentoConsulta };

