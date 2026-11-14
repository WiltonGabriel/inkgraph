export type ViewId =
  | 'dashboard'
  | 'manuscript'
  | 'writer'
  | 'templates'
  | 'outline'
  | 'plotboard'
  | 'timeline'
  | 'scenario'
  | 'canon-radar'
  | 'characters'
  | 'worlds'
  | 'factions'
  | 'graph'
  | 'objects'
  | 'mindmap'
  | 'consistency'
  | 'critic'
  | 'preview'
  | 'progress'
  | 'versions'
  | 'export'
  | 'custom-entity'
  | 'workspace-settings'
  | 'settings'
  | 'help';

export type RelationshipType =
  | 'family'
  | 'romantic'
  | 'friend'
  | 'enemy'
  | 'mentor'
  | 'rival'
  | 'ally'
  | 'acquaintance'
  | 'vassal'
  | 'sovereign'
  | 'trade'
  | 'war'
  | 'infiltrator'
  | 'exiled_member';

export interface EntityRelationship {
  id: string;
  targetId: string;
  targetKind: 'character' | 'faction' | 'location' | 'system' | 'object' | (string & {});
  type: RelationshipType;
  label: string;
  strength: number; // 1 to 10
  sentiment: number; // -1.0 to 1.0
  sinceScene?: string;
  notes?: string;
}

export interface EpistemicSecret {
  id: string;
  secret: string;
  knownByIds: string[];
  revealedInSceneId?: string;
}

export type CharacterArchetype =
  | 'hero'
  | 'mentor'
  | 'villain'
  | 'shadow'
  | 'trickster'
  | 'shapeshifter'
  | 'herald'
  | 'ally'
  | 'threshold-guardian';

export interface Character {
  id: string;
  name: string;
  aliases: string[];
  role: string;
  archetype: CharacterArchetype;
  status: 'canon' | 'provisional' | 'draft';
  factionId?: string;
  locationId?: string;
  age?: string;
  avatarColor: string;
  appearance: string;
  backstory: string;
  motivation: string;
  personalityTraits: string;
  flaws: string;
  want: string;
  need: string;
  lieBelieved: string;
  ghost: string;
  arcAct1: string;
  arcAct2: string;
  arcAct3: string;
  characterArc: string;
  notes: string;
  tags: string[];
  relationships: EntityRelationship[];
  epistemicSecrets: EpistemicSecret[];
  customAttributes?: Record<string, unknown>;
}

export interface FactionRank {
  id: string;
  title: string;
  authorityLevel: number;
  holderIds: string[];
  responsibilities: string;
}

export interface Faction {
  id: string;
  name: string;
  aliases: string[];
  subtype: string; // e.g., Ordem Militar, Império, Sindicato, Culto, Corporação
  motto: string;
  color: string;
  status: 'canon' | 'provisional' | 'draft';
  headquartersLocationId?: string;
  leaderCharacterId?: string;
  publicAgenda: string;
  secretAgenda: string;
  doctrine: string;
  history: string;
  resourcesAndPower: string;
  internalConflicts: string;
  notes: string;
  ranks: FactionRank[];
  controlledLocationIds: string[];
  tags: string[];
  relationships: EntityRelationship[];
  epistemicSecrets: EpistemicSecret[];
  customAttributes?: Record<string, unknown>;
}

export type CanonStatus = 'canon' | 'provisional' | 'draft';

export interface WorldLocation {
  id: string;
  worldId: string;
  name: string;
  aliases?: string[];
  type: 'city' | 'fortress' | 'village' | 'ruin' | 'temple' | 'region' | 'station' | 'other';
  status?: CanonStatus;
  folderPath?: string;
  controlledByFactionId?: string;
  population?: string;
  climateOrAtmosphere: string;
  description: string;
  strategicValue: string;
  coordinates: { x: number; y: number }; // 0-100 % on map canvas
  mapAssetId?: string;
  blueprintAssetId?: string;
  connectedLocationIds: string[];
  notes: string;
  tags?: string[];
  memberOf?: string[];
  relationships?: EntityRelationship[];
  epistemicSecrets?: EpistemicSecret[];
  customAttributes?: Record<string, unknown>;
}

