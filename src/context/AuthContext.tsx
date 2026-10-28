import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  watchAuth,
  authenticateAccount,
  logoutAccount,
  type AuthUser,
} from '../services/auth';
import { auth, errorMessage } from '../services/firebase';
import { startPresence } from '../services/chat';
interface Value {
  user: AuthUser | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  presenceError: string;
}
const Context = createContext<Value | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const [presenceError, setPresenceError] = useState('');
  const authenticating = useRef(false);
  const stopPresence = useRef<(() => Promise<void>) | null>(null);
  useEffect(
    () =>
      auth
        ? watchAuth(u => {
            if (!authenticating.current) {
              setUser(u);
              setLoading(false);
            }
          })
        : undefined,
    [],
  );
  useEffect(() => {
    setPresenceError('');
    if (!user) {
      return;
    }
    const stop = startPresence(user.uid, e =>
      setPresenceError(errorMessage(e)),
    );
    stopPresence.current = stop;
    return () => {
      stopPresence.current = null;
      stop().catch(() => {});
    };
  }, [user]);
  async function authenticate(email: string, password: string, name?: string) {
    authenticating.current = true;
    try {
      setUser(await authenticateAccount(email, password, name));
    } catch (e) {
      await logoutAccount().catch(() => {});
      setUser(null);
      throw e;
    } finally {
      authenticating.current = false;
    }
  }
  async function logout() {
    // Remove the session while still authenticated; onDisconnect remains the crash fallback.
    await stopPresence.current?.();
    await logoutAccount();
  }
  return (
    <Context.Provider
      value={{
        user,
        loading,
        isLoggedIn: !!user,
        login: (email, password) => authenticate(email, password),
        register: (name, email, password) =>
          authenticate(email, password, name),
        logout,
        presenceError,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) {
    throw new Error('Thiếu AuthProvider');
  }
  return value;
}
