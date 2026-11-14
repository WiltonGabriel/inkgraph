import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { Crosshair, Image as ImageIcon, Layers, MapPin, Plus, Star, Trash2, Upload } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useViewport } from '../../hooks/useViewport';
import { scoreLocationMaturity } from '../../domain/canonScoreCalculator';
import { deleteMapAssetData, getMapAssetDataUrl, saveMapAssetDataUrl } from '../../domain/storageAdapter';
import type { Faction, World, WorldLocation, WorldMapAssetMeta } from '../../types/project';
import { CanonBadgePill, worldStyles } from './WorldScoreChecklistBanner';

export type MapCategory = WorldMapAssetMeta['category'];
type MapFilter = 'all' | MapCategory;

export const MAP_CATEGORY_LABELS: Record<MapCategory, string> = {
  world: 'Mundo',
  geography: 'Geografia',
  political: 'Político',
  trade: 'Rotas Comerciais',
  systems: 'Sistemas',
  blueprint: 'Planta Local',
};

const MAP_FILTERS: { id: MapFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'world', label: 'Mundo' },
  { id: 'geography', label: 'Geografia' },
  { id: 'political', label: 'Político' },
  { id: 'trade', label: 'Rotas Comerciais' },
  { id: 'systems', label: 'Sistemas' },
  { id: 'blueprint', label: 'Planta Local' },
];

export interface LoadedImageFile {
  dataUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
}

/** Reads a local PNG/JPG/WebP/SVG file via FileReader and measures natural dimensions when available. */
export function readImageFileData(file: File): Promise<LoadedImageFile> {
  const isImage = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg');
  if (!isImage) return Promise.reject(new Error('Formato de imagem inválido.'));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo selecionado.'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('Arquivo de imagem vazio.'));
        return;
      }
      const mimeType = file.type || (file.name.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/png');
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl,
          mimeType,
          width: img.naturalWidth > 0 ? img.naturalWidth : undefined,
          height: img.naturalHeight > 0 ? img.naturalHeight : undefined,
        });
      };
      img.onerror = () => resolve({ dataUrl, mimeType });
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function clampCoord(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)) * 10) / 10;
}