export interface WorldTimelineEvent {
  id: string;
  worldId: string;
  era: string;
  year: string;
  title: string;
  description: string;
  locationId?: string;
  factionIds: string[];
  characterIds: string[];
  impactLevel: 'low' | 'medium' | 'high' | 'cataclysmic';
}

export interface RuleSystem {
  id: string;
  worldId: string;
  name: string;
  aliases?: string[];
  subtype: string; // e.g., Sistema de Magia, Cyberware, Código Jurídico, Viagem Espacial, Economia
  status?: CanonStatus;
  folderPath?: string;
  coreSource: string;
  fundamentalRules: string[];
  costsAndToll: string;
  hardLimits: string[];
  socialTaboos: string;
  knownPractitionerIds: string[];
  notes: string;
  tags?: string[];
  memberOf?: string[];
  relationships?: EntityRelationship[];
  epistemicSecrets?: EpistemicSecret[];
  customAttributes?: Record<string, unknown>;
}

export interface WorldPoliticsProfile {
  governmentForms: string;
  legalCodeAndPunishments: string;
  successionRules: string;
  treatiesAndAlliances: string;
  instabilityZones: string;
}

export interface WorldEconomyProfile {
  currenciesAndExchange: string;
  exportsAndImports: string;
  tradeRoutes: string;
  guildsBanksAndTaxes: string;
  scarcityAndBlackMarket: string;
}

export interface WorldMapAssetMeta {
  id: string;
  worldId: string;
  name: string;
  category: 'world' | 'geography' | 'political' | 'trade' | 'systems' | 'blueprint';
  mimeType: string;
  width?: number;
  height?: number;
  isPrimary?: boolean;
  createdAt: string;
}

export interface World {
  id: string;
  name: string;
  premise: string;
  description: string;
  geography: string;
  culture: string;
  history: string;
  magicOrTechSummary: string;
  politicsSummary: string;
  politics?: WorldPoliticsProfile;
  economySummary?: string;
  economy?: WorldEconomyProfile;
  notes: string;
  locations: WorldLocation[];
  timeline: WorldTimelineEvent[];
  systems: RuleSystem[];
  maps?: WorldMapAssetMeta[];
}

export type StoryObjectType =
  | 'artifact'
  | 'weapon'
  | 'document'
  | 'prop'
  | 'vehicle'
  | 'place-item'
  | 'other';

export interface ObjectGroup {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface StoryObject {
  id: string;
  name: string;
  aliases?: string[];
  type: StoryObjectType;
  canonStatus?: CanonStatus;
  folderPath?: string;
  groupId?: string;
  ownerCharacterId?: string;
  factionId?: string;
  locationId?: string;
  status: string;
  description: string;
  significance: string;
  rulesOrCapabilities: string;
  linkedCharacterIds: string[];
  linkedSceneIds: string[];
  notes: string;
  tags?: string[];
  memberOf?: string[];
  relationships?: EntityRelationship[];
  epistemicSecrets?: EpistemicSecret[];
  customAttributes?: Record<string, unknown>;
}

export interface SceneComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  replies: { id: string; author: string; text: string; createdAt: string }[];
}

export interface SceneRevision {
  id: string;
  label: string;
  content: string;
  wordCount: number;
  createdAt: string;
}

export type SceneStatus = 'outline' | 'draft' | 'first-draft' | 'revised' | 'final';

export interface Scene {
  id: string;
  chapterNumber: number;
  title: string;
  summary: string;
  content: string;
  act: number;
  status: SceneStatus;
  povCharacterId?: string;
  locationId?: string;
  sceneStart?: string; // ISO-like string or story date
  sceneDuration?: string; // e.g. PT2H, 3 dias
  tension: number; // 0-100
  subplotIds: string[];
  characterIds: string[];
  objectIds: string[];
  secretsRevealed: string[];
  notes: string;
  position: { x: number; y: number }; // For 2D Canvas mode in PlotBoard
  comments: SceneComment[];
  revisions: SceneRevision[];
  lastEditedAt: string;
  customAttributes?: Record<string, unknown>;
}

