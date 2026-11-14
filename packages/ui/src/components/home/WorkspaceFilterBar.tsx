import { Search, LayoutGrid, List } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export type WorkspaceFilterTab = 'all' | 'favorites' | 'recent' | 'archived';
export type WorkspaceViewMode = 'grid' | 'list';

interface WorkspaceFilterBarProps {
  activeTab: WorkspaceFilterTab;
  onTabChange: (tab: WorkspaceFilterTab) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: WorkspaceViewMode;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
}

export function WorkspaceFilterBar({
  activeTab,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  categories,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: WorkspaceFilterBarProps) {
  const { t } = useProject();

  const tabs: { id: WorkspaceFilterTab; label: string }[] = [
    { id: 'all', label: t.common.all },
    { id: 'favorites', label: t.common.favorites },
    { id: 'recent', label: t.common.recent },
    { id: 'archived', label: t.common.archived },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14,
      }}
    >
      {/* Left: Filter Tabs + Category/Genre Select */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-surface, #111623)',
            border: '1px solid var(--border-subtle, #263046)',
            borderRadius: 'var(--radius-sm, 7px)',
            padding: 3,
            gap: 2,
          }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                style={{
                  padding: '5px 11px',
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  borderRadius: 5,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: active ? 'var(--accent-primary, #3b82f6)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Tag/Genre Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{
            backgroundColor: 'var(--bg-surface, #111623)',
            border: '1px solid var(--border-subtle, #263046)',
            borderRadius: 'var(--radius-sm, 7px)',
            padding: '6px 10px',
            fontSize: 12,
            color: 'var(--text-primary, #f1f5f9)',
            cursor: 'pointer',
          }}
        >
          <option value="all">{t.common.all}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Search Input + Grid/List Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 260px', justifyContent: 'flex-end' }}>
        <div
          style={{
            position: 'relative',
            flex: '1 1 220px',
            maxWidth: 320,
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted, #64748b)',
            }}
          />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.home.filterSearchPlaceholder}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-surface, #111623)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 'var(--radius-sm, 7px)',
              padding: '6px 10px 6px 30px',
              fontSize: 12,
              color: 'var(--text-primary, #f1f5f9)',
            }}
          />
        </div>

        {/* Grid vs List View Toggle */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-surface, #111623)',
            border: '1px solid var(--border-subtle, #263046)',
            borderRadius: 'var(--radius-sm, 7px)',
            padding: 2,
            gap: 2,
          }}
        >
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title={t.common.gridView}
            style={{
              padding: '5px 8px',
              borderRadius: 5,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              backgroundColor:
                viewMode === 'grid'
                  ? 'var(--bg-elevated, #171d2e)'
                  : 'transparent',
              color:
                viewMode === 'grid'
                  ? 'var(--text-primary, #f1f5f9)'
                  : 'var(--text-secondary, #94a3b8)',
            }}
          >
            <LayoutGrid size={13} />
            {t.common.gridView}
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title={t.common.listView}
            style={{
              padding: '5px 8px',
              borderRadius: 5,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              backgroundColor:
                viewMode === 'list'
                  ? 'var(--bg-elevated, #171d2e)'
                  : 'transparent',
              color:
                viewMode === 'list'
                  ? 'var(--text-primary, #f1f5f9)'
                  : 'var(--text-secondary, #94a3b8)',
            }}
          >
            <List size={13} />
            {t.common.listView}
          </button>
        </div>
      </div>
    </div>
  );
}
