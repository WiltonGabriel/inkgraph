import { useState } from 'react';
import { Settings, Cpu, Palette, Accessibility, CheckCircle2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import type { AppSettings } from '../types/project';

type SettingsTab = 'ai' | 'editor' | 'a11y';

export function SettingsView() {
  const { settings, updateSettings } = useProject();
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'ok'>('idle');

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    setTimeout(() => setConnectionStatus('ok'), 450);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Settings size={20} color="var(--accent)" />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Configurações do Estúdio</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Preferências de inferência, tipografia de escrita e acessibilidade visual.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={() => setActiveTab('ai')} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, background: activeTab === 'ai' ? 'var(--accent)' : 'var(--bg-card)', color: activeTab === 'ai' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Cpu size={14} /> IA & Provedores
          </button>
          <button onClick={() => setActiveTab('editor')} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, background: activeTab === 'editor' ? 'var(--accent)' : 'var(--bg-card)', color: activeTab === 'editor' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Palette size={14} /> Editor & Aparência
          </button>
          <button onClick={() => setActiveTab('a11y')} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, background: activeTab === 'a11y' ? 'var(--accent)' : 'var(--bg-card)', color: activeTab === 'a11y' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Accessibility size={14} /> Acessibilidade
          </button>
        </div>
      </div>

      {activeTab === 'ai' && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
              Modo de Operação
              <select value={settings.aiMode} onChange={(e) => setField('aiMode', e.target.value as AppSettings['aiMode'])} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.45rem' }}>
                <option value="cloud">Nuvem</option>
                <option value="local">Local</option>
                <option value="hybrid">Híbrido</option>
                <option value="eco">Eco (Heurísticas Locais)</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
              Provedor Principal
              <select value={settings.aiProvider} onChange={(e) => setField('aiProvider', e.target.value as AppSettings['aiProvider'])} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.45rem' }}>
                <option value="mcp">Servidor MCP Nativo</option>
                <option value="gemini">Provedor em Nuvem</option>
                <option value="ollama">Servidor Local</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            Chave de API (Armazenamento Local)
            <input type="password" value={settings.geminiApiKey} onChange={(e) => setField('geminiApiKey', e.target.value)} placeholder="Insira a chave de acesso..." style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.45rem 0.65rem' }} />
          </label>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
              Endereço do Servidor Local
              <input value={settings.ollamaUrl} onChange={(e) => setField('ollamaUrl', e.target.value)} placeholder="http://localhost:11434" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.45rem 0.65rem' }} />
            </label>
            <button onClick={handleTestConnection} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.48rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {connectionStatus === 'ok' && <CheckCircle2 size={14} color="#10b981" />}
              {connectionStatus === 'testing' ? 'Verificando...' : connectionStatus === 'ok' ? 'Conexão ativa' : 'Teste de conexão'}
            </button>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            Temperatura Criativa: {settings.aiTemperature.toFixed(1)}
            <input type="range" min={0} max={1.5} step={0.1} value={settings.aiTemperature} onChange={(e) => setField('aiTemperature', Number(e.target.value))} />
          </label>
        </div>
      )}

      {activeTab === 'editor' && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
              Tema Visual
              <select value={settings.theme} onChange={(e) => setField('theme', e.target.value as AppSettings['theme'])} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.45rem' }}>
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
                <option value="sepia">Sépia</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
              Família Tipográfica
              <select value={settings.editorFont} onChange={(e) => setField('editorFont', e.target.value as AppSettings['editorFont'])} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.45rem' }}>
                <option value="serif">Serif</option>
                <option value="sans">Sistema</option>
                <option value="mono">Monoespaçado</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
              Tamanho da Fonte ({settings.editorFontSize}px)
              <input type="number" min={12} max={28} value={settings.editorFontSize} onChange={(e) => setField('editorFontSize', Number(e.target.value))} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.45rem' }} />
            </label>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
            <input type="checkbox" checked={settings.zenMode} onChange={(e) => setField('zenMode', e.target.checked)} /> Modo Zen (Ocultar barras laterais ao digitar)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
            <input type="checkbox" checked={settings.typewriterMode} onChange={(e) => setField('typewriterMode', e.target.checked)} /> Máquina de Escrever (Manter linha ativa centralizada)
          </label>
        </div>
      )}

      {activeTab === 'a11y' && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={settings.highContrast} onChange={(e) => setField('highContrast', e.target.checked)} /> Alto contraste
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={settings.largeText} onChange={(e) => setField('largeText', e.target.checked)} /> Texto grande na interface
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={settings.reducedMotion} onChange={(e) => setField('reducedMotion', e.target.checked)} /> Movimento reduzido (Desativar animações e transições)
          </label>
        </div>
      )}
    </div>
  );
}
