import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  ListTree,
  Kanban,
  Clock,
  FileText,
  Radar,
  Users,
  Globe,
  Shield,
  Network,
  Package,
  Share2,
  ShieldAlert,
  Feather,
  Eye,
  TrendingUp,
  GitBranch,
  Download,
} from 'lucide-react';
import type { AppDictionary } from '../../i18n/translations';
import type { ProjectData, ViewId } from '../../types/project';
import {
  getEffectiveEntitySchemas,
  isModuleEnabled,
  listCustomEntitySidebarEntries,
} from '../../domain/registry';
import { resolveEntityIcon } from '../common/entityIconResolver';

export interface SidebarNavItemData {
  id: ViewId;
  customEntityTypeId?: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

export interface SidebarNavGroup {
  key: 'planning' | 'charactersNetwork' | 'universe' | 'writing' | 'review';
  label: string;
  items: SidebarNavItemData[];
}

export function buildSidebarGroups(
  t: AppDictionary,
  project: ProjectData,
  hiddenViews: ViewId[]
): SidebarNavGroup[] {
  const hiddenSet = new Set(hiddenViews);
  const pendingProposals = project.stagingProposals.filter((p) => p.status === 'pending').length;
  const schemas = getEffectiveEntitySchemas(project);
  const customEntries = listCustomEntitySidebarEntries(project);

  const rawGroups: SidebarNavGroup[] = [
    {
      key: 'writing',
      label: t.sidebarGroups.writing,
      items: [
        { id: 'manuscript', label: t.views.manuscript, icon: BookOpen, badge: project.scenes.length },
        { id: 'writer', label: t.views.writer, icon: Sparkles },
      ],
    },
    {
      key: 'planning',
      label: t.sidebarGroups.planning,
      items: [
        { id: 'dashboard', label: t.views.dashboard, icon: LayoutDashboard },
        { id: 'outline', label: t.views.outline, icon: ListTree },
        { id: 'plotboard', label: t.views.plotboard, icon: Kanban },
        { id: 'timeline', label: t.views.timeline, icon: Clock },
        { id: 'scenario', label: t.views.scenario, icon: FileText },
        { id: 'canon-radar', label: t.views['canon-radar'], icon: Radar },
      ],
    },
    {
      key: 'review',
      label: t.sidebarGroups.review,
      items: [
        { id: 'consistency', label: t.views.consistency, icon: ShieldAlert },
        { id: 'critic', label: t.views.critic, icon: Feather },
        { id: 'preview', label: t.views.preview, icon: Eye },
        { id: 'progress', label: t.views.progress, icon: TrendingUp },
        {
          id: 'versions',
          label: t.views.versions,
          icon: GitBranch,
          badge: pendingProposals || undefined,
        },
        { id: 'export', label: t.views.export, icon: Download },
      ],
    },
    {
      key: 'charactersNetwork',
      label: t.sidebarGroups.charactersNetwork,
      items: [
        {
          id: 'characters',
          label: schemas.character?.pluralLabel || t.views.characters,
          icon: Users,
          badge: project.characters.length,
        },
        { id: 'graph', label: t.views.graph, icon: Network },
        { id: 'mindmap', label: t.views.mindmap, icon: Share2 },
      ],
    },
    {
      key: 'universe',
      label: t.sidebarGroups.universe,
      items: [
        { id: 'worlds', label: t.views.worlds, icon: Globe },
        {
          id: 'factions',
          label: schemas.faction?.pluralLabel || t.views.factions,
          icon: Shield,
          badge: project.factions.length,
        },
        {
          id: 'objects',
          label: schemas.object?.pluralLabel || t.views.objects,
          icon: Package,
          badge: project.objects.length,
        },
        ...customEntries.map(({ typeDef, count }) => ({
          id: 'custom-entity' as ViewId,
          customEntityTypeId: typeDef.id,
          label: typeDef.pluralLabel || typeDef.label,
          icon: resolveEntityIcon(typeDef.iconName),
          badge: count > 0 ? count : undefined,
        })),
      ],
    },
  ];

  return rawGroups
    .map((grp) => ({
      ...grp,
      items: grp.items.filter(
        (item) =>
          item.customEntityTypeId
            ? !hiddenSet.has(item.id)
            : !hiddenSet.has(item.id) && isModuleEnabled(project, item.id)
      ),
    }))
    .filter((grp) => grp.items.length > 0);
}
