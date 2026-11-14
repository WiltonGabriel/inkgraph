import {
  REL_COLORS,
  REL_LABELS_PT,
  type GraphNode,
  type GraphLink,
} from './graphDataBuilder';

interface GraphTableViewProps {
  links: GraphLink[];
  allEntities: GraphNode[];
  onSelectNode?: (id: string) => void;
}

export function GraphTableView({
  links,
  allEntities,
  onSelectNode,
}: GraphTableViewProps) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-labelledby="graph-table-heading"
      style={{
        padding: 20,
        overflow: 'auto',
        height: '100%',
        flex: 1,
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      <h3
        id="graph-table-heading"
        style={{
          margin: '0 0 12px',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        Relacionamentos como Tabela Acessível ({links.length})
      </h3>
      <table
        style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontSize: 12.5,
          color: 'var(--text-primary)',
        }}
      >
        <caption
          style={{
            textAlign: 'left',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            marginBottom: 8,
          }}
        >
          Lista tabular de vínculos ativos no grafo por origem, destino, tipo e força.
        </caption>
        <thead
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <tr
            style={{
              textAlign: 'left',
              color: 'var(--text-secondary)',
            }}
          >
            <th scope="col" style={thStyle}>
              De
            </th>
            <th scope="col" style={thStyle}>
              Para
            </th>
            <th scope="col" style={thStyle}>
              Tipo
            </th>
            <th scope="col" style={thStyle}>
              Descrição do Vínculo
            </th>
            <th scope="col" style={thStyle}>
              Força (1–10)
            </th>
          </tr>
        </thead>
        <tbody>
          {links.map((l) => {
            const srcId = typeof l.source === 'object' ? l.source.id : l.source;
            const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
            const srcName = allEntities.find((e) => e.id === srcId)?.name ?? srcId;
            const tgtName = allEntities.find((e) => e.id === tgtId)?.name ?? tgtId;
            const dotColor = REL_COLORS[l.type] ?? 'var(--text-muted)';
            return (
              <tr key={l.id}>
                <th scope="row" style={{ ...tdStyle, fontWeight: 600, textAlign: 'left' }}>
                  {onSelectNode ? (
                    <button
                      type="button"
                      onClick={() => onSelectNode(String(srcId))}
                      style={entityLinkBtnStyle}
                    >
                      {srcName}
                    </button>
                  ) : (
                    srcName
                  )}
                </th>
                <td style={{ ...tdStyle, fontWeight: 600 }}>
                  {onSelectNode ? (
                    <button
                      type="button"
                      onClick={() => onSelectNode(String(tgtId))}
                      style={entityLinkBtnStyle}
                    >
                      {tgtName}
                    </button>
                  ) : (
                    tgtName
                  )}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm, 4px)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        flexShrink: 0,
                      }}
                    />
                    {REL_LABELS_PT[l.type] ?? l.type}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{l.label}</td>
                <td style={tdStyle}>{l.strength}/10</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--border-subtle)',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--border-subtle)',
};

const entityLinkBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  color: 'var(--text-primary)',
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer',
};
