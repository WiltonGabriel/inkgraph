import { useId, type CSSProperties, type ReactNode } from 'react';
import type {
  Character,
  Faction,
  RuleSystem,
  StoryObject,
  World,
  WorldLocation,
} from '../../types/project';

export type SelectedGraphEntity =
  | { kind: 'character'; entity: Character }
  | { kind: 'faction'; entity: Faction }
  | { kind: 'location'; entity: WorldLocation; world: World }
  | { kind: 'system'; entity: RuleSystem; world: World }
  | { kind: 'object'; entity: StoryObject };

interface GraphInspectorAttributesProps {
  selected: SelectedGraphEntity;
  mode: 'formulation' | 'deep';
  onUpdateCharacter: (char: Character) => void;
  onUpdateFaction: (faction: Faction) => void;
  onUpdateWorld: (world: World) => void;
  onUpdateObject: (obj: StoryObject) => void;
}

type KeysMatching<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T] & string;

type FieldSpec<T> =
  | { id: string; kind: 'input'; key: KeysMatching<T, string | undefined>; label: string }
  | { id: string; kind: 'csv'; key: KeysMatching<T, string[]>; label: string }
  | { id: string; kind: 'textarea'; key: KeysMatching<T, string | undefined>; label: string; rows: number }
  | { id: string; kind: 'lines'; key: KeysMatching<T, string[]>; label: string; rows: number }
  | { id: string; kind: 'select'; key: KeysMatching<T, string | undefined>; label: string; options: readonly [string, string][] }
  | { id: string; kind: 'pair'; items: [FieldSpec<T>, FieldSpec<T>] };

const inp = <T,>(key: KeysMatching<T, string | undefined>, label: string): FieldSpec<T> => ({ id: key, kind: 'input', key, label });
const csv = <T,>(key: KeysMatching<T, string[]>, label: string): FieldSpec<T> => ({ id: key, kind: 'csv', key, label });
const txt = <T,>(key: KeysMatching<T, string | undefined>, label: string, rows = 2): FieldSpec<T> => ({ id: key, kind: 'textarea', key, label, rows });
const lines = <T,>(key: KeysMatching<T, string[]>, label: string, rows = 3): FieldSpec<T> => ({ id: key, kind: 'lines', key, label, rows });
const pair = <T,>(a: FieldSpec<T>, b: FieldSpec<T>): FieldSpec<T> => ({ id: `${a.id}_${b.id}`, kind: 'pair', items: [a, b] });

const LOCATION_TYPE_OPTIONS: readonly [WorldLocation['type'], string][] = [
  ['city', 'Cidade'], ['fortress', 'Fortaleza'], ['village', 'Vila'], ['ruin', 'Ruína'],
  ['temple', 'Templo'], ['region', 'Região'], ['station', 'Estação'], ['other', 'Outro'],
];

const CHAR_FORM_FIELDS: FieldSpec<Character>[] = [
  inp('name', 'Nome'),
  csv('aliases', 'Codinomes (separados por vírgula)'),
  pair(inp('role', 'Papel Narrativo'), inp('age', 'Idade / Status')),
  txt('appearance', 'Aparência Física & Presença', 3),
  txt('backstory', 'História de Fundo (Backstory)', 4),
  txt('motivation', 'Motivação Central', 2),
  txt('personalityTraits', 'Traços de Personalidade', 2),
  txt('flaws', 'Imperfeições & Falhas (Flaws)', 2),
];

const CHAR_DEEP_FIELDS: FieldSpec<Character>[] = [
  txt('want', 'Desejo Consciente (Want)', 2),
  txt('need', 'Necessidade Inconsciente (Need)', 2),
  txt('lieBelieved', 'Mentira em que Acredita (The Lie)', 2),
  txt('ghost', 'Fantasma / Trauma Passado (The Ghost)', 2),
  txt('arcAct1', 'Arco — Ato I (Configuração)', 2),
  txt('arcAct2', 'Arco — Ato II (Confronto)', 2),
  txt('arcAct3', 'Arco — Ato III (Resolução)', 2),
  txt('notes', 'Notas de Voz & Detalhes', 2),
];

const FACTION_FORM_FIELDS: FieldSpec<Faction>[] = [
  inp('name', 'Nome da Facção'),
  inp('subtype', 'Subtipo / Categoria'),
  inp('motto', 'Lema (Motto)'),
  txt('publicAgenda', 'Agenda Pública (Oficial)', 2),
  txt('secretAgenda', 'Agenda Secreta (Real)', 2),
  txt('doctrine', 'Doutrina & Ideologia', 3),
  txt('history', 'História de Fundação', 3),
];

const FACTION_DEEP_FIELDS: FieldSpec<Faction>[] = [
  txt('resourcesAndPower', 'Recursos, Efetivo Militar & Monopólios', 3),
  txt('internalConflicts', 'Conflitos Internos & Cismas', 3),
  txt('notes', 'Notas Institucionais', 2),
];

const LOCATION_FIELDS: FieldSpec<WorldLocation>[] = [
  inp('name', 'Nome do Local'),
  pair({ id: 'type', kind: 'select', key: 'type', label: 'Categoria', options: LOCATION_TYPE_OPTIONS }, inp('population', 'População')),
  txt('climateOrAtmosphere', 'Clima & Atmosfera', 2),
  txt('description', 'Descrição Completa', 3),
  txt('strategicValue', 'Valor Estratégico & Controle', 3),
  txt('notes', 'Notas do Local', 2),
];

const SYSTEM_FIELDS: FieldSpec<RuleSystem>[] = [
  pair(inp('name', 'Nome do Sistema'), inp('subtype', 'Subtipo')),
  txt('coreSource', 'Fonte Primária', 2),
  lines('fundamentalRules', 'Leis Fundamentais (uma por linha)', 4),
  txt('costsAndToll', 'Custos & Pedágio', 2),
  lines('hardLimits', 'Limites Absolutos (um por linha)', 3),
  txt('notes', 'Notas do Sistema', 2),
];

