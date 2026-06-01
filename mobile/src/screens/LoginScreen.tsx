import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  StatusBar, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';

const G1 = '#01a951';
const G2 = '#00B4CC';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [empresa, setEmpresa] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!empresa.trim() || !usuario.trim() || !contrasena.trim()) {
      setError('Completá todos los campos');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await login(empresa.trim(), usuario.trim(), contrasena.trim());
      await signIn({ tokens: data.tokens, empresa: data.empresa, usuario: data.usuario });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[G1, G1, G2]}
        locations={[0, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Branding */}
        <View style={styles.top}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>Amphibia App</Text>
          <Text style={styles.tagline}>Gestión inteligente de datos</Text>
        </View>

        {/* Card blanca */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>
          <Text style={styles.cardSub}>Ingresá con tu cuenta de Digitrack</Text>

          <Field label="Empresa" value={empresa} onChange={setEmpresa} placeholder="ej: Digitrack" />
          <Field label="Usuario" value={usuario} onChange={setUsuario} placeholder="nombre de usuario" />
          <Field label="Contraseña" value={contrasena} onChange={setContrasena} placeholder="••••••••" secure />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.75 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Ingresar</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© {new Date().getFullYear()} Digitrack · Todos los derechos reservados</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, secure }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, focused && styles.fieldInputFocused]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#b0bec5"
        secureTextEntry={secure}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  top: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 44, height: 82, marginBottom: 16, tintColor: '#fff' },
  appName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.6,
    marginBottom: 5,
  },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.72)', letterSpacing: 0.2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 12,
  },
  cardTitle: { fontSize: 19, fontWeight: '700', color: '#0f172a', letterSpacing: -0.3, marginBottom: 3 },
  cardSub: { fontSize: 13, color: '#94a3b8', marginBottom: 26 },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 11, fontWeight: '600', color: '#64748b',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7,
  },
  fieldInput: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc',
  },
  fieldInputFocused: { borderColor: G1, backgroundColor: '#fff' },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: {
    backgroundColor: G1, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 6,
    shadowColor: G1, shadowOpacity: 0.28, shadowRadius: 10, elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  footer: { textAlign: 'center', marginTop: 28, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
});
