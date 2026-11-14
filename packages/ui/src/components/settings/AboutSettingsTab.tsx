import { useEffect, useState } from 'react';
import { BookOpenCheck, Cpu, Database, HeartHandshake, ShieldCheck } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../context/SettingsContext';
import {
  STORAGE_KEY_CATALOG,
  STORAGE_KEY_SETTINGS,
  getAssetStoreDiagnostics,
} from '../../domain/storageAdapter';
import {
  THEME_VAR,
  innerCardStyle,
  sectionCardStyle,
  sectionHeaderStyle,
} from './settingsStyles';

function measureLocalStorageBytes(): { catalogBytes: number; settingsBytes: number; totalBytes: number } {
  if (typeof localStorage === 'undefined') {
    return { catalogBytes: 0, settingsBytes: 0, totalBytes: 0 };
  }
  try {
    const catalogBytes = (localStorage.getItem(STORAGE_KEY_CATALOG) ?? '').length * 2;
    const settingsBytes = (localStorage.getItem(STORAGE_KEY_SETTINGS) ?? '').length * 2;
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k) {
        totalBytes += (k.length + (localStorage.getItem(k) ?? '').length) * 2;
      }
    }
    return { catalogBytes, settingsBytes, totalBytes };
  } catch {
    return { catalogBytes: 0, settingsBytes: 0, totalBytes: 0 };
  }
}

