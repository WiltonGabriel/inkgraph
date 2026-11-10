import type { AppSettings } from '../types/project';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  editorFont: 'serif',
  editorFontSize: 17,
  editorLineHeight: 1.8,
  zenMode: false,
  focusMode: false,
  typewriterMode: false,
  spellcheck: false,
  aiMode: 'hybrid',
  aiProvider: 'mcp',
  geminiApiKey: '',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2:3b',
  aiTemperature: 0.7,
  aiMaxTokens: 2048,
  copilotEnabled: true,
  copilotHeuristicsOnly: false,
};
