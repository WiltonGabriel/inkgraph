import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AppSettings, KeyboardShortcutMap } from '../types/project';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import {
  loadSettingsFromStorage,
  saveSettingsToStorage,
} from '../domain/storageAdapter';

function shallowEqualRecord(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let diff = 0;
  for (const k of keys) {
    if (a[k] !== b[k]) diff += 1;
  }
  return diff;
}

function countSettingsDiff(draft: AppSettings, committed: AppSettings): number {
  let count = 0;
  const keys = Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[];
  for (const key of keys) {
    if (key === 'shortcuts') {
      count += shallowEqualRecord(
        draft.shortcuts as unknown as Record<string, unknown>,
        committed.shortcuts as unknown as Record<string, unknown>
      );
    } else if (key === 'sidebarCollapsedGroups') {
      count += shallowEqualRecord(
        draft.sidebarCollapsedGroups,
        committed.sidebarCollapsedGroups
      );
    } else if (key === 'hiddenSidebarViews') {
      if (
        JSON.stringify(draft.hiddenSidebarViews) !==
        JSON.stringify(committed.hiddenSidebarViews)
      ) {
        count += 1;
      }
    } else if (draft[key] !== committed[key]) {
      count += 1;
    }
  }
  return count;
}

export interface SettingsContextValue {
  committedSettings: AppSettings;
  draftSettings: AppSettings;
  hasUnsavedChanges: boolean;
  unsavedCount: number;
  lastSavedAt: string | null;
  updateDraftSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateDraftSettings: (patch: Partial<AppSettings>) => void;
  updateDraftShortcut: (key: keyof KeyboardShortcutMap, combo: string) => void;
  commitImmediateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  commitSettingsUpdater: (updater: (prev: AppSettings) => AppSettings) => void;
  saveSettings: () => boolean;
  discardSettingsChanges: () => void;
  resetDraftToDefaults: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [committedSettings, setCommittedSettings] = useState<AppSettings>(() =>
    loadSettingsFromStorage(DEFAULT_SETTINGS)
  );
  const [draftSettings, setDraftSettings] = useState<AppSettings>(committedSettings);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const unsavedCount = useMemo(
    () => countSettingsDiff(draftSettings, committedSettings),
    [draftSettings, committedSettings]
  );

  const updateDraftSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setDraftSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateDraftSettings = useCallback((patch: Partial<AppSettings>) => {
    setDraftSettings((prev) => ({
      ...prev,
      ...patch,
      shortcuts: patch.shortcuts
        ? { ...prev.shortcuts, ...patch.shortcuts }
        : prev.shortcuts,
    }));
  }, []);

  const updateDraftShortcut = useCallback(
    (key: keyof KeyboardShortcutMap, combo: string) => {
      setDraftSettings((prev) => ({
        ...prev,
        shortcuts: { ...prev.shortcuts, [key]: combo },
      }));
    },
    []
  );

  const commitImmediateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setCommittedSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveSettingsToStorage(next);
        return next;
      });
      setDraftSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const commitSettingsUpdater = useCallback(
    (updater: (prev: AppSettings) => AppSettings) => {
      setDraftSettings((prevDraft) => {
        const next = updater(prevDraft);
        setCommittedSettings(next);
        saveSettingsToStorage(next);
        setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
        return next;
      });
    },
    []
  );

  const saveSettings = useCallback((): boolean => {
    const ok = saveSettingsToStorage(draftSettings);
    if (ok) {
      setCommittedSettings(draftSettings);
      setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
    }
    return ok;
  }, [draftSettings]);

  const discardSettingsChanges = useCallback(() => {
    setDraftSettings(committedSettings);
  }, [committedSettings]);

  const resetDraftToDefaults = useCallback(() => {
    setDraftSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      committedSettings,
      draftSettings,
      hasUnsavedChanges: unsavedCount > 0,
      unsavedCount,
      lastSavedAt,
      updateDraftSetting,
      updateDraftSettings,
      updateDraftShortcut,
      commitImmediateSetting,
      saveSettings,
      discardSettingsChanges,
      resetDraftToDefaults,
    }),
    [
      committedSettings,
      draftSettings,
      unsavedCount,
      lastSavedAt,
      updateDraftSetting,
      updateDraftSettings,
      updateDraftShortcut,
      commitImmediateSetting,
      saveSettings,
      discardSettingsChanges,
      resetDraftToDefaults,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
