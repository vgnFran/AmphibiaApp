import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface Session {
  tokens: string[];
  empresa: string;
  usuario: string;
}

interface AuthContextType {
  session: Session | null;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function save(key: string, value: string) {
  if (Platform.OS === 'web') localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

async function remove(key: string) {
  if (Platform.OS === 'web') localStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  async function signIn(newSession: Session) {
    await save('session', JSON.stringify(newSession));
    setSession(newSession);
  }

  async function signOut() {
    await remove('session');
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