const OBJECT_FIELDS: FieldSpec<StoryObject>[] = [
  pair(inp('name', 'Nome do Objeto'), inp('status', 'Estado Atual')),
  txt('description', 'Descrição', 3),
  txt('significance', 'Significado Narrativo', 3),
  txt('rulesOrCapabilities', 'Regras & Capacidades', 2),
  txt('notes', 'Notas do Objeto', 2),
];

export function GraphInspectorAttributes({
  selected,
  mode,
  onUpdateCharacter,
  onUpdateFaction,
  onUpdateWorld,
  onUpdateObject,
}: GraphInspectorAttributesProps) {
  if (selected.kind === 'character') {
    const specs = mode === 'deep' ? CHAR_DEEP_FIELDS : CHAR_FORM_FIELDS;
    return <SpecList specs={specs} entity={selected.entity} onPatch={(p) => onUpdateCharacter({ ...selected.entity, ...p })} />;
  }

  if (selected.kind === 'faction') {
    const faction = selected.entity;
    const specs = mode === 'deep' ? FACTION_DEEP_FIELDS : FACTION_FORM_FIELDS;
    return (
      <>
        <SpecList specs={specs} entity={faction} onPatch={(p) => onUpdateFaction({ ...faction, ...p })} />
        {mode === 'deep' && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>
              Estrutura Hierárquica ({faction.ranks.length} patentes)
            </div>
            {faction.ranks.map((r) => (
              <div key={r.id} style={rankCardStyle}>
                <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {r.title} (Autoridade {r.authorityLevel}/10)
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11.5, marginTop: 3 }}>
                  {r.responsibilities}
                </div>
              </div>
            ))}
          </>
        )}
      </>
    );
  }

  if (selected.kind === 'location') {
    const loc = selected.entity;
    return (
      <SpecList
        specs={LOCATION_FIELDS}
        entity={loc}
        onPatch={(p) =>
          onUpdateWorld({
            ...selected.world,
            locations: selected.world.locations.map((item) => (item.id === loc.id ? { ...item, ...p } : item)),
          })
        }
      />
    );
  }

  if (selected.kind === 'system') {
    const sys = selected.entity;
    return (
      <SpecList
        specs={SYSTEM_FIELDS}
        entity={sys}
        onPatch={(p) =>
          onUpdateWorld({
            ...selected.world,
            systems: selected.world.systems.map((item) => (item.id === sys.id ? { ...item, ...p } : item)),
          })
        }
      />
    );
  }

  return <SpecList specs={OBJECT_FIELDS} entity={selected.entity} onPatch={(p) => onUpdateObject({ ...selected.entity, ...p })} />;
}

function SpecList<T>({ specs, entity, onPatch }: { specs: FieldSpec<T>[]; entity: T; onPatch: (patch: Partial<T>) => void }) {
  return <>{specs.map((spec) => <SpecField key={spec.id} spec={spec} entity={entity} onPatch={onPatch} />)}</>;
}

function SpecField<T>({ spec, entity, onPatch }: { spec: FieldSpec<T>; entity: T; onPatch: (patch: Partial<T>) => void }) {
  const fieldId = useId();

  if (spec.kind === 'pair') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <SpecField spec={spec.items[0]} entity={entity} onPatch={onPatch} />
        <SpecField spec={spec.items[1]} entity={entity} onPatch={onPatch} />
      </div>
    );
  }

  if (spec.kind === 'select') {
    const val = (entity[spec.key] as string | undefined) ?? '';
    return (
      <LabeledField id={fieldId} label={spec.label}>
        <select id={fieldId} value={val} onChange={(e) => onPatch({ [spec.key]: e.target.value } as Partial<T>)} style={inputStyle}>
          {spec.options.map(([optVal, optLabel]) => (
            <option key={optVal} value={optVal}>{optLabel}</option>
          ))}
        </select>
      </LabeledField>
    );
  }

  if (spec.kind === 'input' || spec.kind === 'csv') {
    const value = spec.kind === 'csv' ? ((entity[spec.key] as string[]) ?? []).join(', ') : ((entity[spec.key] as string | undefined) ?? '');
    return (
      <LabeledField id={fieldId} label={spec.label}>
        <input
          id={fieldId}
          value={value}
          onChange={(e) => {
            const next = spec.kind === 'csv' ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean) : e.target.value;
            onPatch({ [spec.key]: next } as Partial<T>);
          }}
          style={inputStyle}
        />
      </LabeledField>
    );
  }

  const textValue = spec.kind === 'lines' ? ((entity[spec.key] as string[]) ?? []).join('\n') : ((entity[spec.key] as string | undefined) ?? '');
  return (
    <LabeledField id={fieldId} label={spec.label}>
      <textarea
        id={fieldId}
        rows={spec.rows}
        value={textValue}
        onChange={(e) => {
          const next = spec.kind === 'lines' ? e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) : e.target.value;
          onPatch({ [spec.key]: next } as Partial<T>);
        }}
        style={textareaStyle}
      />
    </LabeledField>
  );
}

function LabeledField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

const fieldLabelStyle: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 };
const rankCardStyle: CSSProperties = { padding: 10, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm, 6px)', fontSize: 12 };
const inputStyle: CSSProperties = { width: '100%', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm, 6px)', padding: '7px 10px', color: 'var(--text-primary)', fontSize: 12.5 };
const textareaStyle: CSSProperties = { ...inputStyle, padding: '8px 10px', fontSize: 12, lineHeight: 1.45, resize: 'vertical' };