export function WorldAtlasMapTab({
  world,
  factions,
  onUpdateWorld,
}: {
  world: World;
  factions: Faction[];
  onUpdateWorld: (next: World) => void;
}) {
  const { requestConfirm, notify } = useProject();
  const { width } = useViewport();
  const isNarrow = width < 960;

  const maps = world.maps ?? [];
  const [filter, setFilter] = useState<MapFilter>('all');
  const [uploadCategory, setUploadCategory] = useState<MapCategory>('world');
  const [selectedMapId, setSelectedMapId] = useState<string>(() => (maps.find((m) => m.isPrimary) ?? maps[0])?.id ?? '');
  const [selectedLocId, setSelectedLocId] = useState<string>(world.locations[0]?.id ?? '');
  const [clickPlaceMode, setClickPlaceMode] = useState(false);
  const [onlyBoundPins, setOnlyBoundPins] = useState(false);
  const [loadedUrls, setLoadedUrls] = useState<Record<string, string | null>>({});
  const [dragPreview, setDragPreview] = useState<{ locId: string; x: number; y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);
  const draggingLocIdRef = useRef<string | null>(null);

  const filteredMaps = useMemo(
    () => (filter === 'all' ? maps : maps.filter((m) => m.category === filter)),
    [filter, maps]
  );

  const selectedMap =
    filteredMaps.find((m) => m.id === selectedMapId) ??
    maps.find((m) => m.id === selectedMapId) ??
    filteredMaps[0] ??
    maps[0];

  const selectedLoc = world.locations.find((l) => l.id === selectedLocId) ?? world.locations[0];

  useEffect(() => {
    if (!selectedMap && filteredMaps[0]) setSelectedMapId(filteredMaps[0].id);
  }, [filteredMaps, selectedMap]);

  useEffect(() => {
    if (!selectedMap) return;
    if (loadedUrls[selectedMap.id] !== undefined) return;
    let active = true;
    void getMapAssetDataUrl(selectedMap.id).then((url) => {
      if (active) setLoadedUrls((prev) => ({ ...prev, [selectedMap.id]: url }));
    });
    return () => {
      active = false;
    };
  }, [selectedMap, loadedUrls]);

  const activeMapDataUrl = selectedMap ? loadedUrls[selectedMap.id] : undefined;

  const visibleLocations = useMemo(() => {
    if (!onlyBoundPins || !selectedMap) return world.locations;
    return world.locations.filter((l) => l.mapAssetId === selectedMap.id);
  }, [onlyBoundPins, selectedMap, world.locations]);

  const routeEdges = useMemo(() => {
    const seen = new Set<string>();
    const edges: { key: string; from: WorldLocation; to: WorldLocation }[] = [];
    const byId = new Map(visibleLocations.map((l) => [l.id, l]));
    for (const loc of visibleLocations) {
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
  }, [visibleLocations]);

  const getLocationCoords = (loc: WorldLocation) =>
    dragPreview && dragPreview.locId === loc.id ? { x: dragPreview.x, y: dragPreview.y } : loc.coordinates;

  const commitLocationCoords = (locId: string, x: number, y: number) => {
    onUpdateWorld({
      ...world,
      locations: world.locations.map((l) =>
        l.id === locId
          ? { ...l, coordinates: { x: clampCoord(x), y: clampCoord(y) }, mapAssetId: selectedMap?.id ?? l.mapAssetId }
          : l
      ),
    });
  };

  const handleUploadFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const newMetas: WorldMapAssetMeta[] = [];
    const newUrls: Record<string, string> = {};
    let hasPrimaryAlready = maps.some((m) => Boolean(m.isPrimary));

    for (const file of files) {
      try {
        const loaded = await readImageFileData(file);
        const id = `map_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const saved = await saveMapAssetDataUrl(id, world.id, loaded.dataUrl);
        if (!saved) {
          notify(`Falha ao gravar "${file.name}" no banco local de ativos.`, 'warning');
          continue;
        }
        const isFirstPrimary = !hasPrimaryAlready;
        if (isFirstPrimary) hasPrimaryAlready = true;
        newMetas.push({
          id,
          worldId: world.id,
          name: file.name.replace(/\.[^.]+$/, '') || 'Mapa sem nome',
          category: uploadCategory,
          mimeType: loaded.mimeType,
          width: loaded.width,
          height: loaded.height,
          isPrimary: isFirstPrimary,
          createdAt: new Date().toISOString(),
        });
        newUrls[id] = loaded.dataUrl;
      } catch {
        notify(`Não foi possível importar "${file.name}". Use PNG, JPG, WebP ou SVG.`, 'warning');
      }
    }

    if (newMetas.length > 0) {
      setLoadedUrls((prev) => ({ ...prev, ...newUrls }));
      onUpdateWorld({ ...world, maps: [...maps, ...newMetas] });
      setSelectedMapId(newMetas[0].id);
      if (filter !== 'all' && filter !== uploadCategory) setFilter('all');
      notify(newMetas.length === 1 ? `Mapa "${newMetas[0].name}" adicionado ao Atlas.` : `${newMetas.length} mapas adicionados ao Atlas.`, 'success');
    }
  };

  const handleSetPrimary = (mapId: string) => {
    onUpdateWorld({ ...world, maps: maps.map((m) => ({ ...m, isPrimary: m.id === mapId })) });
    notify('Mapa definido como principal na Geografia.', 'success');
  };

  const handleDeleteMap = async (target: WorldMapAssetMeta) => {
    const confirmed = await requestConfirm({
      title: 'Excluir mapa do Atlas',
      message: `Deseja remover "${target.name}" do Atlas? Os locais vinculados perderão a referência a este mapa.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });
    if (!confirmed) return;

    await deleteMapAssetData(target.id);
    const remainingMaps = maps.filter((m) => m.id !== target.id);
    if (target.isPrimary && remainingMaps.length > 0) {
      remainingMaps[0] = { ...remainingMaps[0], isPrimary: true };
    }
    onUpdateWorld({
      ...world,
      maps: remainingMaps,
      locations: world.locations.map((l) => ({
        ...l,
        mapAssetId: l.mapAssetId === target.id ? undefined : l.mapAssetId,
        blueprintAssetId: l.blueprintAssetId === target.id ? undefined : l.blueprintAssetId,
      })),
    });
    setLoadedUrls((prev) => {
      const next = { ...prev };
      delete next[target.id];
      return next;
    });
    if (selectedMapId === target.id) setSelectedMapId(remainingMaps[0]?.id ?? '');
    notify('Mapa removido do Atlas.', 'info');
  };

  const getCoordsFromClient = (clientX: number, clientY: number) => {
    const rect = canvasFrameRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: clampCoord(((clientX - rect.left) / rect.width) * 100),
      y: clampCoord(((clientY - rect.top) / rect.height) * 100),
    };
  };

  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!clickPlaceMode || !selectedLoc) return;
    const coords = getCoordsFromClient(e.clientX, e.clientY);
    if (!coords) return;
    commitLocationCoords(selectedLoc.id, coords.x, coords.y);
    notify(`Pino "${selectedLoc.name}" posicionado em ${coords.x}%, ${coords.y}%.`, 'success');
  };

  const handlePinPointerDown = (e: PointerEvent<HTMLButtonElement>, loc: WorldLocation) => {
    e.stopPropagation();
    setSelectedLocId(loc.id);
    draggingLocIdRef.current = loc.id;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable
    }
  };

  const handlePinPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const locId = draggingLocIdRef.current;
    if (!locId) return;
    const coords = getCoordsFromClient(e.clientX, e.clientY);
    if (coords) setDragPreview({ locId, x: coords.x, y: coords.y });
  };

  const handlePinPointerUp = (e: PointerEvent<HTMLButtonElement>, locId: string) => {
    if (draggingLocIdRef.current !== locId) return;
    draggingLocIdRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    if (dragPreview && dragPreview.locId === locId) commitLocationCoords(locId, dragPreview.x, dragPreview.y);
    setDragPreview(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Upload & Layer Filter Toolbar */}
      <div style={worldStyles.card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <Layers size={14} color="var(--text-secondary, #94a3b8)" />
            {MAP_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
                style={worldStyles.chip(filter === item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <label htmlFor="atlas-upload-cat" style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
              Camada:
            </label>
            <select
              id="atlas-upload-cat"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as MapCategory)}
              style={{ ...worldStyles.input, width: 'auto', minWidth: 145, padding: '6px 9px' }}
            >
              {Object.entries(MAP_CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>

            <input ref={fileInputRef} type="file" accept="image/*,.svg" multiple hidden onChange={handleUploadFiles} />
            <button type="button" onClick={() => fileInputRef.current?.click()} style={worldStyles.primaryBtn}>
              <Upload size={13} /> Enviar Mapa(s)
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: Interactive Canvas + Map & Pin Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1.45fr 1fr', gap: 16, alignItems: 'start' }}>
        <div style={worldStyles.card}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <ImageIcon size={15} color="var(--accent-primary, #3b82f6)" />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedMap ? selectedMap.name : 'Grade Tática do Atlas (sem imagem)'}
              </span>
              {selectedMap?.isPrimary && (
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 999, color: '#10b981', backgroundColor: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.35)' }}>
                  Principal
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button
                type="button"
                aria-pressed={clickPlaceMode}
                onClick={() => setClickPlaceMode((prev) => !prev)}
                disabled={!selectedLoc}
                style={{
                  ...worldStyles.secondaryBtn,
                  borderColor: clickPlaceMode ? '#10b981' : 'var(--border-subtle, #263046)',
                  backgroundColor: clickPlaceMode ? 'rgba(16,185,129,0.16)' : 'var(--bg-elevated, #171d2e)',
                  color: clickPlaceMode ? '#10b981' : 'var(--text-secondary, #94a3b8)',
                  cursor: selectedLoc ? 'pointer' : 'not-allowed',
                }}
              >
                <Crosshair size={12} />
                {clickPlaceMode ? 'Clique no mapa ativo' : 'Posicionar por clique'}
              </button>

              {selectedMap && (
                <button
                  type="button"
                  aria-pressed={onlyBoundPins}
                  onClick={() => setOnlyBoundPins((prev) => !prev)}
                  style={worldStyles.chip(onlyBoundPins)}
                >
                  {onlyBoundPins ? 'Só deste mapa' : 'Todos os locais'}
                </button>
              )}
            </div>
          </div>

          <div
            ref={canvasFrameRef}
            onClick={handleCanvasClick}
            style={{
              position: 'relative',
              width: '100%',
              minHeight: activeMapDataUrl ? undefined : 360,
              backgroundColor: 'var(--bg-canvas, #0b0e16)',
              border: clickPlaceMode ? '2px dashed #10b981' : '1px solid var(--border-subtle, #263046)',
              borderRadius: 'var(--radius-md, 8px)',
              overflow: 'hidden',
              cursor: clickPlaceMode && selectedLoc ? 'crosshair' : 'default',
              userSelect: 'none',
            }}
          >
            {activeMapDataUrl ? (
              <img src={activeMapDataUrl} alt={`Mapa ${selectedMap?.name ?? 'do mundo'}`} draggable={false} style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none' }} />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 20,
                  textAlign: 'center',
                  color: 'var(--text-secondary, #94a3b8)',
                  backgroundImage: 'radial-gradient(var(--border-subtle, #263046) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              >
                <Plus size={20} color="var(--accent-primary, #3b82f6)" />
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {!selectedMap
                    ? 'Envie um mapa PNG, JPG, WebP ou SVG para visualizar sobre o terreno'
                    : activeMapDataUrl === null
                      ? 'Imagem indisponível no banco local. Reenvie o arquivo se necessário.'
                      : 'Carregando imagem do mapa...'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted, #64748b)' }}>
                  Os pinos abaixo funcionam em coordenadas percentuais (0–100%).
                </div>
              </div>
            )}

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {routeEdges.map((edge) => {
                const p1 = getLocationCoords(edge.from);
                const p2 = getLocationCoords(edge.to);
                return (
                  <line
                    key={edge.key}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#38bdf8"
                    strokeOpacity={0.75}
                    strokeWidth={2}
                    strokeDasharray="5,4"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            {visibleLocations.map((loc) => {
              const coords = getLocationCoords(loc);
              const isSelected = selectedLoc?.id === loc.id;
              const faction = factions.find((f) => f.id === loc.controlledByFactionId);
              const pinBorder = faction?.color ?? scoreLocationMaturity(loc).color;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onPointerDown={(e) => handlePinPointerDown(e, loc)}
                  onPointerMove={handlePinPointerMove}
                  onPointerUp={(e) => handlePinPointerUp(e, loc.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocId(loc.id);
                  }}
                  aria-label={`Pino ${loc.name} (${coords.x}%, ${coords.y}%)`}
                  style={{
                    position: 'absolute',
                    left: `${coords.x}%`,
                    top: `${coords.y}%`,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 999,
                    backgroundColor: isSelected ? '#10b981' : 'var(--bg-surface, #111623)',
                    border: `2px solid ${pinBorder}`,
                    color: isSelected ? '#052e16' : 'var(--text-primary, #f1f5f9)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'grab',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <MapPin size={11} />
                  <span>{loc.name}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
            <span>Arraste qualquer pino sobre o mapa ou ative &ldquo;Posicionar por clique&rdquo;.</span>
            {selectedLoc && (
              <span>
                Pino ativo: <strong>{selectedLoc.name}</strong> ({selectedLoc.coordinates.x}%, {selectedLoc.coordinates.y}%)
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Maps List + Metadata + Pin Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={worldStyles.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
              Camadas & Mapas ({filteredMaps.length})
            </div>

            {filteredMaps.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                Nenhum mapa cadastrado nesta camada.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredMaps.map((mapMeta) => {
                  const isActive = selectedMap?.id === mapMeta.id;
                  return (
                    <div
                      key={mapMeta.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm, 6px)',
                        border: isActive ? '1px solid var(--accent-primary, #3b82f6)' : '1px solid var(--border-subtle, #263046)',
                        backgroundColor: isActive ? 'var(--bg-elevated, #171d2e)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedMapId(mapMeta.id)}
                        style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-primary, #f1f5f9)', cursor: 'pointer', padding: 0 }}
                      >
                        <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mapMeta.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)' }}>
                          {MAP_CATEGORY_LABELS[mapMeta.category]}
                          {mapMeta.width && mapMeta.height ? ` · ${mapMeta.width}×${mapMeta.height}px` : ''}
                        </div>
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(mapMeta.id)}
                          aria-label={`Definir ${mapMeta.name} como mapa principal`}
                          style={{
                            ...worldStyles.secondaryBtn,
                            padding: '4px 7px',
                            backgroundColor: mapMeta.isPrimary ? 'rgba(16,185,129,0.16)' : 'var(--bg-elevated, #171d2e)',
                            color: mapMeta.isPrimary ? '#10b981' : 'var(--text-secondary, #94a3b8)',
                          }}
                        >
                          <Star size={11} />
                          {mapMeta.isPrimary ? 'Principal' : 'Fixar'}
                        </button>
                        <button type="button" onClick={() => handleDeleteMap(mapMeta)} aria-label={`Excluir mapa ${mapMeta.name}`} style={{ ...worldStyles.dangerBtn, padding: '5px 7px' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedMap && (
              <div style={{ borderTop: '1px solid var(--border-subtle, #263046)', paddingTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label htmlFor="atlas-map-name" style={worldStyles.label}>
                    Nome do Mapa
                  </label>
                  <input
                    id="atlas-map-name"
                    value={selectedMap.name}
                    onChange={(e) =>
                      onUpdateWorld({ ...world, maps: maps.map((m) => (m.id === selectedMap.id ? { ...m, name: e.target.value } : m)) })
                    }
                    style={worldStyles.input}
                  />
                </div>
                <div>
                  <label htmlFor="atlas-map-cat" style={worldStyles.label}>
                    Categoria
                  </label>
                  <select
                    id="atlas-map-cat"
                    value={selectedMap.category}
                    onChange={(e) =>
                      onUpdateWorld({
                        ...world,
                        maps: maps.map((m) => (m.id === selectedMap.id ? { ...m, category: e.target.value as MapCategory } : m)),
                      })
                    }
                    style={worldStyles.input}
                  >
                    {Object.entries(MAP_CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div style={worldStyles.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
              Pinos de Locais ({world.locations.length})
            </div>
            {world.locations.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                Cadastre locais no pilar &ldquo;Locais&rdquo; para posicioná-los sobre o mapa.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                {world.locations.map((loc) => {
                  const isSel = selectedLoc?.id === loc.id;
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
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-sm, 6px)',
                        border: isSel ? '1px solid #10b981' : '1px solid var(--border-subtle, #263046)',
                        backgroundColor: isSel ? 'rgba(16,185,129,0.12)' : 'var(--bg-elevated, #171d2e)',
                        color: 'var(--text-primary, #f1f5f9)',
                        fontSize: 12,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isSel ? 700 : 500 }}>
                        {loc.name} ({loc.coordinates.x}%, {loc.coordinates.y}%)
                      </span>
                      <CanonBadgePill badge={scoreLocationMaturity(loc)} compact />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
