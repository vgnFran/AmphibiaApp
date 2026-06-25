const MIDDLEWARE_URL = 'http://192.168.1.50:3000';

export interface Sector {
  codigo: string;
  nombre: string;
}

export async function login(empresa: string, usuario: string, contrasena: string) {
  const response = await fetch(`${MIDDLEWARE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ empresa, usuario, contrasena }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');
  return data;
}

export async function getSectores(empresa: string, usuario: string): Promise<Sector[]> {
  const params = new URLSearchParams({ empresa, usuario });
  const response = await fetch(`${MIDDLEWARE_URL}/api/sectores?${params}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al obtener sectores');
  return data.sectores;
}

export interface Documento {
  codigo: string;
  nombre: string;
}

export async function getDocumentos(empresa: string, usuario: string, sector: string): Promise<Documento[]> {
  const params = new URLSearchParams({ empresa, usuario, sector });
  const response = await fetch(`${MIDDLEWARE_URL}/api/documentos?${params}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al obtener documentos');
  return data.documentos;
}

export interface Campo {
  campo: string;         // label del campo
  tipo: string;          // varchar, int, datetime...
  tam: string;           // tamaño máximo
  prec: string;          // precisión
  pk: string;
  requerido: boolean;    // si es obligatorio al clasificar
  clase: string;         // Cedit, Cdatetime...
  process: string;
  valid: string;
  normal: string;
  orden: string;         // identificador para el upload
  estado: boolean;       // visible en el formulario
  createoptions: string; // estilos Windows opcionales
}

export async function getCampos(empresa: string, usuario: string, documento: string): Promise<Campo[]> {
  const params = new URLSearchParams({ empresa, usuario, documento });
  const response = await fetch(`${MIDDLEWARE_URL}/api/campos?${params}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al obtener campos');
  return data.campos;
}

export async function uploadClasificacion(
  empresa: string,
  usuario: string,
  imageBase64: string,
  fileName: string,
  valores: Record<string, string>  // { [orden]: valor }
): Promise<string> {
  const response = await fetch(`${MIDDLEWARE_URL}/api/clasificaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ empresa, usuario, imageBase64, fileName, valores }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al guardar la clasificación');
  return data.mensaje;
}
