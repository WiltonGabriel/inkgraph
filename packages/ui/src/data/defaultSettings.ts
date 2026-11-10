import type { AppSettings } from '../types/project';

function detectDefaultDeviceName(): string {
  if (typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    return 'Mobile';
  }
  return 'Desktop';
}

export const DEFAULT_SETTINGS: AppSettings = {
  // 1. Geral & Inicialização
  language: 'pt-BR',
  startupBehavior: 'home',
  defaultOpeningView: 'dashboard',
  autosaveIntervalSeconds: 10,
  confirmDestructiveActions: true,
  onboardingCompleted: false,
  deviceName: detectDefaultDeviceName(),

  // 2. Aparência & Interface
  theme: 'dark',
  uiDensity: 'standard',
  accentColor: '#3b82f6',
  sidebarDefaultCollapsed: false,
  copilotPosition: 'right',
  highContrast: false,
  largeText: false,
  reducedMotion: false,

  // 3. Editor Padrão
  editorFont: 'serif',
  editorFontSize: 17,
  editorLineHeight: 1.8,
  editorMaxWidthCh: 74,
  paragraphIndent: false,
  zenMode: false,
  focusMode: false,
  typewriterMode: false,
  spellcheck: false,
  showWordCountFooter: true,
  showReadingTimeEstimate: true,
  editorMode: 'rich',
  languageToolEnabled: false,
  languageToolUrl: 'http://localhost:8010/v2/check',

  // 4. Inteligência Artificial & MCP (Silencioso / Zero-IA por padrão)
  aiMode: 'off',
  aiProvider: 'mcp',
  geminiApiKey: '',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2:3b',
  mcpServerPort: 3333,
  mcpAutoSyncVault: true,
  mcpGovernance: 'staging_strict',
  mcpToken: '',
  aiTemperature: 0.7,
  aiMaxTokens: 2048,
  copilotEnabled: false,
  copilotHeuristicsOnly: true,

  // 5. Atalhos de Teclado
  shortcuts: {
    commandPalette: 'Ctrl+K',
    openHome: 'Ctrl+Shift+H',
    openSettings: 'Ctrl+,',
    toggleCopilot: 'Ctrl+Shift+C',
    toggleZenMode: 'Ctrl+Shift+Z',
    quickSnapshot: 'Ctrl+Shift+S',
    focusManuscript: 'Alt+1',
    focusGraph: 'Alt+2',
  },

  // 6. Notificações & Avisos Silenciosos
  quietNotifications: true,
  epistemicAlertsInEditor: true,
  dailyGoalReminder: false,

  // 7. Armazenamento, Sync & Backup
  autoSnapshotOnClose: true,
  maxSnapshotsPerWorkspace: 25,
  lanSyncUrl: 'http://127.0.0.1:3333',
  lanSyncToken: '',
  googleDriveClientId: '',
  googleDriveAccessToken: '',
  syncLastHashes: {},
};