export interface OutlineSection {
  id: string;
  title: string;
  description: string;
  act: number;
  isTwist?: boolean;
  targetWords?: number;
}

export interface Subplot {
  id: string;
  name: string;
  color: string;
  description: string;
  sceneIds: string[];
}

export type PlotConnectionType =
  | 'cause-effect'
  | 'character-arc'
  | 'parallel'
  | 'subplot'
  | 'temporal';

export interface PlotConnection {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  type: PlotConnectionType;
  label?: string;
}

export interface BinderItem {
  id: string;
  parentId: string | null;
  type: 'folder' | 'note' | 'link' | 'file';
  title: string;
  content: string;
  url?: string;
  linkedSceneIds: string[];
  createdAt: string;
}

export type MindMapNodeShape = 'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'hexagon';

export interface MindMapNode {
  id: string;
  label: string;
  type: 'free' | 'linked';
  linkedEntityKind?: 'character' | 'faction' | 'location' | 'object' | 'scene';
  linkedEntityId?: string;
  shape: MindMapNodeShape;
  color: string;
  x: number;
  y: number;
  notes: string;
}

export interface MindMapEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  style: 'solid' | 'dotted';
  direction: 'uni' | 'bi';
}

export interface MindMap {
  id: string;
  name: string;
  description: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface Branch {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  scenesBackup?: Scene[];
  snapshotData?: string;
}

export interface Snapshot {
  id: string;
  branchId: string;
  label: string;
  createdAt: string;
  wordCount: number;
  scenesBackup: Scene[];
}

export interface StagingProposal {
  id: string;
  fileName: string;
  targetPath: string;
  canonicalPath: string;
  entityType: 'character' | 'faction' | 'location' | 'system' | 'scene' | 'item';
  entityName: string;
  action: 'create' | 'update';
  rationale: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  epistemicImpact: string[];
  proposedFrontmatter: Record<string, unknown>;
  proposedMarkdown: string;
  existingMarkdown?: string;
}

export interface WritingLogEntry {
  date: string; // YYYY-MM-DD
  wordsWritten: number;
  minutesSpent: number;
}

export interface CompileProfile {
  authorName: string;
  titlePageText: string;
  dedication: string;
  acknowledgements: string;
  imprint: string;
}

export type ThemeBrightness = 'light' | 'dark' | 'sepia' | 'system';
export type ThemePaletteId =
  | 'slate'
  | 'obsidian'
  | 'paper'
  | 'forest'
  | 'amethyst'
  | 'sunset';
export type UiFontFamily = 'sans' | 'serif' | 'mono' | 'humanist';
export type CornerStyle = 'sharp' | 'subtle' | 'rounded';
export type SurfaceStyle = 'bordered' | 'elevated' | 'minimal';
export type SidebarIndicatorStyle = 'pill' | 'bar' | 'dot';
export type StatusColorSet = 'default' | 'vibrant' | 'muted' | 'colorblind';
export type CanonAiPermission = 'observer' | 'staging' | 'auto';

export interface KeyboardShortcutMap {
  // Navegação & Painéis
  commandPalette: string;
  toggleSidebar: string;
  toggleCopilot: string;
  toggleZenMode: string;
  openHome: string;
  openSettings: string;
  openHelp: string;

  // Pulos Rápidos de Visão
  focusDashboard: string;
  focusOutline: string;
  focusTimeline: string;
  focusPlotBoard: string;
  focusCanonRadar: string;
  focusCharacters: string;
  focusGraph: string;
  focusMindMap: string;
  focusWorld: string;
  focusFactions: string;
  focusObjects: string;
  focusManuscript: string;
  focusReview: string;

  // Escrita & Editor Markdown
  cycleEditorMode: string;
  toggleSceneInspector: string;
  quickNewScene: string;
  quickSnapshot: string;

