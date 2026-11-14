import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
import { Image as ImageIcon, Link2, MapPin, Plus, Trash2, Upload, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useViewport } from '../../hooks/useViewport';
import { scoreLocationMaturity } from '../../domain/canonScoreCalculator';
import { deleteMapAssetData, getMapAssetDataUrl, saveMapAssetDataUrl } from '../../domain/storageAdapter';
import type { Faction, World, WorldLocation, WorldMapAssetMeta, WorldTimelineEvent } from '../../types/project';
import { readImageFileData } from './WorldAtlasMapTab';
import { CanonBadgePill, worldStyles } from './WorldScoreChecklistBanner';

const LOCATION_TYPE_LABELS: Record<WorldLocation['type'], string> = {
  city: 'Cidade',
  fortress: 'Fortaleza',
  village: 'Vilarejo',
  ruin: 'Ruína',
  temple: 'Templo',
  region: 'Região',
  station: 'Estação',
  other: 'Outro',
};

const IMPACT_LABELS: Record<WorldTimelineEvent['impactLevel'], { label: string; color: string }> = {
  low: { label: 'Local / Baixo', color: '#94a3b8' },
  medium: { label: 'Regional / Médio', color: '#3b82f6' },
  high: { label: 'Alto Impacto', color: '#f59e0b' },
  cataclysmic: { label: 'Cataclísmico', color: '#ef4444' },
};

