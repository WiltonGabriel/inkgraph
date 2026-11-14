import { BookOpen, Kanban, PlusCircle, Users, Menu } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function MobileBottomNav() {
  const {
    activeView,
    setActiveView,
    setShowQuickCapture,
    setShowMobileSidebar,
    t,
  } = useProject();

  const btnStyle = (active: boolean) => ({
    flex: 1,
    minHeight: 48,
    backgroundColor: 'transparent',
    color: active ? '#60a5fa' : '#9ca3af',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    fontSize: 10.5,
    fontWeight: active ? 700 : 500,
    padding: '4px 2px',
  });

  return (
    <nav
      aria-label="Navegação móvel"
      style={{
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid var(--border)',
        backgroundColor: '#0c0e14',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={() => setActiveView('manuscript')}
        style={btnStyle(activeView === 'manuscript')}
      >
        <BookOpen size={17} />
        <span>{t.views.manuscript}</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveView('plotboard')}
        style={btnStyle(activeView === 'plotboard')}
      >
        <Kanban size={17} />
        <span>{t.views.plotboard.split(' ')[0]}</span>
      </button>

      <button
        type="button"
        onClick={() => setShowQuickCapture(true)}
        style={{
          ...btnStyle(false),
          color: '#34d399',
          fontWeight: 700,
        }}
      >
        <PlusCircle size={19} />
        <span>{t.quickCapture.buttonLabel}</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveView('characters')}
        style={btnStyle(activeView === 'characters' || activeView === 'worlds')}
      >
        <Users size={17} />
        <span>{t.views.characters}</span>
      </button>

      <button
        type="button"
        onClick={() => setShowMobileSidebar(true)}
        style={btnStyle(false)}
      >
        <Menu size={17} />
        <span>{t.common.menu}</span>
      </button>
    </nav>
  );
}