  // Grafo, Mapa Mental & Cânone
  fitGraphOrMap: string;
  scanCanonNow: string;
}

export interface AppSettings {
  // 1. Geral & Inicialização
  language: 'pt-BR' | 'en';
  startupBehavior: 'home' | 'last-workspace';
  startupRestoreLastViewAndScene: boolean;
  defaultOpeningView: ViewId;
  writingDayRolloverHour: number;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  autosaveIntervalSeconds: number;
  confirmDestructiveActions: boolean;

  // 2. Aparência & Interface
  theme: 'dark' | 'light' | 'sepia';
  themeBrightness: ThemeBrightness;
  themePalette: ThemePaletteId;
  uiDensity: 'compact' | 'standard' | 'comfortable';
  uiFont: UiFontFamily;
  uiScale: number;
  cornerRadius: CornerStyle;
  surfaceStyle: SurfaceStyle;
  sidebarIndicator: SidebarIndicatorStyle;
  accentColor: string;
  statusColorSet: StatusColorSet;
  sidebarDefaultCollapsed: boolean;
  sidebarCollapsedGroups: Record<string, boolean>;
  hiddenSidebarViews: ViewId[];
  copilotPosition: 'right' | 'left';
  graphGridEnabled: boolean;
  graphDimIntensity: number;
  enableAnimations: boolean;
  lowPowerMode: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;

  // 3. Editor Padrão
  markdownEditorDefaultMode: 'write' | 'markdown' | 'split' | 'read';
  editorFont: 'serif' | 'sans' | 'mono';
  editorFontSize: number;
  editorLineHeight: number;
  editorParagraphSpacingPx: number;
  editorTextAlign: 'left' | 'justify';
  editorMaxWidthCh: number;
  paragraphIndent: boolean;
  editorSmartTypography: boolean;
  enableMarkdownLivePreview: boolean;
  zenMode: boolean;
  focusMode: boolean;
  typewriterMode: boolean;
  spellcheck: boolean;
  showWordCountFooter: boolean;
  showReadingTimeEstimate: boolean;

  // 4. Inteligência Artificial, Memória & MCP
  aiMode: 'cloud' | 'local' | 'hybrid' | 'eco';
  aiProvider: 'gemini' | 'ollama' | 'openai' | 'mcp';
  geminiApiKey: string;
  ollamaUrl: string;
  ollamaModel: string;
  mcpServerPort: number;
  mcpAutoSyncVault: boolean;
  aiTemperature: number;
  aiMaxTokens: number;
  copilotEnabled: boolean;
  copilotHeuristicsOnly: boolean;
  enableMemoryCompiler: boolean;
  enableEpistemicTracking: boolean;
  canonAiPermission: CanonAiPermission;
  canonScopeEntities: boolean;
  canonScopeWorld: boolean;
  canonScopeGraphTimeline: boolean;

  // 5. Atalhos de Teclado
  shortcuts: KeyboardShortcutMap;

  // 6. Notificações & Avisos Silenciosos
  quietNotifications: boolean;
  epistemicAlertsInEditor: boolean;
  dailyGoalReminder: boolean;

