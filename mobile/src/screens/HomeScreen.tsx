import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const G1 = '#01a951';
const G2 = '#00B4CC';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Gradiente de fondo completo */}
      <LinearGradient
        colors={[G1, G2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Relleno blanco inferior (detrás del scroll) */}
      <View style={styles.bottomFill} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.logoRow}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.logoTitle}>Amphibia App</Text>
            </View>
            <TouchableOpacity onPress={signOut} style={styles.salirBtn}>
              <Text style={styles.salirText}>Salir</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helloLabel}>Bienvenido</Text>
          <Text style={styles.helloName}>{session?.usuario}</Text>
          <View style={styles.companyPill}>
            <Text style={styles.companyText}>{session?.empresa}</Text>
          </View>
        </View>

        {/* Body con fondo blanco y bordes redondeados arriba */}
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}>
          <Text style={styles.sectionLabel}>ACCIONES</Text>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('NuevaClasificacion')}
          >
            <View style={styles.actionIcon}>
              <View style={styles.actionIconDot} />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>Nueva clasificación</Text>
              <Text style={styles.actionDesc}>Clasificá un documento en el sistema</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { marginTop: 32 }]}>PRÓXIMAMENTE</Text>

          {['Consultar documentos', 'Historial de envíos', 'Mis legajos'].map(name => (
            <View key={name} style={styles.disabledCard}>
              <Text style={styles.disabledTitle}>{name}</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>Pronto</Text></View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  bottomFill: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '60%', backgroundColor: '#f8fafc',
  },

  // Header
  headerContent: { padding: 24, paddingTop: 16, paddingBottom: 28 },
  headerTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 16, height: 26, tintColor: '#fff' },
  logoTitle: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  salirBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  salirText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  helloLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '400', marginBottom: 3 },
  helloName: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginBottom: 10 },
  companyPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  companyText: { color: '#fff', fontSize: 12, fontWeight: '500' },

  // Body
  body: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: '#94a3b8',
    letterSpacing: 1, marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 12, elevation: 3,
    borderLeftWidth: 3, borderLeftColor: G1,
  },
  actionIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center',
  },
  actionIconDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: G1,
  },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  actionDesc: { fontSize: 12, color: '#94a3b8' },
  chevron: { fontSize: 22, color: '#cbd5e1' },
  disabledCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, opacity: 0.5,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  disabledTitle: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  badge: { backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
});
