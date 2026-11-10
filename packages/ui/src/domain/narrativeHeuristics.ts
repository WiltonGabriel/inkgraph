import type { ProjectData, ViewId } from '../types/project';
import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  calculateWorldCompleteness,
} from './completenessCalculator';

export interface NarrativeInsight {
  id: string;
  title: string;
  description: string;
  targetView: ViewId;
  severity: 'error' | 'warn' | 'info';
}

export function evaluateProjectHeuristics(project: ProjectData): NarrativeInsight[] {
  const list: NarrativeInsight[] = [];

  for (const c of project.characters) {
    const pct = calculateCharacterCompleteness(c);
    if (pct < 75) {
      list.push({
        id: `ins_char_${c.id}`,
        title: 'Personagem precisa de desenvolvimento',
        description: `${c.name} aparece no elenco, mas seu perfil está ${pct}% completo.`,
        targetView: 'characters',
        severity: 'warn',
      });
    }
  }

  for (const f of project.factions) {
    const pct = calculateFactionCompleteness(f);
    if (pct < 75) {
      list.push({
        id: `ins_fac_${f.id}`,
        title: 'Facção subespecificada',
        description: `${f.name} está ${pct}% completa — detalhe recursos ou conflitos internos.`,
        targetView: 'factions',
        severity: 'info',
      });
    }
  }

  for (const w of project.worlds) {
    const pct = calculateWorldCompleteness(w);
    if (pct < 75) {
      list.push({
        id: `ins_w_${w.id}`,
        title: 'Entrada mundial subespecificada',
        description: `${w.name} está ${pct}% completo.`,
        targetView: 'worlds',
        severity: 'info',
      });
    }
  }

  for (let i = 1; i < project.scenes.length; i++) {
    const prev = project.scenes[i - 1];
    const curr = project.scenes[i];
    if (prev.tension - curr.tension >= 20) {
      list.push({
        id: `ins_tension_${curr.id}`,
        title: 'Queda de tensão detectada',
        description: `De "${prev.title}" (${prev.tension}%) para "${curr.title}" (${curr.tension}%) há queda sem batida de recuperação.`,
        targetView: 'plotboard',
        severity: 'warn',
      });
    }
  }

  const pendingStaging = project.stagingProposals.filter((p) => p.status === 'pending').length;
  if (pendingStaging > 0) {
    list.push({
      id: 'ins_staging',
      title: `${pendingStaging} proposta(s) em Staging`,
      description: 'Existem rascunhos provisórios aguardando canonização ou rejeição.',
      targetView: 'versions',
      severity: 'info',
    });
  }

  return list;
}
