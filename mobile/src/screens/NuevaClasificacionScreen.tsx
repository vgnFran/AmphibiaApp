import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getSectores, getDocumentos, Sector, Documento } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GREEN = '#01a951';
const TEAL = '#00B4CC';
const G1 = GREEN;
const G2 = TEAL;

type Step = 1 | 2;

export default function NuevaClasificacionScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();

  const [step, setStep] = useState<Step>(1);

  // Paso 1 — Sector
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loadingSectores, setLoadingSectores] = useState(true);
  const [searchSector, setSearchSector] = useState('');
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [openSector, setOpenSector] = useState(false);

  // Paso 2 — Documento
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchDoc, setSearchDoc] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [openDoc, setOpenDoc] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    getSectores(session.empresa, session.usuario)
      .then(setSectores)
      .catch(e => setError(e.message))
      .finally(() => setLoadingSectores(false));
  }, []);

  function handleSelectSector(sector: Sector) {
    setSelectedSector(sector);
    setSearchSector(sector.nombre);
    setOpenSector(false);
  }

  async function handleContinuarStep1() {
    if (!selectedSector || !session) return;
    setStep(2);
    setLoadingDocs(true);
    setError('');
    try {
      const docs = await getDocumentos(session.empresa, session.usuario, selectedSector.codigo);
      setDocumentos(docs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingDocs(false);
    }
  }

  function handleSelectDoc(doc: Documento) {
    setSelectedDoc(doc);
    setSearchDoc(doc.nombre);
    setOpenDoc(false);
  }

  const filteredSectores = sectores.filter(s =>
    s.nombre.toLowerCase().includes(searchSector.toLowerCase())
  );
  const filteredDocs = documentos.filter(d =>
    d.nombre.toLowerCase().includes(searchDoc.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[G1, G2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />

      {/* Relleno blanco inferior */}
      <View style={styles.bottomFill} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => step === 1 ? navigation.goBack() : setStep(1)}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva clasificación</Text>
          <View style={{ width: 36 }} />
        </View>

      <View style={styles.body}>
        {/* Steps */}
        <View style={styles.stepsRow}>
          {([1, 2, 3] as const).map((n, i) => (
            <React.Fragment key={n}>
              <View style={[styles.step, step >= n && styles.stepActive]}>
                <Text style={[styles.stepNum, step >= n && styles.stepNumActive]}>{n}</Text>
              </View>
              {i < 2 && (
                <View style={[styles.stepLine, step > n && styles.stepLineDone]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* ── PASO 1: Sector ── */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Seleccioná el sector</Text>
            <Text style={styles.stepHint}>Escribí para filtrar por nombre</Text>

            <View style={{ zIndex: 10 }}>
              <View style={[styles.inputRow, openSector && styles.inputRowOpen]}>
                <TextInput
                  style={styles.input}
                  placeholder="Buscar sector..."
                  placeholderTextColor="#c0c7d0"
                  value={searchSector}
                  onChangeText={t => { setSearchSector(t); setOpenSector(true); setSelectedSector(null); }}
                  onFocus={() => setOpenSector(true)}
                />
                {searchSector.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchSector(''); setSelectedSector(null); setOpenSector(false); }}>
                    <Text style={styles.clearBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {openSector && (
                <Dropdown
                  loading={loadingSectores}
                  error={error}
                  items={filteredSectores}
                  selectedCode={selectedSector?.codigo}
                  onSelect={handleSelectSector}
                />
              )}
            </View>

            {selectedSector && !openSector && (
              <SelectedBadge label={selectedSector.nombre} />
            )}
          </>
        )}

        {/* ── PASO 2: Documento ── */}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Seleccioná el documento</Text>
            <Text style={styles.stepHint}>Sector: <Text style={{ color: GREEN, fontWeight: '600' }}>{selectedSector?.nombre}</Text></Text>

            <View style={{ zIndex: 10 }}>
              <View style={[styles.inputRow, openDoc && styles.inputRowOpen]}>
                <TextInput
                  style={styles.input}
                  placeholder="Buscar documento..."
                  placeholderTextColor="#c0c7d0"
                  value={searchDoc}
                  onChangeText={t => { setSearchDoc(t); setOpenDoc(true); setSelectedDoc(null); }}
                  onFocus={() => setOpenDoc(true)}
                />
                {searchDoc.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchDoc(''); setSelectedDoc(null); setOpenDoc(false); }}>
                    <Text style={styles.clearBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {openDoc && (
                <Dropdown
                  loading={loadingDocs}
                  error={error}
                  items={filteredDocs}
                  selectedCode={selectedDoc?.codigo}
                  onSelect={handleSelectDoc}
                />
              )}
            </View>

            {selectedDoc && !openDoc && (
              <SelectedBadge label={selectedDoc.nombre} />
            )}
          </>
        )}
      </View>

      {/* Footer con botón */}
      <View style={styles.footer}>
        {step === 1 && (
          <TouchableOpacity
            style={[styles.btn, !selectedSector && styles.btnOff]}
            disabled={!selectedSector}
            onPress={handleContinuarStep1}
          >
            <Text style={[styles.btnText, !selectedSector && styles.btnTextOff]}>Continuar</Text>
          </TouchableOpacity>
        )}
        {step === 2 && (
          <TouchableOpacity
            style={[styles.btn, !selectedDoc && styles.btnOff]}
            disabled={!selectedDoc}
          >
            <Text style={[styles.btnText, !selectedDoc && styles.btnTextOff]}>Continuar</Text>
          </TouchableOpacity>
        )}
      </View>
      </SafeAreaView>
    </View>
  );
}

// ── Componentes internos ──

function Dropdown({ loading, error, items, selectedCode, onSelect }: {
  loading: boolean;
  error: string;
  items: { codigo: string; nombre: string }[];
  selectedCode?: string;
  onSelect: (item: any) => void;
}) {
  return (
    <View style={styles.dropdown}>
      {loading ? (
        <View style={styles.dropCenter}>
          <ActivityIndicator color={GREEN} size="small" />
          <Text style={styles.dropHint}>Cargando...</Text>
        </View>
      ) : error ? (
        <View style={styles.dropCenter}>
          <Text style={styles.dropError}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.dropCenter}>
          <Text style={styles.dropHint}>Sin resultados</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.codigo}
          style={{ maxHeight: 220 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const active = selectedCode === item.codigo;
            return (
              <TouchableOpacity
                style={[styles.dropItem, active && styles.dropItemActive]}
                onPress={() => onSelect(item)}
              >
                <Text style={[styles.dropItemText, active && styles.dropItemTextActive]}>
                  {item.nombre}
                </Text>
                {active && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

function SelectedBadge({ label }: { label: string }) {
  return (
    <View style={styles.selectedRow}>
      <View style={styles.selectedDot} />
      <Text style={styles.selectedText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  bottomFill: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '60%', backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 24, color: '#fff', lineHeight: 28, fontWeight: '300' },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: -0.2 },
  body: {
    flex: 1, paddingHorizontal: 24, paddingTop: 28,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  step: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  stepActive: { backgroundColor: GREEN },
  stepNum: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  stepNumActive: { color: '#fff' },
  stepLine: { flex: 1, height: 1.5, backgroundColor: '#e2e8f0', marginHorizontal: 6 },
  stepLineDone: { backgroundColor: GREEN },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', letterSpacing: -0.4, marginBottom: 4 },
  stepHint: { fontSize: 13, color: '#94a3b8', marginBottom: 20 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'web' ? 12 : 10,
    backgroundColor: '#fafafa', gap: 8,
  },
  inputRowOpen: {
    borderColor: TEAL, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    borderBottomWidth: 0, backgroundColor: '#fff',
  },
  input: { flex: 1, fontSize: 15, color: '#0f172a', padding: 0 },
  clearBtn: { fontSize: 13, color: '#94a3b8', paddingHorizontal: 4 },
  dropdown: {
    borderWidth: 1.5, borderTopWidth: 0, borderColor: TEAL,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    backgroundColor: '#fff', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 6,
  },
  dropCenter: { padding: 18, alignItems: 'center', gap: 8 },
  dropHint: { fontSize: 13, color: '#94a3b8' },
  dropError: { fontSize: 13, color: '#ef4444' },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  dropItemActive: { backgroundColor: '#f0fdf4' },
  dropItemText: { fontSize: 14, color: '#0f172a', fontWeight: '400' },
  dropItemTextActive: { color: GREEN, fontWeight: '600' },
  checkMark: { fontSize: 13, color: GREEN, fontWeight: '700' },
  sep: { height: 1, backgroundColor: '#f8fafc', marginHorizontal: 14 },
  selectedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 16, paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: '#f0fdf4', borderRadius: 10,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  selectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  selectedText: { flex: 1, fontSize: 14, color: '#166534', fontWeight: '500' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
  btn: {
    backgroundColor: GREEN, borderRadius: 12, paddingVertical: 15, alignItems: 'center',
    shadowColor: GREEN, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  btnOff: { backgroundColor: '#f1f5f9', shadowOpacity: 0, elevation: 0 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnTextOff: { color: '#94a3b8' },
});
