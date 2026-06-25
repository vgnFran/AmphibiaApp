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
  saveBiometricCredentials: (empresa: string, usuario: string, contrasena: string) => Promise<void>;
  getBiometricCredentials: () => Promise<{ empresa: string; usuario: string; contrasena: string } | null>;
  clearBiometricCredentials: () => Promise<void>;
  hasBiometricCredentials: boolean;
  setHasBiometricCredentials: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function save(key: string, value: string) {
  if (Platform.OS === 'web') localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

async function get(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
}

async function remove(key: string) {
  if (Platform.OS === 'web') localStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);

  async function signIn(newSession: Session) {
    await save('session', JSON.stringify(newSession));
    setSession(newSession);
  }

  async function signOut() {
    await remove('session');
    setSession(null);
  }

  async function saveBiometricCredentials(empresa: string, usuario: string, contrasena: string) {
    await save('bio_empresa', empresa);
    await save('bio_usuario', usuario);
    await save('bio_contrasena', contrasena);
    setHasBiometricCredentials(true);
  }

  async function getBiometricCredentials() {
    const empresa = await get('bio_empresa');
    const usuario = await get('bio_usuario');
    const contrasena = await get('bio_contrasena');
    if (!empresa || !usuario || !contrasena) return null;
    return { empresa, usuario, contrasena };
  }

  async function clearBiometricCredentials() {
    await remove('bio_empresa');
    await remove('bio_usuario');
    await remove('bio_contrasena');
    setHasBiometricCredentials(false);
  }

  return (
    <AuthContext.Provider value={{
      session, signIn, signOut,
      saveBiometricCredentials, getBiometricCredentials, clearBiometricCredentials,
      hasBiometricCredentials, setHasBiometricCredentials,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
