import { Users, Shield, Globe, Download, Upload } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function QuickActionsBackupCard() {
  const { project, setActiveView, exportProjectJson, importProjectJson } = useProject();

  const handleDownloadBackup = () => {
    const json = exportProjectJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        backgroundColor: '#121621',
        border: '1px solid #1f2533',
        borderRadius: 10,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#f3f4f6' }}>
          Ações Rápidas & Universo
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <button
            onClick={() => setActiveView('characters')}
            style={{
              padding: '10px',
              backgroundColor: '#171c29',
              border: '1px solid #252c3e',
              borderRadius: 8,
              color: '#e5e7eb',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Users size={15} color="#60a5fa" style={{ marginBottom: 4 }} />
            <div style={{ fontWeight: 600 }}>Personagens</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{project.characters.length} dossiês</div>
          </button>
          <button
            onClick={() => setActiveView('factions')}
            style={{
              padding: '10px',
              backgroundColor: '#171c29',
              border: '1px solid #252c3e',
              borderRadius: 8,
              color: '#e5e7eb',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Shield size={15} color="#f87171" style={{ marginBottom: 4 }} />
            <div style={{ fontWeight: 600 }}>Facções</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{project.factions.length} ordens</div>
          </button>
          <button
            onClick={() => setActiveView('worlds')}
            style={{
              padding: '10px',
              backgroundColor: '#171c29',
              border: '1px solid #252c3e',
              borderRadius: 8,
              color: '#e5e7eb',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Globe size={15} color="#10b981" style={{ marginBottom: 4 }} />
            <div style={{ fontWeight: 600 }}>Mundos</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>
              {project.worlds[0]?.locations.length ?? 0} locais
            </div>
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid #1e2433',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
          Backup e restauração instantânea:
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleDownloadBackup}
            style={{
              padding: '6px 10px',
              backgroundColor: '#19202e',
              border: '1px solid #2c3548',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 11.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Download size={12} /> Exportar JSON
          </button>
          <label
            style={{
              padding: '6px 10px',
              backgroundColor: '#19202e',
              border: '1px solid #2c3548',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 11.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Upload size={12} /> Importar JSON
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const r = new FileReader();
                r.onload = (ev) => importProjectJson(String(ev.target?.result ?? ''));
                r.readAsText(file);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
