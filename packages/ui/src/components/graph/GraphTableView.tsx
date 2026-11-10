import { REL_COLORS, type GraphNode, type GraphLink } from './graphDataBuilder';

interface GraphTableViewProps {
  links: GraphLink[];
  allEntities: GraphNode[];
}

export function GraphTableView({ links, allEntities }: GraphTableViewProps) {
  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%', flex: 1 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#f3f4f6' }}>
        Relacionamentos como Tabela Acessível ({links.length})
      </h3>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 12.5,
          color: '#e5e7eb',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid #242b3d', textAlign: 'left', color: '#9ca3af' }}>
            <th style={{ padding: '8px 10px' }}>De</th>
            <th style={{ padding: '8px 10px' }}>Para</th>
            <th style={{ padding: '8px 10px' }}>Tipo</th>
            <th style={{ padding: '8px 10px' }}>Descrição do Vínculo</th>
            <th style={{ padding: '8px 10px' }}>Força (1–10)</th>
          </tr>
        </thead>
        <tbody>
          {links.map((l) => {
            const srcId = typeof l.source === 'object' ? l.source.id : l.source;
            const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
            const srcName = allEntities.find((e) => e.id === srcId)?.name ?? srcId;
            const tgtName = allEntities.find((e) => e.id === tgtId)?.name ?? tgtId;
            return (
              <tr key={l.id} style={{ borderBottom: '1px solid #181d29' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{srcName}</td>
                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{tgtName}</td>
                <td style={{ padding: '8px 10px' }}>
                  <span
                    style={{
                      padding: '2px 7px',
                      borderRadius: 4,
                      backgroundColor: '#182032',
                      color: REL_COLORS[l.type] ?? '#9ca3af',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {l.type}
                  </span>
                </td>
                <td style={{ padding: '8px 10px', color: '#d1d5db' }}>{l.label}</td>
                <td style={{ padding: '8px 10px' }}>{l.strength}/10</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
