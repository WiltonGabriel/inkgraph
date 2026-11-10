import { useState, useMemo } from 'react';
import { Target } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { CompletenessRing } from '../ui/CompletenessRing';

export function GoalTrackerCard() {
  const { project, updateProject, totalWordCount } = useProject();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(project.wordCountGoal));
  const [deadlineDraft, setDeadlineDraft] = useState(project.deadline ?? '');

  const wordGoalPercent = Math.min(
    100,
    Math.round((totalWordCount / Math.max(1, project.wordCountGoal)) * 100)
  );
  const wordsRemaining = Math.max(0, project.wordCountGoal - totalWordCount);

  const daysLeft = useMemo(() => {
    if (!project.deadline) return null;
    const diff =
      new Date(project.deadline).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / 86400000);
  }, [project.deadline]);

  const requiredPacePerDay =
    daysLeft && daysLeft > 0 ? Math.ceil(wordsRemaining / daysLeft) : null;

  return (
    <div
      style={{
        backgroundColor: '#121621',
        border: '1px solid #1f2533',
        borderRadius: 10,
        padding: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#f3f4f6',
          }}
        >
          <Target size={15} color="#60a5fa" /> Metas do Projeto
        </span>
        <button
          onClick={() => setEditingGoal((v) => !v)}
          style={{
            background: 'none',
            border: '1px solid #2c3446',
            color: '#9ca3af',
            borderRadius: 5,
            padding: '3px 8px',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          {editingGoal ? 'Fechar' : 'Editar meta'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <CompletenessRing percent={wordGoalPercent} size={64} strokeWidth={5} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f9fafb' }}>
            {totalWordCount.toLocaleString('pt-BR')}{' '}
            <span style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 400 }}>
              / {project.wordCountGoal.toLocaleString('pt-BR')} palavras
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 3 }}>
            {wordsRemaining.toLocaleString('pt-BR')} palavras restantes
          </div>
          <div style={{ fontSize: 11.5, color: '#10b981', marginTop: 4 }}>
            {daysLeft !== null
              ? daysLeft > 0
                ? `${daysLeft} dias restantes · Ritmo: ~${requiredPacePerDay} palavras/dia`
                : 'Prazo final atingido'
              : 'Sem prazo definido'}
          </div>
        </div>
      </div>

      {editingGoal && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #1e2433',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10.5, color: '#9ca3af', display: 'block', marginBottom: 3 }}>
              Meta de palavras
            </label>
            <input
              type="number"
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                backgroundColor: '#0c0f17',
                border: '1px solid #2a3245',
                borderRadius: 5,
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10.5, color: '#9ca3af', display: 'block', marginBottom: 3 }}>
              Prazo alvo
            </label>
            <input
              type="date"
              value={deadlineDraft}
              onChange={(e) => setDeadlineDraft(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                backgroundColor: '#0c0f17',
                border: '1px solid #2a3245',
                borderRadius: 5,
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>
          <button
            onClick={() => {
              updateProject((prev) => ({
                ...prev,
                wordCountGoal: Math.max(100, Number(goalDraft) || 60000),
                deadline: deadlineDraft || undefined,
              }));
              setEditingGoal(false);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
