const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export type AuthUser = {
  name: string;
  surname: string;
  picture: string | null;
};

export type AuthResponse = AuthUser & { token: string };

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await response.text();
  const data: unknown = body ? JSON.parse(body) : undefined;

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String(data.message)
        : 'Não foi possível concluir a solicitação.';
    throw new Error(message);
  }

  return data as T;
}

export function signIn(email: string, password: string) {
  return apiRequest<AuthResponse>('/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function signUp(input: {
  name: string;
  surname: string;
  email: string;
  password: string;
}) {
  return apiRequest<AuthResponse>('/signup', {
    method: 'POST',
    body: JSON.stringify({ ...input, picture: null }),
  });
}