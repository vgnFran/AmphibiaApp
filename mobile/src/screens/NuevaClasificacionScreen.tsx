import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, SafeAreaView, StatusBar, Platform,
  Image, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getSectores, getDocumentos, getCampos, uploadClasificacion, Sector, Documento, Campo } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GREEN = '#01a951';
const TEAL = '#00B4CC';
const G1 = GREEN;
const G2 = TEAL;

type Step = 1 | 2 | 3;

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

  // Paso 3 — Campos e imagen
  const [campos, setCampos] = useState<Campo[]>([]);
  const [loadingCampos, setLoadingCampos] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);

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

  async function handlePickImage(source: 'camera' | 'gallery') {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso denegado', `Se necesita acceso a ${source === 'camera' ? 'la cámara' : 'la galería'}.`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, base64: true });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setImageFileName(asset.uri.split('/').pop() || `imagen_${Date.now()}.jpg`);
    }
  }

  async function handleContinuarStep2() {
    if (!selectedDoc || !session) return;
    setStep(3);
    setLoadingCampos(true);
    setError('');
    try {
      const data = await getCampos(session.empresa, session.usuario, selectedDoc.nombre);
      const visibles = data.filter(c => c.estado);
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
            onPress={() => step === 1 ? navigation.goBack() : setStep((step - 1) as Step)}
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

        {/* ── PASO 3: Campos del formulario ── */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Completá el formulario</Text>
            <Text style={styles.stepHint}>
              Sector: <Text style={{ color: GREEN, fontWeight: '600' }}>{selectedSector?.nombre}</Text>
            </Text>
            <Text style={[styles.stepHint, { marginTop: -14 }]}>
              Documento: <Text style={{ color: GREEN, fontWeight: '600' }}>{selectedDoc?.nombre}</Text>
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
                {/* ── Imagen ── */}
                <Text style={styles.fieldLabel}>Imagen</Text>
                {imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                    <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => { setImageUri(null); setImageBase64(null); setImageFileName(''); }}>
                      <Text style={styles.imageRemoveText}>Quitar imagen</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePickerRow}>
                    <TouchableOpacity style={styles.imagePickerBtn} onPress={() => handlePickImage('camera')}>
                      <Text style={styles.imagePickerText}>Cámara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imagePickerBtn} onPress={() => handlePickImage('gallery')}>
                      <Text style={styles.imagePickerText}>Galería</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── Campos dinámicos ── */}
                <View style={{ marginTop: 20 }}>
                  {campos.map(campo => (
                    <View key={campo.orden} style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        {campo.campo}
                        {campo.requerido && <Text style={{ color: '#ef4444' }}> *</Text>}
                      </Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder={campo.clase === 'Cdatetime' ? 'DD/MM/AAAA' : `Ingresá ${campo.campo.toLowerCase()}`}
                        placeholderTextColor="#c0c7d0"
                        maxLength={Number(campo.tam) || undefined}
                        keyboardType={campo.clase === 'Cdatetime' ? 'numbers-and-punctuation' : 'default'}
                        value={formValues[campo.orden] || ''}
                        onChangeText={t => setFormValues(prev => ({ ...prev, [campo.orden]: t }))}
                      />
                    </View>
                  ))}
                </View>
                <View style={{ height: 16 }} />
              </ScrollView>
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
            onPress={handleContinuarStep2}
          >
            <Text style={[styles.btnText, !selectedDoc && styles.btnTextOff]}>Continuar</Text>
          </TouchableOpacity>
        )}
        {step === 3 && (
          <TouchableOpacity
            style={[styles.btn, (loadingCampos || campos.length === 0 || uploading) && styles.btnOff]}
            disabled={loadingCampos || campos.length === 0 || uploading}
            onPress={async () => {
              // Validar campos requeridos
              const faltantes = campos
                .filter(c => c.requerido && !formValues[c.orden]?.trim())
                .map(c => c.campo);
              if (faltantes.length > 0) {
                Alert.alert('Campos requeridos', `Completá los siguientes campos:\n• ${faltantes.join('\n• ')}`);
                return;
              }
              if (!imageUri || !imageBase64) {
                Alert.alert('Imagen requerida', 'Seleccioná una imagen antes de guardar.');
                return;
              }
              if (!session) return;

              setUploading(true);
              try {
                const mensaje = await uploadClasificacion(
                  session.empresa,
                  session.usuario,
                  imageBase64,
                  imageFileName,
                  formValues
                );
                Alert.alert('Éxito', mensaje, [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } catch (e: any) {
                Alert.alert('Error', e.message);
              } finally {
                setUploading(false);
              }
            }}
          >
            {uploading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={[styles.btnText, (loadingCampos || campos.length === 0) && styles.btnTextOff]}>Guardar clasificación</Text>
            }
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
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'web' ? 12 : 10,
    fontSize: 15, color: '#0f172a', backgroundColor: '#fafafa',
  },
  imagePickerRow: { flexDirection: 'row', gap: 12 },
  imagePickerBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#fafafa',
  },
  imagePickerText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  imagePreviewContainer: { marginBottom: 4 },
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  imageRemoveBtn: {
    marginTop: 8, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: '#fee2e2',
  },
  imageRemoveText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
});
