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
