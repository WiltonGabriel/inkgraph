import type { ReactNode } from 'react';
import { BookOpen, Clock, Coins, History, Shield } from 'lucide-react';
import { useViewport } from '../../hooks/useViewport';
import type { World, WorldEconomyProfile, WorldPoliticsProfile } from '../../types/project';
import { worldStyles } from './WorldScoreChecklistBanner';

const EMPTY_POLITICS: WorldPoliticsProfile = {
  governmentForms: '',
  legalCodeAndPunishments: '',
  successionRules: '',
  treatiesAndAlliances: '',
  instabilityZones: '',
};

const EMPTY_ECONOMY: WorldEconomyProfile = {
  currenciesAndExchange: '',
  exportsAndImports: '',
  tradeRoutes: '',
  guildsBanksAndTaxes: '',
  scarcityAndBlackMarket: '',
};

const POLITICS_FIELDS: { key: keyof WorldPoliticsProfile; label: string; placeholder: string }[] = [
  { key: 'governmentForms', label: 'Formas de Governo & Soberania', placeholder: 'Monarquias, conselhos, teocracias, corporações soberanas...' },
  { key: 'legalCodeAndPunishments', label: 'Código Legal, Tribunais & Punições', placeholder: 'Crimes capitais, tribunais militares, ordálios ou multas...' },
  { key: 'successionRules', label: 'Regras de Sucessão & Legitimidade', placeholder: 'Como o poder muda de mãos (linhagem, eleição, duelo, escolha ritual)...' },
  { key: 'treatiesAndAlliances', label: 'Tratados, Alianças & Pactos Diplomáticos', placeholder: 'Acordos de defesa mútua, armistícios frágeis, pactos comerciais...' },
  { key: 'instabilityZones', label: 'Zonas de Instabilidade & Focos de Conflito', placeholder: 'Fronteiras disputadas, insurgências, distritos em revolta...' },
];

const ECONOMY_FIELDS: { key: keyof WorldEconomyProfile; label: string; placeholder: string }[] = [
  { key: 'currenciesAndExchange', label: 'Moedas, Lastro & Câmbio', placeholder: 'Espécies circulantes, lastro energético/metálico, taxas de conversão...' },
  { key: 'exportsAndImports', label: 'Principais Exportações & Importações', placeholder: 'Matérias-primas exportadas, insumos críticos importados...' },
  { key: 'tradeRoutes', label: 'Rotas Comerciais & Entrepostos', placeholder: 'Corredores marítimos, ferrovias, caravanas e portos francos...' },
  { key: 'guildsBanksAndTaxes', label: 'Guildas, Bancos & Tributação', placeholder: 'Monopólios de ofício, casas de crédito, dízimos e tarifas aduaneiras...' },
  { key: 'scarcityAndBlackMarket', label: 'Escassez & Mercado Paralelo', placeholder: 'Bens racionados, contrabando, substâncias ilegais e câmbio clandestino...' },
];