function clampCoord(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.round(Math.max(0, Math.min(100, value)) * 10) / 10;
}

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function EntityTogglePills({
  label,
  items,
  selectedIds,
  onToggle,
}: {
  label: string;
  items: { id: string; name: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <span style={worldStyles.label}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {items.map((item) => {
          const active = selectedIds.includes(item.id);
          return (
            <button key={item.id} type="button" aria-pressed={active} onClick={() => onToggle(item.id)} style={worldStyles.chip(active)}>
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WorldLocationsTab({
  world,
  factions,
  onUpdateWorld,
  onOpenAtlas,
}: {
  world: World;
  factions: Faction[];
  onUpdateWorld: (next: World) => void;
  onOpenAtlas?: () => void;
}) {
  const { requestConfirm, notify } = useProject();
  const { width } = useViewport();
  const isNarrow = width < 960;

  const [selectedLocId, setSelectedLocId] = useState<string>(world.locations[0]?.id ?? '');
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [blueprintState, setBlueprintState] = useState<{ id: string; url: string | null } | null>(null);
  const blueprintInputRef = useRef<HTMLInputElement | null>(null);
  const miniMapRef = useRef<HTMLDivElement | null>(null);

  const selectedLoc = world.locations.find((l) => l.id === selectedLocId) ?? world.locations[0];

  useEffect(() => {
    const bpId = selectedLoc?.blueprintAssetId;
    if (!bpId) {
      setBlueprintState(null);
      return;
    }
    let active = true;
    void getMapAssetDataUrl(bpId).then((url) => {
      if (active) setBlueprintState({ id: bpId, url });
    });
    return () => {
      active = false;
    };
  }, [selectedLoc?.blueprintAssetId]);

  const routeEdges = useMemo(() => {
    const seen = new Set<string>();
    const edges: { key: string; from: WorldLocation; to: WorldLocation }[] = [];
    const byId = new Map(world.locations.map((l) => [l.id, l]));
    for (const loc of world.locations) {
      for (const targetId of loc.connectedLocationIds) {
        const target = byId.get(targetId);
        if (!target || target.id === loc.id) continue;
        const key = loc.id < target.id ? `${loc.id}::${target.id}` : `${target.id}::${loc.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ key, from: loc, to: target });
      }
    }
    return edges;
  }, [world.locations]);

  const updateLocation = (locId: string, patch: Partial<WorldLocation>) => {
    onUpdateWorld({
      ...world,
      locations: world.locations.map((l) => (l.id === locId ? { ...l, ...patch } : l)),
    });
  };

  const handleAddLocation = () => {
    if (!newLocName.trim()) return;
    const loc: WorldLocation = {
      id: `loc_${Date.now()}`,
      worldId: world.id,
      name: newLocName.trim(),
      type: 'city',
      population: '',
      climateOrAtmosphere: '',
      description: newLocDesc.trim() || 'Novo local adicionado ao atlas.',
      strategicValue: '',
      coordinates: { x: Math.round(20 + Math.random() * 60), y: Math.round(20 + Math.random() * 60) },
      connectedLocationIds: [],
      notes: '',
    };
    onUpdateWorld({ ...world, locations: [...world.locations, loc] });
    setSelectedLocId(loc.id);
    setNewLocName('');
    setNewLocDesc('');
  };

  const handleDeleteLocation = async (loc: WorldLocation) => {
    const confirmed = await requestConfirm({
      title: 'Excluir local',
      message: `Remover "${loc.name}" do mundo e desconectar suas rotas?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });
    if (!confirmed) return;

    if (loc.blueprintAssetId) await deleteMapAssetData(loc.blueprintAssetId);
    const nextLocations = world.locations
      .filter((l) => l.id !== loc.id)
      .map((l) => ({ ...l, connectedLocationIds: l.connectedLocationIds.filter((id) => id !== loc.id) }));
    onUpdateWorld({
      ...world,
      locations: nextLocations,
      maps: (world.maps ?? []).filter((m) => m.id !== loc.blueprintAssetId),
    });
    if (selectedLocId === loc.id) setSelectedLocId(nextLocations[0]?.id ?? '');
    notify(`Local "${loc.name}" removido.`, 'info');
  };

  const handleToggleConnection = (locAId: string, locBId: string) => {
    const locA = world.locations.find((l) => l.id === locAId);
    if (!locA) return;
    const connected = locA.connectedLocationIds.includes(locBId);
    onUpdateWorld({
      ...world,
      locations: world.locations.map((l) => {
        if (l.id === locAId) {
          return {
            ...l,
            connectedLocationIds: connected ? l.connectedLocationIds.filter((id) => id !== locBId) : [...l.connectedLocationIds, locBId],
          };
        }
        if (l.id === locBId) {
          return {
            ...l,
            connectedLocationIds: connected
              ? l.connectedLocationIds.filter((id) => id !== locAId)
              : l.connectedLocationIds.includes(locAId)
                ? l.connectedLocationIds
                : [...l.connectedLocationIds, locAId],
          };
        }
        return l;
      }),
    });
  };

  const handleMiniMapClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = miniMapRef.current?.getBoundingClientRect();
    if (!selectedLoc || !rect || rect.width <= 0 || rect.height <= 0) return;
    updateLocation(selectedLoc.id, {
      coordinates: {
        x: clampCoord(((e.clientX - rect.left) / rect.width) * 100),
        y: clampCoord(((e.clientY - rect.top) / rect.height) * 100),
      },
    });
  };

  const handleUploadBlueprint = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedLoc) return;

    try {
      const loaded = await readImageFileData(file);
      const assetId = `bp_${selectedLoc.id}_${Date.now()}`;
      const saved = await saveMapAssetDataUrl(assetId, world.id, loaded.dataUrl);
      if (!saved) {
        notify('Não foi possível gravar a planta local no armazenamento.', 'warning');
        return;
      }
      if (selectedLoc.blueprintAssetId) await deleteMapAssetData(selectedLoc.blueprintAssetId);
      const bpMeta: WorldMapAssetMeta = {
        id: assetId,
        worldId: world.id,
        name: `Planta: ${selectedLoc.name}`,
        category: 'blueprint',
        mimeType: loaded.mimeType,
        width: loaded.width,
        height: loaded.height,
        isPrimary: false,
        createdAt: new Date().toISOString(),
      };
      setBlueprintState({ id: assetId, url: loaded.dataUrl });
      onUpdateWorld({
        ...world,
        maps: [...(world.maps ?? []).filter((m) => m.id !== selectedLoc.blueprintAssetId), bpMeta],
        locations: world.locations.map((l) => (l.id === selectedLoc.id ? { ...l, blueprintAssetId: assetId } : l)),
      });
      notify(`Planta local vinculada a "${selectedLoc.name}".`, 'success');
    } catch {
      notify('Formato inválido. Use imagem PNG, JPG, WebP ou SVG.', 'warning');
    }
  };

  const handleRemoveBlueprint = async (loc: WorldLocation) => {
    if (!loc.blueprintAssetId) return;
    const confirmed = await requestConfirm({
      title: 'Remover planta local',
      message: `Remover a planta anexada ao local "${loc.name}"?`,
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });
    if (!confirmed) return;

    const oldId = loc.blueprintAssetId;
    await deleteMapAssetData(oldId);
    setBlueprintState(null);
    onUpdateWorld({
      ...world,
      maps: (world.maps ?? []).filter((m) => m.id !== oldId),
      locations: world.locations.map((l) => (l.id === loc.id ? { ...l, blueprintAssetId: undefined } : l)),
    });
    notify('Planta removida do local.', 'info');
  };

  const selectedBadge = selectedLoc ? scoreLocationMaturity(selectedLoc) : null;
  const activeBlueprintUrl =
    selectedLoc?.blueprintAssetId && blueprintState?.id === selectedLoc.blueprintAssetId
      ? blueprintState.url
      : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1.15fr 1fr', gap: 18, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          ref={miniMapRef}
          onClick={handleMiniMapClick}
          style={{
            height: 310,
            backgroundColor: 'var(--bg-canvas, #0b0e16)',
            border: '1px solid var(--border-subtle, #263046)',
            borderRadius: 'var(--radius-md, 8px)',
            position: 'relative',
            overflow: 'hidden',
            cursor: selectedLoc ? 'crosshair' : 'default',
            backgroundImage: 'radial-gradient(var(--border-subtle, #263046) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {routeEdges.map((edge) => (
              <line
                key={edge.key}
                x1={edge.from.coordinates.x}
                y1={edge.from.coordinates.y}
                x2={edge.to.coordinates.x}
                y2={edge.to.coordinates.y}
                stroke="var(--text-muted, #64748b)"
                strokeWidth={2}
                strokeDasharray="5,5"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {world.locations.map((loc) => {
            const isSel = selectedLoc?.id === loc.id;
            const fac = factions.find((f) => f.id === loc.controlledByFactionId);
            return (
              <button
                key={loc.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLocId(loc.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${loc.coordinates.x}%`,
                  top: `${loc.coordinates.y}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: isSel ? '#10b981' : 'var(--bg-surface, #111623)',
                  border: `2px solid ${fac?.color ?? scoreLocationMaturity(loc).color}`,
                  color: isSel ? '#052e16' : 'var(--text-primary, #f1f5f9)',
                  padding: '4px 9px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
                  whiteSpace: 'nowrap',
                }}
              >
                {loc.name}
              </button>
            );
          })}

          {onOpenAtlas && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAtlas();
              }}
              style={{ ...worldStyles.secondaryBtn, position: 'absolute', right: 10, bottom: 10, backgroundColor: 'var(--bg-surface, #111623)' }}
            >
              Abrir no Atlas Completo
            </button>
          )}
        </div>

        <div style={worldStyles.card}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
            Locais Mapeados ({world.locations.length})
          </div>
          {world.locations.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
              Nenhum local cadastrado ainda. Crie o primeiro abaixo.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {world.locations.map((loc) => {
                const isSel = selectedLoc?.id === loc.id;
                const badge = scoreLocationMaturity(loc);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocId(loc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      border: isSel ? '1px solid var(--accent-primary, #3b82f6)' : '1px solid var(--border-subtle, #263046)',
                      backgroundColor: isSel ? 'var(--bg-elevated, #171d2e)' : 'transparent',
                      color: 'var(--text-primary, #f1f5f9)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <MapPin size={13} color={badge.color} />
                      <span style={{ fontSize: 12.5, fontWeight: isSel ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {loc.name}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
                        · {LOCATION_TYPE_LABELS[loc.type]}
                      </span>
                    </span>
                    <CanonBadgePill badge={badge} compact />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ ...worldStyles.card, flexDirection: isNarrow ? 'column' : 'row', alignItems: isNarrow ? 'stretch' : 'center', gap: 8 }}>
          <input aria-label="Nome do novo local" value={newLocName} onChange={(e) => setNewLocName(e.target.value)} placeholder="Nome do novo local..." style={worldStyles.input} />
          <input aria-label="Descrição rápida do novo local" value={newLocDesc} onChange={(e) => setNewLocDesc(e.target.value)} placeholder="Descrição rápida..." style={worldStyles.input} />
          <button
            type="button"
            onClick={handleAddLocation}
            style={{
              ...worldStyles.primaryBtn,
              backgroundColor: '#10b981',
              color: '#052e16',
              whiteSpace: 'nowrap',
              justifyContent: 'center',
            }}
          >
            <Plus size={14} /> Adicionar Local
          </button>
        </div>
      </div>

      {selectedLoc && selectedBadge && (
        <div style={{ ...worldStyles.card, gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
                {selectedLoc.name}
              </h3>
              <CanonBadgePill badge={selectedBadge} />
            </div>
            <button type="button" onClick={() => handleDeleteLocation(selectedLoc)} aria-label={`Excluir local ${selectedLoc.name}`} style={worldStyles.dangerBtn}>
              <Trash2 size={13} /> Excluir
            </button>
          </div>

          {selectedBadge.missingItems.length > 0 && (
            <div style={{ padding: '7px 10px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: 'var(--bg-elevated, #171d2e)', borderLeft: `3px solid ${selectedBadge.color}`, fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
              Para 10/10: {selectedBadge.missingItems.join(' · ')}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 8 }}>
            <div>
              <label htmlFor="loc-name" style={worldStyles.label}>Nome</label>
              <input id="loc-name" value={selectedLoc.name} onChange={(e) => updateLocation(selectedLoc.id, { name: e.target.value })} style={worldStyles.input} />
            </div>
            <div>
              <label htmlFor="loc-type" style={worldStyles.label}>Tipo</label>
              <select id="loc-type" value={selectedLoc.type} onChange={(e) => updateLocation(selectedLoc.id, { type: e.target.value as WorldLocation['type'] })} style={worldStyles.input}>
                {Object.entries(LOCATION_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label htmlFor="loc-faction" style={worldStyles.label}>Facção Controladora</label>
              <select id="loc-faction" value={selectedLoc.controlledByFactionId ?? ''} onChange={(e) => updateLocation(selectedLoc.id, { controlledByFactionId: e.target.value || undefined })} style={worldStyles.input}>
                <option value="">Sem controle definido</option>
                {factions.map((fac) => (
                  <option key={fac.id} value={fac.id}>{fac.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="loc-pop" style={worldStyles.label}>População</label>
              <input id="loc-pop" value={selectedLoc.population ?? ''} onChange={(e) => updateLocation(selectedLoc.id, { population: e.target.value })} placeholder="Ex.: 40.000 habitantes" style={worldStyles.input} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label htmlFor="loc-coord-x" style={worldStyles.label}>Coordenada X (0–100%)</label>
              <input
                id="loc-coord-x"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={selectedLoc.coordinates.x}
                onChange={(e) => updateLocation(selectedLoc.id, { coordinates: { ...selectedLoc.coordinates, x: clampCoord(Number(e.target.value)) } })}
                style={worldStyles.input}
              />
            </div>
            <div>
              <label htmlFor="loc-coord-y" style={worldStyles.label}>Coordenada Y (0–100%)</label>
              <input
                id="loc-coord-y"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={selectedLoc.coordinates.y}
                onChange={(e) => updateLocation(selectedLoc.id, { coordinates: { ...selectedLoc.coordinates, y: clampCoord(Number(e.target.value)) } })}
                style={worldStyles.input}
              />
            </div>
          </div>

          <div>
            <label htmlFor="loc-climate" style={worldStyles.label}>Clima & Atmosfera Sensorial</label>
            <textarea id="loc-climate" rows={2} value={selectedLoc.climateOrAtmosphere} onChange={(e) => updateLocation(selectedLoc.id, { climateOrAtmosphere: e.target.value })} style={worldStyles.textarea} />
          </div>

          <div>
            <label htmlFor="loc-desc" style={worldStyles.label}>Descrição Geográfica & Arquitetônica</label>
            <textarea id="loc-desc" rows={3} value={selectedLoc.description} onChange={(e) => updateLocation(selectedLoc.id, { description: e.target.value })} style={worldStyles.textarea} />
          </div>

          <div>
            <label htmlFor="loc-strategy" style={worldStyles.label}>Valor Estratégico & Narrativo</label>
            <textarea id="loc-strategy" rows={2} value={selectedLoc.strategicValue} onChange={(e) => updateLocation(selectedLoc.id, { strategicValue: e.target.value })} style={worldStyles.textarea} />
          </div>

          <div>
            <div style={{ ...worldStyles.label, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Link2 size={12} /> Locais Conectados (Rotas)
            </div>
            {world.locations.length <= 1 ? (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted, #64748b)' }}>Crie ao menos outro local para traçar rotas de conexão.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {world.locations
                  .filter((other) => other.id !== selectedLoc.id)
                  .map((other) => {
                    const isLinked = selectedLoc.connectedLocationIds.includes(other.id);
                    return (
                      <button
                        key={other.id}
                        type="button"
                        aria-pressed={isLinked}
                        onClick={() => handleToggleConnection(selectedLoc.id, other.id)}
                        style={{
                          ...worldStyles.chip(isLinked),
                          borderColor: isLinked ? '#10b981' : 'var(--border-subtle, #263046)',
                          backgroundColor: isLinked ? 'rgba(16,185,129,0.16)' : 'var(--bg-elevated, #171d2e)',
                          color: isLinked ? '#10b981' : 'var(--text-secondary, #94a3b8)',
                        }}
                      >
                        {isLinked ? `✓ ${other.name}` : `+ ${other.name}`}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle, #263046)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ ...worldStyles.label, marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <ImageIcon size={13} /> Planta / Mapa Local (Opcional)
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <input ref={blueprintInputRef} type="file" accept="image/*,.svg" hidden onChange={handleUploadBlueprint} />
                <button type="button" onClick={() => blueprintInputRef.current?.click()} style={worldStyles.secondaryBtn}>
                  <Upload size={12} /> {selectedLoc.blueprintAssetId ? 'Trocar Planta' : 'Enviar Planta'}
                </button>
                {selectedLoc.blueprintAssetId && (
                  <button type="button" onClick={() => handleRemoveBlueprint(selectedLoc)} aria-label="Remover planta local" style={worldStyles.dangerBtn}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {selectedLoc.blueprintAssetId && activeBlueprintUrl && (
              <div style={{ borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-subtle, #263046)', overflow: 'hidden', backgroundColor: 'var(--bg-canvas, #0b0e16)' }}>
                <img src={activeBlueprintUrl} alt={`Planta do local ${selectedLoc.name}`} style={{ display: 'block', width: '100%', maxHeight: 200, objectFit: 'contain' }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function WorldTimelineTab({ world, onUpdateWorld }: { world: World; onUpdateWorld: (next: World) => void }) {
  const { project, requestConfirm, notify } = useProject();
  const [newEvtEra, setNewEvtEra] = useState('');
  const [newEvtYear, setNewEvtYear] = useState('');
  const [newEvtTitle, setNewEvtTitle] = useState('');
  const [newEvtDesc, setNewEvtDesc] = useState('');
  const [newEvtImpact, setNewEvtImpact] = useState<WorldTimelineEvent['impactLevel']>('high');
  const [newEvtLocationId, setNewEvtLocationId] = useState('');
  const [newEvtFactionIds, setNewEvtFactionIds] = useState<string[]>([]);
  const [newEvtCharacterIds, setNewEvtCharacterIds] = useState<string[]>([]);

  const handleAddEvent = () => {
    if (!newEvtTitle.trim()) return;
    onUpdateWorld({
      ...world,
      timeline: [
        ...world.timeline,
        {
          id: `evt_${Date.now()}`,
          worldId: world.id,
          era: newEvtEra.trim() || 'Era Atual',
          year: newEvtYear.trim() || 'Ano ?',
          title: newEvtTitle.trim(),
          description: newEvtDesc.trim(),
          locationId: newEvtLocationId || undefined,
          factionIds: newEvtFactionIds,
          characterIds: newEvtCharacterIds,
          impactLevel: newEvtImpact,
        },
      ],
    });
    setNewEvtEra('');
    setNewEvtYear('');
    setNewEvtTitle('');
    setNewEvtDesc('');
    setNewEvtLocationId('');
    setNewEvtFactionIds([]);
    setNewEvtCharacterIds([]);
    notify('Evento histórico registrado na linha do tempo.', 'success');
  };

  const updateEvent = (evtId: string, patch: Partial<WorldTimelineEvent>) => {
    onUpdateWorld({
      ...world,
      timeline: world.timeline.map((ev) => (ev.id === evtId ? { ...ev, ...patch } : ev)),
    });
  };

  const handleDeleteEvent = async (evt: WorldTimelineEvent) => {
    const confirmed = await requestConfirm({
      title: 'Excluir marco histórico',
      message: `Remover "${evt.title}" da linha do tempo do mundo?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });
    if (!confirmed) return;
    onUpdateWorld({ ...world, timeline: world.timeline.filter((ev) => ev.id !== evt.id) });
    notify('Evento removido da linha do tempo.', 'info');
  };

  return (
    <div style={{ maxWidth: 940, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {world.timeline.map((evt) => {
          const impact = IMPACT_LABELS[evt.impactLevel];
          return (
            <div key={evt.id} style={{ ...worldStyles.card, borderLeft: `4px solid ${impact.color}`, gap: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: '#10b981', fontWeight: 700 }}>{evt.era} · {evt.year}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999, color: impact.color, backgroundColor: `color-mix(in srgb, ${impact.color} 15%, transparent)` }}>
                    {impact.label}
                  </span>
                </div>
                <button type="button" onClick={() => handleDeleteEvent(evt)} aria-label={`Excluir evento ${evt.title}`} style={worldStyles.dangerBtn}>
                  <Trash2 size={12} /> Excluir
                </button>
              </div>

              <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary, #f1f5f9)' }}>{evt.title}</h4>
              {evt.description && (
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>{evt.description}</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle, #263046)' }}>
                <div>
                  <label htmlFor={`evt-impact-${evt.id}`} style={worldStyles.label}>Impacto</label>
                  <select
                    id={`evt-impact-${evt.id}`}
                    value={evt.impactLevel}
                    onChange={(e) => updateEvent(evt.id, { impactLevel: e.target.value as WorldTimelineEvent['impactLevel'] })}
                    style={worldStyles.input}
                  >
                    {Object.entries(IMPACT_LABELS).map(([k, info]) => (
                      <option key={k} value={k}>{info.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`evt-loc-${evt.id}`} style={worldStyles.label}>Local do Evento</label>
                  <select
                    id={`evt-loc-${evt.id}`}
                    value={evt.locationId ?? ''}
                    onChange={(e) => updateEvent(evt.id, { locationId: e.target.value || undefined })}
                    style={worldStyles.input}
                  >
                    <option value="">Sem local vinculado</option>
                    {world.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <EntityTogglePills
                  label="Facções Envolvidas"
                  items={project.factions}
                  selectedIds={evt.factionIds}
                  onToggle={(id) => updateEvent(evt.id, { factionIds: toggleId(evt.factionIds, id) })}
                />
                <EntityTogglePills
                  label="Personagens Envolvidos"
                  items={project.characters}
                  selectedIds={evt.characterIds}
                  onToggle={(id) => updateEvent(evt.id, { characterIds: toggleId(evt.characterIds, id) })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...worldStyles.card, gap: 10 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
          + Adicionar Evento Histórico na Linha do Tempo
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <input aria-label="Era histórica" value={newEvtEra} onChange={(e) => setNewEvtEra(e.target.value)} placeholder="Era (ex.: Primeira Era)" style={worldStyles.input} />
          <input aria-label="Ano ou data" value={newEvtYear} onChange={(e) => setNewEvtYear(e.target.value)} placeholder="Ano / Data" style={worldStyles.input} />
          <select aria-label="Nível de impacto" value={newEvtImpact} onChange={(e) => setNewEvtImpact(e.target.value as WorldTimelineEvent['impactLevel'])} style={worldStyles.input}>
            {Object.entries(IMPACT_LABELS).map(([k, info]) => (
              <option key={k} value={k}>{info.label}</option>
            ))}
          </select>
          <select aria-label="Local do evento" value={newEvtLocationId} onChange={(e) => setNewEvtLocationId(e.target.value)} style={worldStyles.input}>
            <option value="">Local (opcional)</option>
            {world.locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        <input aria-label="Título do marco histórico" value={newEvtTitle} onChange={(e) => setNewEvtTitle(e.target.value)} placeholder="Título do marco histórico..." style={worldStyles.input} />
        <textarea aria-label="Descrição do evento histórico" rows={2} value={newEvtDesc} onChange={(e) => setNewEvtDesc(e.target.value)} placeholder="Descrição causal e consequências geopolíticas do evento..." style={worldStyles.textarea} />

        <EntityTogglePills
          label="Facções vinculadas"
          items={project.factions}
          selectedIds={newEvtFactionIds}
          onToggle={(id) => setNewEvtFactionIds((prev) => toggleId(prev, id))}
        />
        <EntityTogglePills
          label="Personagens vinculados"
          items={project.characters}
          selectedIds={newEvtCharacterIds}
          onToggle={(id) => setNewEvtCharacterIds((prev) => toggleId(prev, id))}
        />

        <button
          type="button"
          onClick={handleAddEvent}
          style={{ ...worldStyles.primaryBtn, alignSelf: 'flex-start', backgroundColor: '#10b981', color: '#052e16' }}
        >
          Registrar Evento
        </button>
      </div>
    </div>
  );
}
