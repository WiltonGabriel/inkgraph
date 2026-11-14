import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Compass, Image as ImageIcon, Map as MapIcon, MapPin, Upload } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useViewport } from '../../hooks/useViewport';
import { getMapAssetDataUrl, saveMapAssetDataUrl } from '../../domain/storageAdapter';
import type { World, WorldMapAssetMeta } from '../../types/project';
import { MAP_CATEGORY_LABELS, readImageFileData } from './WorldAtlasMapTab';
import { worldStyles } from './WorldScoreChecklistBanner';

export function WorldOverviewPillar({
  world,
  onUpdateWorld,
}: {
  world: World;
  onUpdateWorld: (next: World) => void;
}) {
  const { width } = useViewport();
  const isNarrow = width < 768;

  return (
    <div style={{ maxWidth: 940, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 2fr', gap: 12 }}>
        <div>
          <label htmlFor="world-overview-name" style={worldStyles.label}>
            Nome do Mundo
          </label>
          <input
            id="world-overview-name"
            value={world.name}
            onChange={(e) => onUpdateWorld({ ...world, name: e.target.value })}
            placeholder="Ex.: Domínio de Vael"
            style={worldStyles.input}
          />
        </div>
        <div>
          <label htmlFor="world-overview-premise" style={worldStyles.label}>
            Premissa Central
          </label>
          <input
            id="world-overview-premise"
            value={world.premise}
            onChange={(e) => onUpdateWorld({ ...world, premise: e.target.value })}
            placeholder="Qual conflito ou regra define este universo?"
            style={worldStyles.input}
          />
        </div>
      </div>

      <div>
        <label htmlFor="world-overview-description" style={worldStyles.label}>
          Descrição Geral do Universo
        </label>
        <textarea
          id="world-overview-description"
          rows={5}
          value={world.description}
          onChange={(e) => onUpdateWorld({ ...world, description: e.target.value })}
          placeholder="Panorama estético, era tecnológica e atmosfera principal..."
          style={worldStyles.textarea}
        />
      </div>

      <div>
        <label htmlFor="world-overview-notes" style={worldStyles.label}>
          Notas de Concepção & Tom
        </label>
        <textarea
          id="world-overview-notes"
          rows={4}
          value={world.notes}
          onChange={(e) => onUpdateWorld({ ...world, notes: e.target.value })}
          placeholder="Referências temáticas, restrições narrativas e lembretes do autor..."
          style={worldStyles.textarea}
        />
      </div>
    </div>
  );
}

export function WorldGeographyPillar({
  world,
  onUpdateWorld,
  onOpenAtlas,
  onOpenLocations,
}: {
  world: World;
  onUpdateWorld: (next: World) => void;
  onOpenAtlas: () => void;
  onOpenLocations: () => void;
}) {
  const { notify } = useProject();
  const { width } = useViewport();
  const isNarrow = width < 960;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const maps = world.maps ?? [];
  const primaryMap = maps.find((m) => m.isPrimary) ?? maps[0];
  const [previewState, setPreviewState] = useState<{ mapId: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!primaryMap) {
      setPreviewState(null);
      return;
    }
    let active = true;
    void getMapAssetDataUrl(primaryMap.id).then((url) => {
      if (active) setPreviewState({ mapId: primaryMap.id, url });
    });
    return () => {
      active = false;
    };
  }, [primaryMap?.id]);

  const handlePrimaryMapUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const loaded = await readImageFileData(file);
      const id = `map_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const saved = await saveMapAssetDataUrl(id, world.id, loaded.dataUrl);
      if (!saved) {
        notify('Falha ao gravar o mapa principal no armazenamento local.', 'warning');
        return;
      }

      const newMeta: WorldMapAssetMeta = {
        id,
        worldId: world.id,
        name: file.name.replace(/\.[^.]+$/, '') || 'Mapa Principal',
        category: 'geography',
        mimeType: loaded.mimeType,
        width: loaded.width,
        height: loaded.height,
        isPrimary: true,
        createdAt: new Date().toISOString(),
      };

      setPreviewState({ mapId: id, url: loaded.dataUrl });
      onUpdateWorld({
        ...world,
        maps: [...maps.map((m) => ({ ...m, isPrimary: false })), newMeta],
      });
      notify(`Mapa principal "${newMeta.name}" salvo no Atlas.`, 'success');
    } catch {
      notify('Formato inválido. Envie uma imagem PNG, JPG, WebP ou SVG.', 'warning');
    }
  };

  const locationsWithClimate = world.locations.filter((l) => Boolean(l.climateOrAtmosphere?.trim())).length;
  const isLoadedForCurrent = Boolean(primaryMap && previewState?.mapId === primaryMap.id);
  const previewUrl = isLoadedForCurrent ? previewState?.url ?? null : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1.3fr 1fr', gap: 16, alignItems: 'start' }}>
      <div style={worldStyles.card}>
        <label htmlFor="world-geo-desc" style={{ ...worldStyles.label, marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Compass size={14} color="var(--accent-primary, #3b82f6)" />
          Geografia, Continentes, Climas & Biomas
        </label>
        <textarea
          id="world-geo-desc"
          rows={9}
          value={world.geography}
          onChange={(e) => onUpdateWorld({ ...world, geography: e.target.value })}
          placeholder="Descreva massas continentais, barreiras naturais, zonas climáticas, mares e rotas físicas..."
          style={worldStyles.textarea}
        />
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--border-subtle, #263046)',
            fontSize: 12,
            color: 'var(--text-secondary, #94a3b8)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={13} />
            {world.locations.length} locais cadastrados · {locationsWithClimate} com clima definido
          </span>
          <button type="button" onClick={onOpenLocations} style={worldStyles.secondaryBtn}>
            Editar Locais
          </button>
        </div>
      </div>

      {/* Primary Map Thumbnail Card */}
      <div style={worldStyles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
            <MapIcon size={14} color="#10b981" /> Mapa Principal
          </span>
          {primaryMap && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                padding: '1px 7px',
                borderRadius: 999,
                color: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.14)',
                border: '1px solid rgba(16,185,129,0.35)',
              }}
            >
              {MAP_CATEGORY_LABELS[primaryMap.category]}
            </span>
          )}
        </div>

        <div
          style={{
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--border-subtle, #263046)',
            backgroundColor: 'var(--bg-canvas, #0b0e16)',
            overflow: 'hidden',
            minHeight: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {primaryMap && previewUrl ? (
            <img
              src={previewUrl}
              alt={`Pré-visualização do mapa principal: ${primaryMap.name}`}
              style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'cover' }}
            />
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={24} color="var(--text-muted, #64748b)" />
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                {!primaryMap
                  ? 'Nenhum mapa principal vinculado'
                  : isLoadedForCurrent
                    ? 'Pré-visualização indisponível no banco local'
                    : 'Carregando pré-visualização...'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted, #64748b)' }}>
                Envie uma imagem PNG, JPG, WebP ou SVG diretamente ou abra o Atlas.
              </div>
            </div>
          )}
        </div>

        {primaryMap && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
            <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>{primaryMap.name}</strong>
            {primaryMap.width && primaryMap.height ? ` · ${primaryMap.width}×${primaryMap.height}px` : ''}
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*,.svg" hidden onChange={handlePrimaryMapUpload} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" onClick={onOpenAtlas} style={worldStyles.primaryBtn}>
            <MapIcon size={13} /> Abrir Atlas / Mapas
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={worldStyles.secondaryBtn}>
            <Upload size={13} /> {primaryMap ? 'Substituir Mapa Principal' : 'Enviar Mapa Principal'}
          </button>
        </div>
      </div>
    </div>
  );
}
