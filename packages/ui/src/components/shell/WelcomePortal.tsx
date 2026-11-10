import { useState, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  FilePlus,
  LayoutTemplate,
  Upload,
  ArrowRight,
  ShieldCheck,
  GitBranch,
  Users,
  FileDown,
  X,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { NARRATIVE_TEMPLATES } from '../../data/initialProjectData';

export function WelcomePortal() {
  const {
    project,
    totalWordCount,
    setShowPortal,
    loadDemoProject,
    startBlankProject,
    applyTemplateToProject,
    importProjectJson,
    setActiveView,
  } = useProject();

  const [step, setStep] = useState<'main' | 'new' | 'ai-prompt'>('main');
  const [blankTitle, setBlankTitle] = useState('');
  const [aiIdea, setAiIdea] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result ?? '');
      const ok = importProjectJson(content);
      if (!ok) {
        setImportError('Arquivo JSON inválido ou incompatível.');
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateFromIdea = () => {
    const title = aiIdea.trim()
      ? aiIdea.trim().slice(0, 48)
      : 'Novo Projeto Estruturado';
    startBlankProject(title);
    applyTemplateToProject(NARRATIVE_TEMPLATES[0], true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        backgroundColor: 'rgba(6, 8, 12, 0.94)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          backgroundColor: '#0f1219',
          border: '1px solid #1f2430',
          borderRadius: 14,
          padding: '32px 36px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.65)',
          position: 'relative',
        }}
      >
        <button
          onClick={() => setShowPortal(false)}
          title="Voltar ao espaço de trabalho"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: '#171b24',
            border: '1px solid #262c3a',
            color: '#9ca3af',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
          }}
        >
          <X size={14} /> Fechar Portal
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: '#f3f4f6',
              letterSpacing: '-0.02em',
            }}
          >
            Meu Espaço
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#9ca3af' }}>
            Selecione ou inicie um projeto para continuar escrevendo.
          </p>
        </div>

        {step === 'main' && (
          <>
            {/* Primary Action Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
                marginBottom: 28,
              }}
            >
              {/* Continue Current Session */}
              <div
                style={{
                  backgroundColor: '#151923',
                  border: '1px solid #2e3646',
                  borderRadius: 10,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#60a5fa',
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Continuar última sessão
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 17, color: '#f9fafb' }}>
                    {project.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                    {project.scenes.length} cenas · {totalWordCount.toLocaleString('pt-BR')} palavras ·{' '}
                    {project.characters.length} personagens · {project.factions.length} facções
                  </p>
                </div>
                <button
                  onClick={() => setShowPortal(false)}
                  style={{
                    marginTop: 18,
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  Continuar escrevendo <ArrowRight size={15} />
                </button>
              </div>

              {/* Start New Project */}
              <div
                style={{
                  backgroundColor: '#151923',
                  border: '1px solid #262c3a',
                  borderRadius: 10,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#a78bfa',
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Novo Projeto
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 17, color: '#f9fafb' }}>
                    Comece um novo projeto
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                    Manuscrito em branco, estrutura a partir de modelos clássicos ou geração assistida.
                  </p>
                </div>
                <button
                  onClick={() => setStep('new')}
                  style={{
                    marginTop: 18,
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#1f2637',
                    color: '#e5e7eb',
                    border: '1px solid #374151',
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <FilePlus size={15} /> Escolher ponto de partida
                </button>
              </div>

              {/* Open / Demo */}
              <div
                style={{
                  backgroundColor: '#151923',
                  border: '1px solid #262c3a',
                  borderRadius: 10,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#34d399',
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Importar ou Demonstração
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 17, color: '#f9fafb' }}>
                    Abrir projeto ou Demo
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                    Carregue um arquivo de backup (.json) ou restaure o projeto demonstrativo completo.
                  </p>
                  {importError && (
                    <div style={{ color: '#f87171', fontSize: 11, marginTop: 6 }}>
                      {importError}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      flex: 1,
                      padding: '10px 10px',
                      backgroundColor: '#1f2637',
                      color: '#e5e7eb',
                      border: '1px solid #374151',
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Upload size={14} /> Importar .JSON
                  </button>
                  <button
                    onClick={loadDemoProject}
                    style={{
                      flex: 1,
                      padding: '10px 10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.14)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Carregar Demo
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Pillars */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                paddingTop: 20,
                borderTop: '1px solid #1e2330',
              }}
            >
              <div style={{ padding: 12, backgroundColor: '#121620', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <Sparkles size={15} /> Copiloto & Estúdio
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.45 }}>
                  Elabore cenas, mude o tom, faça brainstorming e rode diagnósticos locais ou via MCP.
                </div>
              </div>
              <div style={{ padding: 12, backgroundColor: '#121620', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <GitBranch size={15} /> Quadro de Plotagem v2
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.45 }}>
                  Planeje em Atos, Tela 2D livre com minimapa ou Linha do Tempo com curvas de tensão.
                </div>
              </div>
              <div style={{ padding: 12, backgroundColor: '#121620', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <Users size={15} /> Personagens, Facções & Grafo
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.45 }}>
                  Dossiês completos com anel de completude, estado epistêmico e grafo de física multicamada.
                </div>
              </div>
              <div style={{ padding: 12, backgroundColor: '#121620', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a78bfa', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <FileDown size={15} /> Compilação & Versões
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.45 }}>
                  Branches, snapshots com diff de palavras e compilação em Markdown, TXT Normativo e HTML/PDF.
                </div>
              </div>
            </div>
          </>
        )}

        {step === 'new' && (
          <div>
            <button
              onClick={() => setStep('main')}
              style={{
                marginBottom: 16,
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                cursor: 'pointer',
                fontSize: 13,
                padding: 0,
              }}
            >
              ← Voltar
            </button>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, color: '#f3f4f6' }}>
              Como você gostaria de começar?
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#9ca3af' }}>
              Escolha um ponto de partida que melhor se adapte ao seu processo criativo.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 14,
              }}
            >
              {/* 1. Blank Manuscript */}
              <div
                style={{
                  backgroundColor: '#151923',
                  border: '1px solid #283040',
                  borderRadius: 10,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f3f4f6', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                  <BookOpen size={17} color="#60a5fa" /> Comece com um manuscrito em branco
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
                  Para quem sabe para onde vai. Comece com um primeiro capítulo vazio.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={blankTitle}
                    onChange={(e) => setBlankTitle(e.target.value)}
                    placeholder="Título do projeto (opcional)..."
                    style={{
                      flex: 1,
                      backgroundColor: '#0c0f16',
                      border: '1px solid #283040',
                      borderRadius: 6,
                      padding: '8px 10px',
                      color: '#f3f4f6',
                      fontSize: 12,
                    }}
                  />
                  <button
                    onClick={() => startBlankProject(blankTitle || 'Minha História Sem Título')}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Criar
                  </button>
                </div>
              </div>

              {/* 2. Start from Template */}
              <div
                style={{
                  backgroundColor: '#151923',
                  border: '1px solid #283040',
                  borderRadius: 10,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f3f4f6', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                  <LayoutTemplate size={17} color="#f59e0b" /> Comece com um modelo (Template)
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
                  Use uma estrutura narrativa clássica como Três Atos, Jornada do Herói ou Save the Cat.
                </p>
                <button
                  onClick={() => {
                    setShowPortal(false);
                    setActiveView('templates');
                  }}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#1f2637',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Explorar Biblioteca de Modelos →
                </button>
              </div>

              {/* 3. Generate with AI */}
              <div
                style={{
                  backgroundColor: '#151923',
                  border: '1px solid #283040',
                  borderRadius: 10,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f3f4f6', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                  <Sparkles size={17} color="#a78bfa" /> Gere com IA
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
                  Forneça uma ideia simples e construa um esboço detalhado do enredo automaticamente.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={aiIdea}
                    onChange={(e) => setAiIdea(e.target.value)}
                    placeholder="Ex.: Um thriller político em uma estação submarina..."
                    style={{
                      flex: 1,
                      backgroundColor: '#0c0f16',
                      border: '1px solid #283040',
                      borderRadius: 6,
                      padding: '8px 10px',
                      color: '#f3f4f6',
                      fontSize: 12,
                    }}
                  />
                  <button
                    onClick={handleGenerateFromIdea}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#7c3aed',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Gerar
                  </button>
                </div>
              </div>

              {/* 4. Explore Demo Project */}
              <div
                style={{
                  backgroundColor: '#151923',
                  border: '1px solid #283040',
                  borderRadius: 10,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f3f4f6', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                  <ShieldCheck size={17} color="#10b981" /> Explore o projeto de demonstração
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
                  Projeto pré-preenchido com capítulos, facções, personagens, sistemas, mapas mentais e grafo.
                </p>
                <button
                  onClick={loadDemoProject}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'rgba(16, 185, 129, 0.16)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Carregar Demonstração ("As Cinzas de Vael")
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
