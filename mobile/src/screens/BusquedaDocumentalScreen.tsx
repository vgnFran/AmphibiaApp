import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, SafeAreaView, StatusBar, Platform, ScrollView, Alert, Modal, Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getSectores, getDocumentos, getCampos, getNormalizar, buscarDocumentos, Sector, Documento, Campo, ResultadoBusqueda } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GREEN = '#01a951';
const TEAL = '#00B4CC';
const G1 = GREEN;
const G2 = TEAL;

type Step = 1 | 2 | 3 | 4;

export default function BusquedaDocumentalScreen() {
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

  // Paso 3 — Campos de búsqueda
  const [campos, setCampos] = useState<Campo[]>([]);
  const [loadingCampos, setLoadingCampos] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Paso 4 — Resultados
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);

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
    Keyboard.dismiss();
    setSelectedDoc(null);
    setSearchDoc('');
    setDocumentos([]);
    setCampos([]);
    setFormValues({});
    setError('');
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

  async function handleSelectDoc(doc: Documento) {
    setSelectedDoc(doc);
    setSearchDoc(doc.nombre);
    setOpenDoc(false);
    Keyboard.dismiss();
    setCampos([]);
    setFormValues({});
    setError('');

    if (!session) return;
    setStep(3);
    setLoadingCampos(true);
    try {
      const camposData = await getCampos(session.empresa, session.usuario, doc.nombre);
      const visibles = camposData.filter(c => c.estado);
      setCampos(visibles);
      const initial: Record<string, string> = {};
      visibles.forEach(c => { initial[c.orden] = ''; });
      setFormValues(initial);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingCampos(false);
    }
  }

  async function handleBuscar() {
    if (!session || !selectedDoc) return;
    setBuscando(true);
    setError('');
    try {
      const resultadosData = await buscarDocumentos(
        session.empresa,
        session.usuario,
        selectedDoc.nombre,
        formValues,
      );
      setResultados(resultadosData);
      setStep(4);
    } catch (e: any) {
      Alert.alert('Error en la búsqueda', e.message);
    } finally {
      setBuscando(false);
    }
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

      <View style={styles.bottomFill} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (step === 1) {
                navigation.goBack();
              } else if (step === 2) {
                setStep(1);
                setSelectedDoc(null);
                setSearchDoc('');
                setDocumentos([]);
                setOpenDoc(false);
              } else if (step === 3) {
                setStep(2);
                setCampos([]);
                setFormValues({});
                setError('');
              } else if (step === 4) {
                setStep(3);
                setResultados([]);
              }
            }}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consultar documentos</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.body}>
          {/* Steps — solo mostramos 3 pasos visibles */}
          {step < 4 && (
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
          )}

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
              <Text style={styles.stepHint}>
                Sector: <Text style={{ color: GREEN, fontWeight: '600' }}>{selectedSector?.nombre}</Text>
              </Text>

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

          {/* ── PASO 3: Campos de búsqueda ── */}
          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Filtros de búsqueda</Text>
              <Text style={styles.stepHint}>
                Sector: <Text style={{ color: GREEN, fontWeight: '600' }}>{selectedSector?.nombre}</Text>
              </Text>
              <Text style={[styles.stepHint, { marginTop: -14 }]}>
                Documento: <Text style={{ color: GREEN, fontWeight: '600' }}>{selectedDoc?.nombre}</Text>
              </Text>
              <Text style={[styles.stepHint, { marginTop: -14, marginBottom: 20 }]}>
                Todos los campos son opcionales
              </Text>

              {loadingCampos ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <ActivityIndicator color={GREEN} size="large" />
                  <Text style={[styles.stepHint, { marginTop: 12 }]}>Cargando campos...</Text>
                </View>
              ) : error ? (
                <Text style={{ color: '#ef4444', marginTop: 16 }}>{error}</Text>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {campos.map(campo => (
                    <View key={campo.orden} style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>{campo.campo}</Text>
                      <CampoInput
                        campo={campo}
                        value={formValues[campo.orden] || ''}
                        onChange={t => setFormValues(prev => ({ ...prev, [campo.orden]: t }))}
                        empresa={session?.empresa ?? ''}
                        usuario={session?.usuario ?? ''}
                      />
                    </View>
                  ))}
                  <View style={{ height: 16 }} />
                </ScrollView>
              )}
            </>
          )}

          {/* ── PASO 4: Resultados ── */}
          {step === 4 && (
            <>
              <Text style={styles.stepTitle}>Resultados</Text>
              <Text style={styles.stepHint}>
                {resultados.length === 0
                  ? 'No se encontraron documentos con esos criterios'
                  : `${resultados.length} documento${resultados.length !== 1 ? 's' : ''} encontrado${resultados.length !== 1 ? 's' : ''}`}
              </Text>

              {resultados.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Sin resultados</Text>
                  <Text style={styles.emptyHint}>Intentá con otros criterios de búsqueda</Text>
                </View>
              ) : (
                <FlatList
                  data={resultados}
                  keyExtractor={(_, i) => String(i)}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={styles.resultSep} />}
                  renderItem={({ item }) => (
                    <View style={styles.resultCard}>
                      <Text style={styles.resultDocNombre}>{item.nombreDocumento || selectedDoc?.nombre}</Text>
                      {item.campos && item.campos.map((c, i) => (
                        <View key={i} style={styles.resultCampoRow}>
                          <Text style={styles.resultCampoLabel}>{c.nombre}:</Text>
                          <Text style={styles.resultCampoValor}>{c.valor}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                />
              )}
            </>
          )}
        </View>

        {/* Footer */}
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
            <View style={[styles.btn, styles.btnOff]}>
              <Text style={[styles.btnText, styles.btnTextOff]}>Seleccioná un documento</Text>
            </View>
          )}
          {step === 3 && (
            <TouchableOpacity
              style={[styles.btn, (loadingCampos || buscando) && styles.btnOff]}
              disabled={loadingCampos || buscando}
              onPress={handleBuscar}
            >
              {buscando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnText}>Buscar</Text>
              }
            </TouchableOpacity>
          )}
          {step === 4 && (
            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                setStep(3);
                setResultados([]);
              }}
            >
              <Text style={styles.btnText}>Nueva búsqueda</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── CampoInput (búsqueda — sin required) ──────────────────────────

