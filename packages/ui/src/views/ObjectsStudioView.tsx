import { useState } from 'react';
import { ObjectGroupsSidebar } from '../components/objects/ObjectGroupsSidebar';
import { ObjectDetailEditor } from '../components/objects/ObjectDetailEditor';

export function ObjectsStudioView() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 'calc(100vh - 64px)', padding: 14 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          Objetos e Artefatos
        </h2>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
          Gerenciamento de itens narrativos, artefatos, relíquias, portadores e cenas vinculadas
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>
        <ObjectGroupsSidebar
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
        />
        <ObjectDetailEditor selectedGroupId={selectedGroupId} />
      </div>
    </div>
  );
}
export default ObjectsStudioView;
