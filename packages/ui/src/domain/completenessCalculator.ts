import type {
  Character,
  CustomFieldSchema,
  EntityTypeDefinition,
  Faction,
  GenericEntityRecord,
  World,
} from '../types/project';

interface CompletenessCheck {
  weight: number;
  filled: boolean;
}

function asSchema(maybeSchema?: unknown): EntityTypeDefinition | undefined {
  if (
    maybeSchema &&
    typeof maybeSchema === 'object' &&
    !Array.isArray(maybeSchema) &&
    'hiddenNativeFields' in maybeSchema &&
    'customFields' in maybeSchema
  ) {
    return maybeSchema as EntityTypeDefinition;
  }
  return undefined;
}

function isCustomValueFilled(value: unknown, type: CustomFieldSchema['type']): boolean {
  if (value === undefined || value === null) return false;
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'number') return typeof value === 'number' ? Number.isFinite(value) : String(value).trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
}

function appendCustomFieldChecks(
  checks: CompletenessCheck[],
  schema: EntityTypeDefinition | undefined,
  attributes: Record<string, unknown> | undefined
): void {
  if (!schema) return;
  for (const field of schema.customFields) {
    const rawWeight = field.completenessWeight ?? 0;
    if (!field.required && rawWeight <= 0) continue;
    const weight = rawWeight > 0 ? rawWeight : 1;
    checks.push({
      weight,
      filled: isCustomValueFilled(attributes?.[field.key], field.type),
    });
  }
}

function scoreChecks(checks: CompletenessCheck[]): number {
  if (checks.length === 0) return 100;
  const totalWeight = checks.reduce((acc, item) => acc + item.weight, 0);
  if (totalWeight <= 0) return 100;
  const filledWeight = checks.reduce((acc, item) => acc + (item.filled ? item.weight : 0), 0);
  return Math.round((filledWeight / totalWeight) * 100);
}

export function calculateCharacterCompleteness(
  c: Character,
  schemaInput?: EntityTypeDefinition
): number {
  const schema = asSchema(schemaInput);
  const hidden = new Set(schema?.hiddenNativeFields ?? []);
  const required = new Set(schema?.requiredNativeFields ?? []);
  const checks: CompletenessCheck[] = [
    { weight: 1, filled: Boolean(c.name?.trim()) },
    { weight: 1, filled: Boolean(c.role?.trim()) },
  ];

  if (!hidden.has('appearance')) {
    checks.push({
      weight: required.has('appearance') ? 2 : 1,
      filled: Boolean(c.appearance?.trim()),
    });
  }
  if (!hidden.has('backstory')) {
    checks.push({
      weight: required.has('backstory') ? 2 : 1,
      filled: Boolean(c.backstory?.trim()),
    });
  }
  checks.push({ weight: 1, filled: Boolean(c.motivation?.trim()) });
  checks.push({ weight: 1, filled: Boolean(c.personalityTraits?.trim()) });
  checks.push({ weight: 1, filled: Boolean(c.flaws?.trim()) });

  if (!(hidden.has('want') && hidden.has('need'))) {
    const wantVal = hidden.has('want') ? '' : c.want;
    const needVal = hidden.has('need') ? '' : c.need;
    const isReq = required.has('want') || required.has('need');
    checks.push({
      weight: isReq ? 2 : 1,
      filled: Boolean(wantVal?.trim() || needVal?.trim()),
    });
  }

  if (!hidden.has('arcsByAct')) {
    checks.push({
      weight: required.has('arcsByAct') ? 2 : 1,
      filled: Boolean(
        c.characterArc?.trim() || c.arcAct1?.trim() || c.arcAct2?.trim() || c.arcAct3?.trim()
      ),
    });
  }

  checks.push({ weight: 1, filled: c.relationships.length > 0 });

  // Extra native fields explicitly marked as required in Workspace Settings
  const extraNativeGetters: Record<string, () => boolean> = {
    age: () => Boolean(c.age?.trim()),
    factionId: () => Boolean(c.factionId?.trim()),
    locationId: () => Boolean(c.locationId?.trim()),
    lieBelieved: () => Boolean(c.lieBelieved?.trim()),
    ghost: () => Boolean(c.ghost?.trim()),
  };
  for (const [key, getter] of Object.entries(extraNativeGetters)) {
    if (!hidden.has(key) && required.has(key)) {
      checks.push({ weight: 2, filled: getter() });
    }
  }

  appendCustomFieldChecks(checks, schema, c.customAttributes);
  return scoreChecks(checks);
}

