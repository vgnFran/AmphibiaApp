const MIDDLEWARE_URL = 'http://192.168.1.50:3000';

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

// Mensajes de error amigables
function friendlyError(err: any, contexto: string): Error {
  const msg: string = err?.message || '';

  if (msg.includes('Network request failed') || msg.includes('fetch'))
    return new Error('No se pudo conectar con el servidor. Verificá tu conexión a internet.');
  if (msg.includes('timeout') || msg.includes('AbortError'))
    return new Error('El servidor tardó demasiado en responder. Intentá de nuevo.');
  if (msg.includes('Credenciales inválidas') || msg.includes('credencial'))
    return new Error('Usuario, empresa o contraseña incorrectos.');
  if (msg.includes('no encontr') || msg.includes('Not Found'))
    return new Error(`No se encontraron datos para ${contexto}.`);
  if (msg.includes('Object reference') || msg.includes('NullReference'))
    return new Error('Sesión expirada. Por favor volvé a iniciar sesión.');
  if (msg.includes('permission') || msg.includes('autoriza') || msg.includes('acceso'))
    return new Error('No tenés permisos para acceder a este recurso.');
  if (msg.includes('500') || msg.includes('Internal'))
    return new Error('Error en el servidor. Si persiste, contactá a soporte.');

  return new Error(msg || `Error al ${contexto}. Intentá de nuevo.`);
}

// Fetch con timeout y reintentos automáticos
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err: any) {
      clearTimeout(timer);
      const isLast = attempt === retries;
      const isTimeout = err?.name === 'AbortError';
      const isNetwork = err?.message?.includes('Network request failed');

      if (isLast || (!isTimeout && !isNetwork)) throw err;
      // Espera breve antes de reintentar
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error('timeout');
}

export interface Sector {
  codigo: string;
  nombre: string;
}

export async function login(empresa: string, usuario: string, contrasena: string) {
  try {
    const response = await fetchWithRetry(`${MIDDLEWARE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, usuario, contrasena }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');
    return data;
  } catch (err) {
    throw friendlyError(err, 'iniciar sesión');
  }
}

export async function getSectores(empresa: string, usuario: string): Promise<Sector[]> {
  try {
    const params = new URLSearchParams({ empresa, usuario });
    const response = await fetchWithRetry(`${MIDDLEWARE_URL}/api/sectores?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.sectores;
  } catch (err) {
    throw friendlyError(err, 'cargar los sectores');
  }
}

export interface Documento {
  codigo: string;
  nombre: string;
}

export async function getDocumentos(empresa: string, usuario: string, sector: string): Promise<Documento[]> {
  try {
    const params = new URLSearchParams({ empresa, usuario, sector });
    const response = await fetchWithRetry(`${MIDDLEWARE_URL}/api/documentos?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.documentos;
  } catch (err) {
    throw friendlyError(err, 'cargar los documentos');
  }
}

export interface TipoDoc {
  codigo: string;
  nombre: string;
}

export async function getTipoDoc(empresa: string, usuario: string): Promise<TipoDoc[]> {
  try {
    const params = new URLSearchParams({ empresa, usuario });
    const response = await fetchWithRetry(`${MIDDLEWARE_URL}/api/tipodoc?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.tipoDoc;
  } catch (err) {
    throw friendlyError(err, 'cargar tipos de documento');
  }
}

export interface Campo {
  campo: string;
  tipo: string;
  tam: string;
  prec: string;
  pk: string;
  requerido: boolean;
  clase: string;
  process: string;
  valid: string;
  normal: string;
  orden: string;
  estado: boolean;
  createoptions: string;
}

export async function getNormalizar(empresa: string, usuario: string, campo: string): Promise<string[]> {
  try {
    const params = new URLSearchParams({ empresa, usuario, campo });
    const response = await fetchWithRetry(`${MIDDLEWARE_URL}/api/normalizar?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.opciones;
  } catch (err) {
    throw friendlyError(err, 'cargar las opciones');
  }
}

export async function getCampos(empresa: string, usuario: string, documento: string): Promise<Campo[]> {
  try {
    const params = new URLSearchParams({ empresa, usuario, documento });
    const response = await fetchWithRetry(`${MIDDLEWARE_URL}/api/campos?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.campos;
  } catch (err) {
    throw friendlyError(err, 'cargar los campos');
  }
}

export async function ocrImagen(
  imageBase64: string,
  campos: { campo: string; orden: string }[]
): Promise<Record<string, string>> {
  try {
    const response = await fetchWithRetry(`${MIDDLEWARE_URL}/api/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, campos }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.valores;
  } catch (err) {
    throw friendlyError(err, 'procesar la imagen');
  }
}

export interface ResultadoBusqueda {
  nombreDocumento?: string;
  campos: { nombre: string; valor: string }[];
}

export async function buscarDocumentos(
  empresa: string,
  usuario: string,
  documento: string,
  valores: Record<string, string>
): Promise<ResultadoBusqueda[]> {
  try {
    const response = await fetchWithRetry(`${MIDDLEWARE_URL}/api/busqueda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, usuario, documento, valores }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.resultados;
  } catch (err) {
    throw friendlyError(err, 'realizar la búsqueda');
  }
}

export async function uploadClasificacion(
  empresa: string,
  usuario: string,
  imageBase64: string,
  fileName: string,
  valores: Record<string, string>
): Promise<string> {
  try {
    const response = await fetchWithRetry(
      `${MIDDLEWARE_URL}/api/clasificaciones`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, usuario, imageBase64, fileName, valores }),
      },
      0 // sin reintentos para el upload (evitar clasificaciones duplicadas)
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.mensaje;
  } catch (err) {
    throw friendlyError(err, 'guardar la clasificación');
  }
}
