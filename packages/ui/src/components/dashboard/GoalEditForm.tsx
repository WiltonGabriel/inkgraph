import { useEffect, useId, useState } from 'react';

interface GoalEditFormProps {
  wordCountGoal: number;
  deadline?: string;
  onSave: (wordCountGoal: number, deadline?: string) => void;
}

export function GoalEditForm({
  wordCountGoal,
  deadline,
  onSave,
}: GoalEditFormProps) {
  const [goalDraft, setGoalDraft] = useState(String(wordCountGoal));
  const [deadlineDraft, setDeadlineDraft] = useState(deadline ?? '');
  const goalInputId = useId();
  const deadlineInputId = useId();

  useEffect(() => {
    setGoalDraft(String(wordCountGoal));
    setDeadlineDraft(deadline ?? '');
  }, [wordCountGoal, deadline]);

  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 12,
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'flex-end',
      }}
    >
      <div style={{ flex: 1, minWidth: 110 }}>
        <label
          htmlFor={goalInputId}
          style={{
            fontSize: 10.5,
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: 3,
          }}
        >
          Meta de palavras
        </label>
        <input
          id={goalInputId}
          type="number"
          min={100}
          value={goalDraft}
          onChange={(e) => setGoalDraft(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm, 6px)',
            color: 'var(--text-primary)',
            fontSize: 12,
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <label
          htmlFor={deadlineInputId}
          style={{
            fontSize: 10.5,
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: 3,
          }}
        >
          Prazo alvo
        </label>
        <input
          id={deadlineInputId}
          type="date"
          value={deadlineDraft}
          onChange={(e) => setDeadlineDraft(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm, 6px)',
            color: 'var(--text-primary)',
            fontSize: 12,
          }}
        />
      </div>
      <button
        type="button"
        onClick={() =>
          onSave(Math.max(100, Number(goalDraft) || 60000), deadlineDraft || undefined)
        }
        style={{
          padding: '6px 12px',
          backgroundColor: 'var(--accent-primary)',
          color: '#ffffff',
          borderRadius: 'var(--radius-sm, 6px)',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Salvar
      </button>
    </div>
  );
}
