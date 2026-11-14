import { useId, useMemo, useRef, useState } from 'react';
import { Users, Shield, Globe, Download, Upload } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  calculateWorldCompleteness,
} from '../../types/project';
import { DASHBOARD_CARD_STYLE } from './dashboardTheme';
import { FloatingChartTooltip } from './FloatingChartTooltip';

type QuickActionKey = 'characters' | 'factions' | 'worlds';

export function QuickActionsBackupCard() {
  const { project, setActiveView, exportProjectJson, importProjectJson, notify } =
    useProject();
  const [hoveredKey, setHoveredKey] = useState<QuickActionKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tooltipId = useId();

  const stats = useMemo(() => {
    const avgChar =
      project.characters.length > 0
        ? Math.round(
            project.characters.reduce(
              (acc, c) => acc + calculateCharacterCompleteness(c),
              0
            ) / project.characters.length
          )
        : 0;
    const avgFaction =
      project.factions.length > 0
        ? Math.round(
            project.factions.reduce(
              (acc, f) => acc + calculateFactionCompleteness(f),
              0
            ) / project.factions.length
          )
        : 0;
    const avgWorld =
      project.worlds.length > 0
        ? Math.round(
            project.worlds.reduce((acc, w) => acc + calculateWorldCompleteness(w), 0) /
              project.worlds.length
          )
        : 0;
    const locationsCount = project.worlds.reduce((sum, w) => sum + w.locations.length, 0);
    const systemsCount = project.worlds.reduce((sum, w) => sum + w.systems.length, 0);

    return { avgChar, avgFaction, avgWorld, locationsCount, systemsCount };
  }, [project.characters, project.factions, project.worlds]);

  const handleDownloadBackup = () => {
    const json = exportProjectJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Backup exportado em JSON.', 'success');
  };

  const quickActions: {
    key: QuickActionKey;
    label: string;
    subtitle: string;
    detail: string;
    icon: typeof Users;
    iconColor: string;
    xPercent: number;
  }[] = [
    {
      key: 'characters',
      label: 'Personagens',
      subtitle: `${project.characters.length} dossiês`,
      detail: `Completude média do elenco: ${stats.avgChar}%. Abrir estúdio de personagens.`,
      icon: Users,
      iconColor: 'var(--accent-primary)',
      xPercent: 18,
    },
    {
      key: 'factions',
      label: 'Facções',
      subtitle: `${project.factions.length} ordens`,
      detail: `Completude média das ordens: ${stats.avgFaction}%. Gerenciar hierarquias e agendas.`,
      icon: Shield,
      iconColor: 'var(--danger, #ef4444)',
      xPercent: 50,
    },
    {
      key: 'worlds',
      label: 'Mundos',
      subtitle: `${stats.locationsCount} locais`,
      detail: `${project.worlds.length} mundo(s), ${stats.systemsCount} sistema(s) de regras, ${stats.avgWorld}% preenchido.`,
      icon: Globe,
      iconColor: 'var(--success, #10b981)',
      xPercent: 82,
    },
  ];

  const activeTip = quickActions.find((q) => q.key === hoveredKey) ?? null;

  return (
    <section
      className="ig-card-interactive"
      style={{
        ...DASHBOARD_CARD_STYLE,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setHoveredKey(null);
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>
          Ações Rápidas & Universo
        </h3>

        <div style={{ position: 'relative' }}>
          <FloatingChartTooltip
            id={tooltipId}
            visible={activeTip !== null}
            xPercent={activeTip?.xPercent ?? 50}
            minWidth={200}
            maxWidth={250}
          >
            {activeTip && (
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                  {activeTip.label} · {activeTip.subtitle}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{activeTip.detail}</div>
              </div>
            )}
          </FloatingChartTooltip>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  className="ig-tile-interactive"
                  aria-describedby={hoveredKey === item.key ? tooltipId : undefined}
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey((curr) => (curr === item.key ? null : curr))}
                  onFocus={() => setHoveredKey(item.key)}
                  onBlur={() => setHoveredKey((curr) => (curr === item.key ? null : curr))}
                  onClick={() => setActiveView(item.key)}
                  style={{
                    padding: '10px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md, 8px)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                >
                  <Icon
                    size={15}
                    style={{ color: item.iconColor, marginBottom: 4 }}
                  />
                  <div style={{ fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {item.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
          Backup e restauração instantânea:
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="ig-tile-interactive"
            onClick={handleDownloadBackup}
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm, 6px)',
              color: 'var(--text-primary)',
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Download size={12} /> Exportar JSON
          </button>

          <button
            type="button"
            className="ig-tile-interactive"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm, 6px)',
              color: 'var(--text-primary)',
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Upload size={12} /> Importar JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const ok = importProjectJson(String(ev.target?.result ?? ''));
                notify(
                  ok
                    ? 'Projeto importado com sucesso.'
                    : 'Arquivo JSON inválido para importação.',
                  ok ? 'success' : 'warning'
                );
              };
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </section>
  );
}