function CampoInput({ campo, value, onChange, empresa, usuario }: {
  campo: Campo;
  value: string;
  onChange: (v: string) => void;
  empresa: string;
  usuario: string;
}) {
  if (campo.clase === 'Cdatetime') {
    const [show, setShow] = useState(false);

    const dateValue = value
      ? (() => {
          const [d, m, y] = value.split('/');
          const parsed = new Date(Number(y), Number(m) - 1, Number(d));
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        })()
      : new Date();

    const handleChange = (_: any, selected?: Date) => {
      setShow(Platform.OS === 'ios');
      if (!selected) return;
      const d = String(selected.getDate()).padStart(2, '0');
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const y = selected.getFullYear();
      onChange(`${d}/${m}/${y}`);
    };

    return (
      <>
        <TouchableOpacity style={styles.fieldInput} onPress={() => setShow(true)} activeOpacity={0.7}>
          <Text style={{ fontSize: 15, color: value ? '#0f172a' : '#c0c7d0' }}>
            {value || 'DD/MM/AAAA (opcional)'}
          </Text>
        </TouchableOpacity>
        {show && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
        )}
      </>
    );
  }

  if (campo.clase === 'Ccombobox') {
    const [open, setOpen] = useState(false);
    const [opciones, setOpciones] = useState<string[]>([]);
    const [loadingOpciones, setLoadingOpciones] = useState(false);

    useEffect(() => {
      setLoadingOpciones(true);
      getNormalizar(empresa, usuario, campo.campo)
        .then(setOpciones)
        .catch(() => setOpciones([]))
        .finally(() => setLoadingOpciones(false));
    }, []);

    return (
      <>
        <TouchableOpacity
          style={[styles.fieldInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
          disabled={loadingOpciones}
        >
          {loadingOpciones ? (
            <ActivityIndicator size="small" color={GREEN} />
          ) : (
            <>
              <Text style={{ fontSize: 15, color: value ? '#0f172a' : '#c0c7d0', flex: 1 }}>
                {value || `Seleccioná ${campo.campo.toLowerCase()} (opcional)`}
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 16 }}>▾</Text>
            </>
          )}
        </TouchableOpacity>

        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{campo.campo}</Text>
              {value ? (
                <TouchableOpacity
                  style={[styles.dropItem, { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}
                  onPress={() => { onChange(''); setOpen(false); }}
                >
                  <Text style={{ fontSize: 14, color: '#ef4444', fontWeight: '500' }}>Limpiar selección</Text>
                </TouchableOpacity>
              ) : null}
              <FlatList
                data={opciones}
                keyExtractor={item => item}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => {
                  const active = item === value;
                  return (
                    <TouchableOpacity
                      style={[styles.dropItem, active && styles.dropItemActive]}
                      onPress={() => { onChange(item); setOpen(false); }}
                    >
                      <Text style={[styles.dropItemText, active && styles.dropItemTextActive]}>{item}</Text>
                      {active && <Text style={styles.checkMark}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  return (
    <TextInput
      style={styles.fieldInput}
      placeholder={`${campo.campo} (opcional)`}
      placeholderTextColor="#c0c7d0"
      maxLength={Number(campo.tam) || undefined}
      keyboardType={campo.tipo === 'int' || campo.tipo === 'decimal' ? 'numeric' : 'default'}
      value={value}
      onChangeText={onChange}
    />
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
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'web' ? 12 : 10,
    fontSize: 15, color: '#0f172a', backgroundColor: '#fafafa',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8, paddingBottom: 32, maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 13, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5,
    textTransform: 'uppercase', textAlign: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60,
  },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyHint: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  resultCard: {
    padding: 16, backgroundColor: '#f8fafc', borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  resultDocNombre: {
    fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10,
  },
  resultCampoRow: {
    flexDirection: 'row', gap: 6, marginBottom: 4, flexWrap: 'wrap',
  },
  resultCampoLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  resultCampoValor: { fontSize: 13, color: '#374151', fontWeight: '400', flex: 1 },
  resultSep: { height: 10 },
});