export function AboutSettingsTab() {
  const { workspaces, project, totalWordCount } = useProject();
  const { draftSettings } = useSettings();
  const isEn = draftSettings.language === 'en';

  const [assetStats, setAssetStats] = useState({ mapAssetCount: 0, assetStoreKb: 0 });
  const storageBytes = measureLocalStorageBytes();

  useEffect(() => {
    let cancelled = false;
    void getAssetStoreDiagnostics().then((stats) => {
      if (!cancelled) setAssetStats(stats);
    });
    return () => {
      cancelled = true;
    };
  }, [workspaces.length]);

  const totalScenes = workspaces.reduce((sum, w) => sum + w.scenes.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Identidade & Versão */}
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <BookOpenCheck size={16} color={THEME_VAR.accentPrimary} />
          <span>InkGraph Studio v0.4.0-web</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: THEME_VAR.textSecondary, lineHeight: 1.6, margin: 0 }}>
          {isEn
            ? 'Local-first literary writing, worldbuilding, and epistemic continuity studio with structured Markdown vaults and native Model Context Protocol (MCP) support.'
            : 'Estúdio local-first de escrita literária, construção de mundos e consistência epistêmica, orientado a cofres Markdown estruturados e servidor nativo Model Context Protocol (MCP).'}
        </p>
      </section>

      {/* Arquitetura do Monorepo */}
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Cpu size={16} color={THEME_VAR.accentPrimary} />
          <span>{isEn ? 'Workspace Architecture' : 'Arquitetura do Sistema'}</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.65rem',
          }}
        >
          <div style={innerCardStyle}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', color: THEME_VAR.accentPrimary }}>
              @inkgraph/core
            </div>
            <div style={{ fontSize: '0.75rem', color: THEME_VAR.textSecondary, marginTop: '0.2rem' }}>
              {isEn
                ? 'Markdown/YAML parser, ephemeral SQLite FTS5 indexer & epistemic graph resolver.'
                : 'Parser Markdown/YAML, indexador efêmero SQLite FTS5 e resolvedor epistêmico.'}
            </div>
          </div>

          <div style={innerCardStyle}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', color: THEME_VAR.accentPrimary }}>
              @inkgraph/mcp
            </div>
            <div style={{ fontSize: '0.75rem', color: THEME_VAR.textSecondary, marginTop: '0.2rem' }}>
              {isEn
                ? 'Native MCP server (stdio & streamable HTTP) with 7 canon/staging isolated tools.'
                : 'Servidor MCP nativo (stdio & HTTP) com 7 ferramentas isoladas em staging.'}
            </div>
          </div>

          <div style={innerCardStyle}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', color: THEME_VAR.accentPrimary }}>
              @inkgraph/ui
            </div>
            <div style={{ fontSize: '0.75rem', color: THEME_VAR.textSecondary, marginTop: '0.2rem' }}>
              {isEn
                ? 'Reactive visual studio with timeline curves, relationship graphs & offline atlas.'
                : 'Estúdio visual reativo com curvas temporais, grafos de relação e atlas offline.'}
            </div>
          </div>
        </div>
      </section>

      {/* Privacidade Local & Design Silencioso */}
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <ShieldCheck size={16} color="#10b981" />
          <span>{isEn ? 'Silent Design & Local Vault Privacy' : 'Design Silencioso & Privacidade do Cofre'}</span>
        </div>
        <p style={{ fontSize: '0.79rem', color: THEME_VAR.textSecondary, lineHeight: 1.6, margin: 0 }}>
          {isEn
            ? 'Your manuscripts, dossiers, uploads, and maps inside ./workspace/ stay strictly offline and gitignored. Derived indexes are ephemeral projections rebuilt 100% from Markdown files, with staging isolation separating AI proposals from canon.'
            : 'Seus manuscritos, dossiês, anexos e mapas em ./workspace/ permanecem estritamente offline e fora do controle de versão (.gitignore). Índices derivados são projeções efêmeras reconstruíveis 100% a partir dos arquivos Markdown, com separação rígida entre staging e cânone.'}
        </p>
      </section>

      {/* Diagnóstico em Tempo Real */}
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Database size={16} color={THEME_VAR.accentPrimary} />
          <span>{isEn ? 'Runtime Storage Diagnostics' : 'Diagnóstico de Armazenamento em Tempo Real'}</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
            gap: '0.65rem',
          }}
        >
          <div style={innerCardStyle}>
            <div style={{ fontSize: '0.72rem', color: THEME_VAR.textMuted }}>localStorage</div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: THEME_VAR.textPrimary }}>
              {storageBytes.totalBytes.toLocaleString('pt-BR')} bytes
            </div>
            <div style={{ fontSize: '0.7rem', color: THEME_VAR.textMuted }}>
              {isEn ? 'Catalog' : 'Catálogo'}: {(storageBytes.catalogBytes / 1024).toFixed(1)} KB •{' '}
              {isEn ? 'Settings' : 'Config'}: {(storageBytes.settingsBytes / 1024).toFixed(1)} KB
            </div>
          </div>

          <div style={innerCardStyle}>
            <div style={{ fontSize: '0.72rem', color: THEME_VAR.textMuted }}>
              IndexedDB ({isEn ? 'Maps & Assets' : 'Mapas & Ativos'})
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: THEME_VAR.textPrimary }}>
              {assetStats.mapAssetCount} {isEn ? 'assets' : 'ativos'} • {assetStats.assetStoreKb} KB
            </div>
          </div>

          <div style={innerCardStyle}>
            <div style={{ fontSize: '0.72rem', color: THEME_VAR.textMuted }}>
              {isEn ? 'Workspaces & Active Scene Words' : 'Workspaces & Palavras Ativas'}
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: THEME_VAR.textPrimary }}>
              {workspaces.length} ws / {totalScenes} {isEn ? 'scenes' : 'cenas'}
            </div>
            <div style={{ fontSize: '0.7rem', color: THEME_VAR.textMuted }}>
              {project.title}: {totalWordCount.toLocaleString('pt-BR')} {isEn ? 'words' : 'palavras'}
            </div>
          </div>
        </div>
      </section>

      {/* Créditos & Licenças Open Source */}
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <HeartHandshake size={16} color={THEME_VAR.accentPrimary} />
          <span>{isEn ? 'Open Source Credits & Licenses (MIT)' : 'Créditos & Licenças Open Source (MIT)'}</span>
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: '1.15rem',
            fontSize: '0.78rem',
            color: THEME_VAR.textSecondary,
            lineHeight: 1.7,
          }}
        >
          <li>
            <strong style={{ color: THEME_VAR.textPrimary }}>CodeMirror 6</strong> (MIT)
          </li>
          <li>
            <strong style={{ color: THEME_VAR.textPrimary }}>Lucide Icons</strong> (ISC)
          </li>
          <li>
            <strong style={{ color: THEME_VAR.textPrimary }}>React &amp; Vite</strong> (MIT)
          </li>
          <li>
            <strong style={{ color: THEME_VAR.textPrimary }}>
              AI Memory layered architecture inspiration by Fabio Akita
            </strong>{' '}
            (MIT/Open Source)
          </li>
        </ul>
      </section>
    </div>
  );
}