export function calculateFactionCompleteness(
  f: Faction,
  schemaInput?: EntityTypeDefinition
): number {
  const schema = asSchema(schemaInput);
  const hidden = new Set(schema?.hiddenNativeFields ?? []);
  const required = new Set(schema?.requiredNativeFields ?? []);
  const checks: CompletenessCheck[] = [
    { weight: 1, filled: Boolean(f.name?.trim()) },
    { weight: 1, filled: Boolean(f.subtype?.trim()) },
  ];

  if (!hidden.has('motto')) {
    checks.push({ weight: required.has('motto') ? 2 : 1, filled: Boolean(f.motto?.trim()) });
  }
  checks.push({ weight: 1, filled: Boolean(f.publicAgenda?.trim()) });
  if (!hidden.has('secretAgenda')) {
    checks.push({
      weight: required.has('secretAgenda') ? 2 : 1,
      filled: Boolean(f.secretAgenda?.trim()),
    });
  }
  if (!hidden.has('doctrine')) {
    checks.push({ weight: required.has('doctrine') ? 2 : 1, filled: Boolean(f.doctrine?.trim()) });
  }
  checks.push({ weight: 1, filled: Boolean(f.history?.trim()) });
  if (!hidden.has('resourcesAndPower')) {
    checks.push({
      weight: required.has('resourcesAndPower') ? 2 : 1,
      filled: Boolean(f.resourcesAndPower?.trim()),
    });
  }
  if (!hidden.has('ranks')) {
    checks.push({ weight: required.has('ranks') ? 2 : 1, filled: f.ranks.length > 0 });
  }
  if (!hidden.has('internalConflicts') && required.has('internalConflicts')) {
    checks.push({ weight: 2, filled: Boolean(f.internalConflicts?.trim()) });
  }
  checks.push({ weight: 1, filled: f.relationships.length > 0 });

  appendCustomFieldChecks(checks, schema, f.customAttributes);
  return scoreChecks(checks);
}

export function calculateWorldCompleteness(
  w: World,
  schemaInput?: EntityTypeDefinition
): number {
  const schema = asSchema(schemaInput);
  const checks: CompletenessCheck[] = [
    { weight: 1, filled: Boolean(w.name?.trim()) },
    { weight: 1, filled: Boolean(w.description?.trim()) },
    { weight: 1, filled: Boolean(w.geography?.trim()) },
    { weight: 1, filled: Boolean(w.culture?.trim()) },
    { weight: 1, filled: Boolean(w.history?.trim()) },
    { weight: 1, filled: Boolean(w.magicOrTechSummary?.trim()) },
    { weight: 1, filled: w.locations.length > 0 },
    { weight: 1, filled: w.timeline.length > 0 },
  ];
  appendCustomFieldChecks(checks, schema, undefined);
  return scoreChecks(checks);
}

export function calculateGenericEntityCompleteness(
  entity: GenericEntityRecord,
  schemaInput?: EntityTypeDefinition
): number {
  const schema = asSchema(schemaInput);
  const checks: CompletenessCheck[] = [
    { weight: 1, filled: Boolean(entity.name?.trim()) },
    { weight: 1, filled: Boolean(entity.summary?.trim() || entity.notes?.trim()) },
  ];
  appendCustomFieldChecks(checks, schema, entity.customAttributes);
  return scoreChecks(checks);
}
