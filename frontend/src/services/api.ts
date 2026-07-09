const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Erro na comunicação com a API');
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
