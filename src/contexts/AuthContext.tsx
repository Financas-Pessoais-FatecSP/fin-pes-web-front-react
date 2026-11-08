import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import {
  signIn as solicitarLogin,
  signUp as solicitarCadastro,
  type AuthResponse,
  type AuthUser,
} from '../utils/api';

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    surname: string;
    email: string;
    password: string;
  }) => Promise<void>;
  signOut: () => void;
};

const STORAGE_KEY = 'equilibrafin:session:v1';
const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session: unknown = JSON.parse(raw);
    if (
      session &&
      typeof session === 'object' &&
      'token' in session &&
      typeof session.token === 'string'
    ) {
      return session as AuthResponse;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(readSession);

  function saveSession(nextSession: AuthResponse) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  async function signIn(email: string, password: string) {
    saveSession(await solicitarLogin(email, password));
  }

  async function signUp(input: {
    name: string;
    surname: string;
    email: string;
    password: string;
  }) {
    saveSession(await solicitarCadastro(input));
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token: session?.token ?? null,
        user: session
          ? { name: session.name, surname: session.surname, picture: session.picture }
          : null,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return context;
}