function StructuredProfileSection<K extends string>({
  prefix,
  summaryId,
  summaryLabel,
  summaryIcon,
  summaryValue,
  summaryPlaceholder,
  onChangeSummary,
  fields,
  values,
  onChangeField,
}: {
  prefix: string;
  summaryId: string;
  summaryLabel: string;
  summaryIcon: ReactNode;
  summaryValue: string;
  summaryPlaceholder: string;
  onChangeSummary: (next: string) => void;
  fields: { key: K; label: string; placeholder: string }[];
  values: Record<K, string>;
  onChangeField: (key: K, next: string) => void;
}) {
  const { width } = useViewport();
  const isNarrow = width < 820;

  return (
    <div style={{ maxWidth: 940, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={worldStyles.card}>
        <label htmlFor={summaryId} style={{ ...worldStyles.label, marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {summaryIcon}
          {summaryLabel}
        </label>
        <textarea
          id={summaryId}
          rows={3}
          value={summaryValue}
          onChange={(e) => onChangeSummary(e.target.value)}
          placeholder={summaryPlaceholder}
          style={worldStyles.textarea}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 12 }}>
        {fields.map((field) => (
          <div key={field.key} style={worldStyles.card}>
            <label htmlFor={`${prefix}-${field.key}`} style={{ ...worldStyles.label, marginBottom: 0 }}>
              {field.label}
            </label>
            <textarea
              id={`${prefix}-${field.key}`}
              rows={3}
              value={values[field.key]}
              onChange={(e) => onChangeField(field.key, e.target.value)}
              placeholder={field.placeholder}
              style={worldStyles.textarea}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorldCulturePillar({
  world,
  onUpdateWorld,
  onOpenSystems,
}: {
  world: World;
  onUpdateWorld: (next: World) => void;
  onOpenSystems: () => void;
}) {
  return (
    <div style={{ maxWidth: 940, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={worldStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <label htmlFor="world-culture-main" style={{ ...worldStyles.label, marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={14} color="var(--accent-primary, #3b82f6)" />
            Cultura, Costumes, Idiomas & Tabus Sociais
          </label>
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
            {world.culture.trim().length} caracteres
          </span>
        </div>
        <textarea
          id="world-culture-main"
          rows={7}
          value={world.culture}
          onChange={(e) => onUpdateWorld({ ...world, culture: e.target.value })}
          placeholder="Documente estratificação social, idiomas/dialetos, crenças e religiões, ritos de passagem, tabus, culinária e expressões artísticas..."
          style={worldStyles.textarea}
        />
      </div>

      <div style={worldStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
            Tabus Culturais Vinculados aos Sistemas ({world.systems.length})
          </span>
          <button type="button" onClick={onOpenSystems} style={worldStyles.secondaryBtn}>
            Abrir Sistemas & Leis
          </button>
        </div>

        {world.systems.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary, #94a3b8)' }}>
            Cadastre ao menos um sistema em &ldquo;Sistemas &amp; Leis&rdquo; para registrar sanções e tabus sociais associados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {world.systems.map((sys) => (
              <div key={sys.id}>
                <label htmlFor={`culture-taboo-${sys.id}`} style={worldStyles.label}>
                  Tabus em {sys.name}
                </label>
                <input
                  id={`culture-taboo-${sys.id}`}
                  value={sys.socialTaboos}
                  onChange={(e) =>
                    onUpdateWorld({
                      ...world,
                      systems: world.systems.map((s) =>
                        s.id === sys.id ? { ...s, socialTaboos: e.target.value } : s
                      ),
                    })
                  }
                  placeholder="O que é considerado profano, proibido ou estigmatizado..."
                  style={worldStyles.input}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function WorldPoliticsPillar({ world, onUpdateWorld }: { world: World; onUpdateWorld: (next: World) => void }) {
  const politics: WorldPoliticsProfile = { ...EMPTY_POLITICS, ...world.politics };
  return (
    <StructuredProfileSection
      prefix="pol"
      summaryId="world-politics-summary"
      summaryLabel="Resumo Geopolítico & Tensão de Poder"
      summaryIcon={<Shield size={14} color="var(--accent-primary, #3b82f6)" />}
      summaryValue={world.politicsSummary}
      summaryPlaceholder="Equilíbrio de forças entre coroas, ordens, sindicatos e estados..."
      onChangeSummary={(politicsSummary) => onUpdateWorld({ ...world, politicsSummary })}
      fields={POLITICS_FIELDS}
      values={politics}
      onChangeField={(key, val) => onUpdateWorld({ ...world, politics: { ...politics, [key]: val } })}
    />
  );
}

export function WorldEconomyPillar({ world, onUpdateWorld }: { world: World; onUpdateWorld: (next: World) => void }) {
  const economy: WorldEconomyProfile = { ...EMPTY_ECONOMY, ...world.economy };
  return (
    <StructuredProfileSection
      prefix="eco"
      summaryId="world-economy-summary"
      summaryLabel="Resumo Econômico do Mundo"
      summaryIcon={<Coins size={14} color="#f59e0b" />}
      summaryValue={world.economySummary ?? ''}
      summaryPlaceholder="Base produtiva, energia dominante, distribuição de riqueza e dependências comerciais..."
      onChangeSummary={(economySummary) => onUpdateWorld({ ...world, economySummary })}
      fields={ECONOMY_FIELDS}
      values={economy}
      onChangeField={(key, val) => onUpdateWorld({ ...world, economy: { ...economy, [key]: val } })}
    />
  );
}

export function WorldHistoryPillar({
  world,
  onUpdateWorld,
  onOpenTimeline,
}: {
  world: World;
  onUpdateWorld: (next: World) => void;
  onOpenTimeline: () => void;
}) {
  return (
    <div style={{ maxWidth: 940, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={worldStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <label htmlFor="world-history-main" style={{ ...worldStyles.label, marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <History size={14} color="var(--accent-primary, #3b82f6)" />
            Resumo Histórico, Eras Passadas & Cataclismas
          </label>
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
            {world.history.trim().length} caracteres
          </span>
        </div>
        <textarea
          id="world-history-main"
          rows={7}
          value={world.history}
          onChange={(e) => onUpdateWorld({ ...world, history: e.target.value })}
          placeholder="Descreva fundações, guerras passadas, eras míticas, rupturas políticas e eventos que moldaram o presente..."
          style={worldStyles.textarea}
        />
      </div>

      <div style={worldStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
            <Clock size={14} color="#10b981" />
            Marcos Vinculados na Linha do Tempo ({world.timeline.length})
          </span>
          <button type="button" onClick={onOpenTimeline} style={worldStyles.secondaryBtn}>
            Abrir Linha do Tempo
          </button>
        </div>

        {world.timeline.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary, #94a3b8)' }}>
            Nenhum marco histórico registrado ainda. Adicione eventos no pilar &ldquo;Linha do Tempo&rdquo;.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {world.timeline.map((evt) => {
              const loc = world.locations.find((l) => l.id === evt.locationId);
              return (
                <div key={evt.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: 'var(--bg-elevated, #171d2e)', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                    {evt.era} · {evt.year}
                    {loc ? ` · ${loc.name}` : ''}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', marginTop: 2 }}>
                    {evt.title}
                  </div>
                  {evt.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 3, lineHeight: 1.45 }}>
                      {evt.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
