import { useState } from 'react';
import { X, Layers, Cpu, HardDrive, Network, GitBranch, Check } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function GuidedOnboardingModal() {
  const { settings, updateSettings, completeOnboarding, storageKind, t } = useProject();
  const [step, setStep] = useState(0);

  const steps = t.onboarding.steps;
  const current = steps[step] ?? steps[0];
  const isLast = step === steps.length - 1;

  const selectAiProfile = (mode: 'off' | 'local' | 'hybrid') => {
    updateSettings((prev) => ({
      ...prev,
      aiMode: mode,
      aiProvider: mode === 'local' ? 'ollama' : mode === 'hybrid' ? 'gemini' : 'mcp',
      copilotEnabled: mode !== 'off',
      copilotHeuristicsOnly: mode !== 'hybrid',
    }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.onboarding.badge}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        backgroundColor: 'rgba(6, 8, 13, 0.82)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="var(--accent)" />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              INKGRAPH · {t.onboarding.badge}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              ({t.onboarding.stepOf} {step + 1}/{steps.length})
            </span>
          </div>

          <button
            type="button"
            onClick={completeOnboarding}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '5px 10px',
              fontSize: 11.5,
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <X size={13} />
            {t.onboarding.skipBtn}
          </button>
        </div>

        {/* Step progress strip */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 4, padding: '10px 18px 0' }}>
          {steps.map((s, idx) => (
            <div
              key={s.title}
              style={{
                height: 3,
                borderRadius: 999,
                backgroundColor: idx <= step ? 'var(--accent)' : 'var(--bg-card)',
              }}
            />
          ))}
        </div>

        {/* Step Content */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {current.title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              {current.subtitle}
            </p>
          </div>

          {/* Step 1 Interactive Controls: Language + AI Mode */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['pt-BR', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => updateSettings((prev) => ({ ...prev, language: lang }))}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 7,
                      border: settings.language === lang ? '1px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: settings.language === lang ? 'rgba(59, 130, 246, 0.14)' : 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    {lang === 'pt-BR' ? 'Português (Brasil)' : 'English'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                {[
                  {
                    id: 'off' as const,
                    title: t.onboarding.modeLabels.offTitle,
                    desc: t.onboarding.modeLabels.offDesc,
                  },
                  {
                    id: 'local' as const,
                    title: t.onboarding.modeLabels.localTitle,
                    desc: t.onboarding.modeLabels.localDesc,
                  },
                  {
                    id: 'hybrid' as const,
                    title: t.onboarding.modeLabels.cloudTitle,
                    desc: t.onboarding.modeLabels.cloudDesc,
                  },
                ].map((opt) => {
                  const selected =
                    opt.id === 'off'
                      ? settings.aiMode === 'off' || settings.aiMode === 'eco'
                      : opt.id === 'local'
                        ? settings.aiMode === 'local'
                        : settings.aiMode === 'hybrid' || settings.aiMode === 'cloud';
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => selectAiProfile(opt.id)}
                      style={{
                        textAlign: 'left',
                        padding: 11,
                        borderRadius: 8,
                        border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
                        backgroundColor: selected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span>{opt.title}</span>
                        {selected && <Check size={14} color="var(--accent)" />}
                      </div>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 Interactive Controls: Device Label & Storage */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 8, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600 }}>
                <HardDrive size={15} color="var(--accent)" />
                <span>
                  {settings.language === 'en' ? 'Active Local Engine:' : 'Motor Local Ativo:'}{' '}
                  <code>{storageKind}</code>
                </span>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {settings.language === 'en' ? 'Device Name (for cross-device resume)' : 'Nome deste aparelho (para retomar sessões)'}
                </span>
                <input
                  value={settings.deviceName}
                  onChange={(e) => updateSettings((prev) => ({ ...prev, deviceName: e.target.value }))}
                  placeholder="PC Casa / Notebook / Celular"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '7px 10px',
                    fontSize: 12.5,
                  }}
                />
              </label>
            </div>
          )}

          {/* Concise feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {current.bullets.map((bullet, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 9,
                  padding: '8px 10px',
                  borderRadius: 7,
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  fontSize: 12.5,
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                }}
              >
                {step === 0 && <Cpu size={14} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />}
                {step === 1 && <HardDrive size={14} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />}
                {step === 2 && <Network size={14} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />}
                {step === 3 && <GitBranch size={14} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />}
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: '7px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-card)',
              color: step === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
              fontSize: 12.5,
              opacity: step === 0 ? 0.5 : 1,
            }}
          >
            {t.onboarding.backBtn}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isLast ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {t.onboarding.nextBtn}
              </button>
            ) : (
              <button
                type="button"
                onClick={completeOnboarding}
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {t.onboarding.finishBtn}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