  // 7. Armazenamento & Backup
  autoSnapshotOnClose: boolean;
  maxSnapshotsPerWorkspace: number;
}

export interface ActDefinition {
  number: number;
  title: string;
  color: string;
  description?: string;
}

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'boolean'
  | 'tags'
  | 'entity_ref';

export interface CustomFieldSchema {
  key: string;
  label: string;
  type: CustomFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  targetEntityType?: string;
  group?: string;
  completenessWeight?: number;
  includeInMemory?: boolean;
}

export interface EntityTypeDefinition {
  id: string;
  label: string;
  pluralLabel: string;
  iconName: string;
  color: string;
  isBuiltin: boolean;
  builtinTarget?: 'character' | 'faction' | 'location' | 'rule_system' | 'object';
  mentionPrefix?: string;
  hiddenNativeFields: string[];
  hiddenCustomFields?: string[];
  requiredNativeFields?: string[];
  customFields: CustomFieldSchema[];
  sourcePluginId?: string;
}

export interface PluginSnippetDefinition {
  id: string;
  label: string;
  description?: string;
  markdown: string;
}

export interface PluginConsistencyRule {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'error';
  pattern: string;
  flags?: string;
  message: string;
  target?: 'scenes' | 'entities' | 'all';
}

export interface InkGraphPluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  enabled: boolean;
  isBuiltinSample?: boolean;
  entityTypes?: EntityTypeDefinition[];
  fieldExtensions?: {
    targetType: string;
    fields: CustomFieldSchema[];
  }[];
  narrativeTemplates?: {
    id: string;
    name: string;
    genre: string;
    description: string;
    acts: ActDefinition[];
    sections: {
      title: string;
      description: string;
      act: number;
      isTwist?: boolean;
    }[];
  }[];
  snippets?: PluginSnippetDefinition[];
  consistencyRules?: PluginConsistencyRule[];
  settingsSchema?: CustomFieldSchema[];
  settingsValues?: Record<string, unknown>;
}

export interface GenericEntityRecord {
  id: string;
  entityTypeId: string;
  name: string;
  aliases: string[];
  status: CanonStatus;
  summary: string;
  notes: string;
  tags: string[];
  customAttributes: Record<string, unknown>;
  relationships: EntityRelationship[];
  epistemicSecrets: EpistemicSecret[];
  updatedAt: string;
}

export interface WorkspaceAgentConfig {
  customSystemPrompt: string;
  writingVoiceAndTone: string;
  autoInjectEntitySchemasInPrompt: boolean;
  autoInjectCanonRulesInPrompt: boolean;
  allowedAiCapabilities: {
    readCanonAndEpistemic: boolean;
    proposeStaging: boolean;
    directDraftEdits: boolean;
    analyzeConsistency: boolean;
  };
  externalIntegrations: {
    mcpTransportEnabled: boolean;
    preferredModelLabel: string;
    webhookOrEndpointUrl?: string;
  };
}

export interface WorkspaceConfig {
  schemaVersion: number;
  activeTemplateId?: string;
  acts: ActDefinition[];
  disabledModules: string[];
  entitySchemas: Record<string, EntityTypeDefinition>;
  plugins: InkGraphPluginManifest[];
  canonSettings: {
    requireStagingForCopilot: boolean;
    autoTrackEpistemic: boolean;
    strictEntityRefs: boolean;
  };
  agentConfig?: WorkspaceAgentConfig;
}

export interface WorkspaceTemplateBundle {
  format: 'inkgraph-workspace-template';
  schemaVersion: number;
  name: string;
  description: string;
  exportedAt: string;
  genre: string;
  workspaceConfig: WorkspaceConfig;
  compileProfile: CompileProfile;
}

export interface ProjectData {
  id: string;
  title: string;
  logline: string;
  genre: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  folderOrTag?: string;
  accentColor?: string;
  lastOpenedAt?: string;
  wordCountGoal: number;
  dailyWordGoal: number;
  weeklyWordGoal: number;
  deadline?: string; // YYYY-MM-DD
  characters: Character[];
  factions: Faction[];
  worlds: World[];
  objects: StoryObject[];
  objectGroups: ObjectGroup[];
  scenes: Scene[];
  outline: OutlineSection[];
  subplots: Subplot[];
  plotConnections: PlotConnection[];
  binder: BinderItem[];
  mindMaps: MindMap[];
  branches: Branch[];
  activeBranchId: string;
  snapshots: Snapshot[];
  stagingProposals: StagingProposal[];
  writingLogs: WritingLogEntry[];
  compileProfile: CompileProfile;
  workspaceConfig?: WorkspaceConfig;
  customEntities?: Record<string, GenericEntityRecord[]>;
  updatedAt: string;
}

export {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  calculateWorldCompleteness,
  calculateGenericEntityCompleteness,
} from '../domain/completenessCalculator';
export { countWords } from '../domain/wordCounter';
