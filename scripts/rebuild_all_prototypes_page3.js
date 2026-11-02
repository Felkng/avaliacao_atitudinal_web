import { readFileSync } from 'fs';

const MCP_URL = "http://localhost:4401/mcp";

async function runPenpotScript(code) {
  const initRes = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "builder", version: "1.0" } }
    })
  });
  const sid = initRes.headers.get("mcp-session-id");
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream", "mcp-session-id": sid },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 2, method: "tools/call",
      params: {
        name: "execute_code",
        arguments: { code }
      }
    })
  });
  const raw = await res.text();
  return raw;
}

const BUILDER_CODE = `
(async () => {
  // Ensure we are on Page 03 - Protótipo Interativo Navegável
  const p3 = penpot.currentFile.pages.find(p => p.name.includes("03"));
  if (p3 && penpot.currentPage.id !== p3.id) {
    await penpot.openPage(p3);
  }

  const page = penpot.currentPage;
  const root = page.root;

  // Colors
  const C = {
    primary: "#2F9E41",
    primaryDark: "#1E6B2B",
    primaryLight: "#F0FDF4",
    primaryBorder: "#86EFAC",
    alert: "#CD191E",
    alertBg: "#FEF2F2",
    alertBorder: "#FECACA",
    gray900: "#111827",
    gray800: "#1F2937",
    gray700: "#374151",
    gray600: "#4B5563",
    gray500: "#6B7280",
    gray400: "#9CA3AF",
    gray300: "#D1D5DB",
    gray200: "#E5E7EB",
    gray100: "#F3F4F6",
    gray50: "#F9FAFB",
    white: "#FFFFFF"
  };

  // Helper functions
  function addRect(board, x, y, w, h, fill, stroke, radius) {
    const r = penpot.createRectangle();
    r.resize(w, h);
    r.x = board.x + x;
    r.y = board.y + y;
    if (fill) r.fills = [{ fillColor: fill, fillOpacity: 1 }];
    else r.fills = [];
    if (stroke) r.strokes = [{ strokeColor: stroke, strokeOpacity: 1, strokeWidth: 1 }];
    if (radius) r.borderRadius = radius;
    board.appendChild(r);
    return r;
  }

  function addText(board, x, y, text, size, isBold, color, width) {
    const t = penpot.createText(text);
    t.x = board.x + x;
    t.y = board.y + y;
    if (width) {
      t.growType = 'auto-height';
      t.resize(width, 24);
    }
    t.fontSize = String(size || 12);
    t.fontWeight = isBold ? "700" : "400";
    t.fills = [{ fillColor: color || C.gray900, fillOpacity: 1 }];
    board.appendChild(t);
    return t;
  }

  function makeInteractive(shapes, destBoard) {
    if (!destBoard) return;
    shapes.forEach(s => {
      try {
        s.addInteraction({
          trigger: "click",
          action: {
            type: "navigate-to",
            destination: destBoard.id,
            animation: { type: "dissolve", duration: 150 }
          }
        });
      } catch(e) {}
    });
  }

  // Get or clean existing boards
  const existing = {};
  root.children.filter(c => c.type === "board").forEach(b => {
    existing[b.name] = b;
  });

  // Remove old versions of DS, M00, M04..M07, D01..D04 to recreate freshly
  const toRecreate = [
    "[DS] Identidade Visual IFNMG & Dimensões Atitudinais",
    "[M00] Início & Seleção de Perfis",
    "[M04] Estudante - Painel Formativo",
    "[M05] Estudante - Autoavaliação Guiada",
    "[M06] Família - Diálogo e Contestação",
    "[M07] Família - Protocolo SLA 48h",
    "[D01] Coordenação - Alerta Precoce (MTSS)",
    "[D02] Coordenação - Clima Escolar (Abordagem Finlandesa)",
    "[D03] Coordenação - Prontuário do Aluno",
    "[D04] Coordenação - Central de Mediação"
  ];

  toRecreate.forEach(name => {
    if (existing[name]) {
      existing[name].remove();
      delete existing[name];
    }
  });

  // 1. BANNER [DS]
  const ds = penpot.createBoard();
  ds.name = "[DS] Identidade Visual IFNMG & Dimensões Atitudinais";
  ds.x = 0;
  ds.y = -260;
  ds.resize(3200, 180);
  ds.fills = [{ fillColor: "#181C20" }];

  addText(ds, 40, 36, "IFNMG • Sistema Web de Avaliação Atitudinal (Mobile-First & Desktop MTSS)", 24, true, C.white);
  addText(ds, 40, 76, "Transformando a observação socioemocional em ativo pedagógico estruturado, rápido (<= 3 toques) e estritamente não-punitivo.", 14, false, "#94A3B8");
  addText(ds, 40, 120, "Paleta Oficial: Verde IF (#2F9E41) | Vermelho IF (#CD191E) | Branco (#FFFFFF) | Grafite (#181C20) • Salvaguarda LGPD e SLA 48h", 12, true, C.primaryBorder);

  // 2. [M00] Início & Seleção de Perfis
  const m00 = penpot.createBoard();
  m00.name = "[M00] Início & Seleção de Perfis";
  m00.x = -440;
  m00.y = 0;
  m00.resize(390, 844);
  m00.fills = [{ fillColor: C.gray50 }];

  // Status Bar
  addRect(m00, 0, 0, 390, 44, C.white, C.gray200);
  addText(m00, 24, 14, "09:41", 12, true, C.gray900);
  addText(m00, 305, 14, "5G • 100%", 12, true, C.gray900);

  // Header
  addRect(m00, 0, 44, 390, 64, C.white, C.gray200);
  addText(m00, 20, 58, "IFNMG • AvaliaAtitude", 15, true, C.gray900);
  addText(m00, 20, 78, "Selecione seu Perfil de Acesso", 11, false, C.gray500);

  // Intro card
  addRect(m00, 16, 124, 358, 64, C.white, C.gray200, 12);
  addRect(m00, 16, 124, 6, 64, C.primary, null, 2);
  addText(m00, 32, 136, "Sistema Web de Avaliação Atitudinal voltado para o Ensino Básico (Fundamental e Médio). Escolha a jornada:", 12, false, C.gray700, 326);

  // Card 1: Professor
  const c1B = addRect(m00, 16, 204, 358, 80, C.primaryLight, C.primary, 12);
  const c1T1 = addText(m00, 32, 218, "Professor(a) - Registro Rápido", 14, true, C.gray900);
  const c1T2 = addText(m00, 32, 240, "Fluxo de 3 toques, turmas, histórico e radar.", 11, false, C.gray600);

  // Card 2: Estudante
  const c2B = addRect(m00, 16, 296, 358, 80, C.white, C.gray200, 12);
  const c2T1 = addText(m00, 32, 310, "Estudante - Percurso Formativo", 14, true, C.gray900);
  const c2T2 = addText(m00, 32, 332, "Painel socioemocional e autoavaliação guiada.", 11, false, C.gray600);

  // Card 3: Família
  const c3B = addRect(m00, 16, 388, 358, 80, C.white, C.gray200, 12);
  const c3T1 = addText(m00, 32, 402, "Família / Responsável Legal", 14, true, C.gray900);
  const c3T2 = addText(m00, 32, 424, "Devolutivas transparentes e canal de diálogo (SLA 48h).", 11, false, C.gray600);

  // Card 4: Coordenação Desktop
  const c4B = addRect(m00, 16, 490, 358, 48, C.white, C.gray300, 8);
  const c4T = addText(m00, 32, 505, "Ir para Coordenação (Desktop Widescreen) →", 12, true, C.primary);

  // Existing boards references
  const m01 = existing["[M01] Prof - Turma e Alunos (1º Toque)"] || root.children.find(c => c.name && c.name.includes("[M01]"));
  const m02A = existing["[M02-A] Prof - Registro (Cooperação + Formativa)"] || root.children.find(c => c.name && c.name.includes("[M02-A]"));
  const m03 = existing["[M03] Prof - Radar e Devolutiva"] || root.children.find(c => c.name && c.name.includes("[M03]"));

  if (m01) makeInteractive([c1B, c1T1, c1T2], m01);

  // 3. [M04] Estudante - Painel Formativo
  const m04 = penpot.createBoard();
  m04.name = "[M04] Estudante - Painel Formativo";
  m04.x = 1760;
  m04.y = 0;
  m04.resize(390, 844);
  m04.fills = [{ fillColor: C.gray50 }];

  addRect(m04, 0, 0, 390, 44, C.white, C.gray200);
  addText(m04, 24, 14, "09:41", 12, true, C.gray900);
  addText(m04, 305, 14, "5G • 100%", 12, true, C.gray900);

  addRect(m04, 0, 44, 390, 64, C.white, C.gray200);
  addText(m04, 20, 58, "Olá, Lucas Mendes!", 15, true, C.gray900);
  addText(m04, 20, 78, "Seu Percurso Socioemocional Formativo • 2026", 11, false, C.gray500);

  // Positive Banner
  addRect(m04, 16, 124, 358, 86, C.primaryLight, C.primaryBorder, 12);
  addText(m04, 30, 138, "Percurso em Destaque • Cooperação Ativa", 13, true, C.primaryDark);
  addText(m04, 30, 162, "Seus professores destacaram seu espírito acolhedor durante os projetos coletivos deste bimestre.", 11, false, C.gray700, 330);

  // Dimension Bars
  addRect(m04, 16, 222, 358, 190, C.white, C.gray200, 12);
  addText(m04, 30, 238, "Suas Competências em Desenvolvimento", 12, true, C.gray800);

  addText(m04, 30, 268, "Trabalho Coletivo & Empatia", 11, false, C.gray700);
  addText(m04, 320, 268, "Consolidada", 11, true, C.primary);
  addRect(m04, 30, 286, 330, 6, C.gray200, null, 3);
  addRect(m04, 30, 286, 300, 6, C.primary, null, 3);

  addText(m04, 30, 308, "Organização de Estudos & Prazos", 11, false, C.gray700);
  addText(m04, 320, 308, "Em Expansão", 11, true, C.primary);
  addRect(m04, 30, 326, 330, 6, C.gray200, null, 3);
  addRect(m04, 30, 326, 260, 6, C.primary, null, 3);

  addText(m04, 30, 348, "Comunicação e Escuta Ativa", 11, false, C.gray700);
  addText(m04, 320, 348, "Consolidada", 11, true, C.primary);
  addRect(m04, 30, 366, 330, 6, C.gray200, null, 3);
  addRect(m04, 30, 366, 290, 6, C.primary, null, 3);

  // Self-assessment CTA Card
  const ctaM05B = addRect(m04, 16, 424, 358, 70, C.white, C.primary, 12);
  const ctaM05T1 = addText(m04, 30, 438, "Autoavaliação do 2º Bimestre Aberta", 13, true, C.primaryDark);
  const ctaM05T2 = addText(m04, 30, 458, "4 perguntas reflexivas sobre seu desenvolvimento pessoal.", 11, false, C.gray600);

  if (m04) makeInteractive([c2B, c2T1, c2T2], m04);

  // 4. [M05] Estudante - Autoavaliação Guiada
  const m05 = penpot.createBoard();
  m05.name = "[M05] Estudante - Autoavaliação Guiada";
  m05.x = 2200;
  m05.y = 0;
  m05.resize(390, 844);
  m05.fills = [{ fillColor: C.gray50 }];

  addRect(m05, 0, 0, 390, 44, C.white, C.gray200);
  addText(m05, 24, 14, "09:41", 12, true, C.gray900);
  addText(m05, 305, 14, "5G • 100%", 12, true, C.gray900);

  addRect(m05, 0, 44, 390, 64, C.white, C.gray200);
  const backM05 = addRect(m05, 16, 60, 32, 32, C.gray100, C.gray200, 6);
  const backM05T = addText(m05, 26, 68, "←", 14, true, C.gray700);
  makeInteractive([backM05, backM05T], m04);
  addText(m05, 56, 58, "Autoavaliação Guiada", 14, true, C.gray900);
  addText(m05, 56, 78, "2º Bimestre • Reflexão Metacognitiva", 11, false, C.gray500);

  // Q1
  addRect(m05, 16, 124, 358, 86, C.white, C.gray200, 10);
  addText(m05, 28, 136, "1. Como você avalia sua cooperação e escuta em grupo?", 12, true, C.gray800, 334);
  addRect(m05, 28, 168, 76, 30, C.white, C.gray300, 6);
  addText(m05, 42, 176, "Em início", 10, false, C.gray600);
  addRect(m05, 110, 168, 76, 30, C.white, C.gray300, 6);
  addText(m05, 124, 176, "Em desenv.", 10, false, C.gray600);
  addRect(m05, 192, 168, 76, 30, C.primary, null, 6);
  addText(m05, 218, 176, "Boa", 10, true, C.white);
  addRect(m05, 274, 168, 76, 30, C.white, C.gray300, 6);
  addText(m05, 286, 176, "Muito boa", 10, false, C.gray600);

  // Q2
  addRect(m05, 16, 222, 358, 86, C.white, C.gray200, 10);
  addText(m05, 28, 234, "2. Você conseguiu cumprir prazos e planejar tarefas?", 12, true, C.gray800, 334);
  addRect(m05, 28, 266, 76, 30, C.white, C.gray300, 6);
  addText(m05, 42, 274, "Em início", 10, false, C.gray600);
  addRect(m05, 110, 266, 76, 30, C.white, C.gray300, 6);
  addText(m05, 124, 274, "Em desenv.", 10, false, C.gray600);
  addRect(m05, 192, 266, 76, 30, C.white, C.gray300, 6);
  addText(m05, 218, 274, "Boa", 10, false, C.gray600);
  addRect(m05, 274, 266, 76, 30, C.primary, null, 6);
  addText(m05, 286, 274, "Muito boa", 10, true, C.white);

  // Submit button
  const subM05B = addRect(m05, 16, 324, 358, 44, C.primary, null, 8);
  const subM05T = addText(m05, 110, 338, "Enviar Minha Autoavaliação", 13, true, C.white);
  makeInteractive([subM05B, subM05T], m04);

  makeInteractive([ctaM05B, ctaM05T1, ctaM05T2], m05);

  // 5. [M06] Família - Diálogo e Contestação
  const m06 = penpot.createBoard();
  m06.name = "[M06] Família - Diálogo e Contestação";
  m06.x = 2640;
  m06.y = 0;
  m06.resize(390, 844);
  m06.fills = [{ fillColor: C.gray50 }];

  addRect(m06, 0, 0, 390, 44, C.white, C.gray200);
  addText(m06, 24, 14, "09:41", 12, true, C.gray900);
  addText(m06, 305, 14, "5G • 100%", 12, true, C.gray900);

  addRect(m06, 0, 44, 390, 64, C.white, C.gray200);
  addText(m06, 20, 58, "Espaço da Família & Diálogo", 14, true, C.gray900);
  addText(m06, 20, 78, "Canal Transparente com a Escola • SLA 48h", 11, false, C.gray500);

  addRect(m06, 16, 124, 358, 54, "#FFFBEB", "#FCD34D", 8);
  addText(m06, 28, 136, "Garantia de resposta e acolhimento em até 48h úteis.", 11, true, "#92400E");
  addText(m06, 28, 154, "Protocolo auditável com parecer do núcleo pedagógico (NAPNE).", 10, false, "#B45309");

  addRect(m06, 16, 192, 358, 180, C.white, C.gray200, 10);
  addText(m06, 28, 206, "Contexto / Justificativa da Família (Lucas Mendes):", 12, true, C.gray800);
  addRect(m06, 28, 230, 334, 76, C.gray50, C.gray300, 6);
  addText(m06, 36, 240, "Lucas iniciou tratamento com anti-histamínico forte, o que gerou sonolência no primeiro horário. O atestado médico do Dr. Roberto foi anexado.", 11, false, C.gray700, 318);

  addRect(m06, 28, 316, 334, 40, C.primaryLight, C.primaryBorder, 6);
  addText(m06, 40, 328, "Anexo: atestado_medico_outubro.pdf (1.2 MB)", 11, true, C.primaryDark);

  const subM06B = addRect(m06, 16, 386, 358, 44, C.primary, null, 8);
  const subM06T = addText(m06, 100, 400, "Enviar Pedido de Diálogo", 13, true, C.white);

  if (m06) makeInteractive([c3B, c3T1, c3T2], m06);

  // 6. [M07] Família - Protocolo SLA 48h
  const m07 = penpot.createBoard();
  m07.name = "[M07] Família - Protocolo SLA 48h";
  m07.x = 3080;
  m07.y = 0;
  m07.resize(390, 844);
  m07.fills = [{ fillColor: C.gray50 }];

  addRect(m07, 0, 0, 390, 44, C.white, C.gray200);
  addText(m07, 24, 14, "09:41", 12, true, C.gray900);
  addText(m07, 305, 14, "5G • 100%", 12, true, C.gray900);

  addRect(m07, 0, 44, 390, 64, C.white, C.gray200);
  const backM07 = addRect(m07, 16, 60, 32, 32, C.gray100, C.gray200, 6);
  const backM07T = addText(m07, 26, 68, "←", 14, true, C.gray700);
  makeInteractive([backM07, backM07T], m06);
  addText(m07, 56, 58, "Protocolo #CONT-2026-89", 14, true, C.gray900);
  addText(m07, 56, 78, "Acompanhamento da Solicitação", 11, false, C.gray500);

  addRect(m07, 16, 124, 358, 70, C.white, C.gray200, 12);
  addText(m07, 28, 136, "Status: Parecer Devolutivo Homologado", 13, true, C.primary);
  addText(m07, 28, 156, "Atestado médico acolhido pelo núcleo pedagógico do IFNMG.", 11, false, C.gray600, 330);

  addRect(m07, 16, 206, 358, 160, C.primaryLight, C.primaryBorder, 12);
  addText(m07, 28, 220, "Parecer Oficial da Coordenação Pedagógica", 13, true, C.primaryDark);
  addText(m07, 28, 248, "Atestado médico acolhido pelo núcleo pedagógico. A equipe docente foi orientada quanto à sonolência matinal e à adaptação do ritmo.", 11, false, C.gray700, 330);
  addText(m07, 28, 324, "Assinado por: Profª. Cristina Prado (Coord. Pedagógica)", 11, true, C.primaryDark);

  makeInteractive([subM06B, subM06T], m07);

  // 7. [D01] Coordenação - Alerta Precoce (MTSS)
  const d01 = penpot.createBoard();
  d01.name = "[D01] Coordenação - Alerta Precoce (MTSS)";
  d01.x = 0;
  d01.y = 960;
  d01.resize(1440, 900);
  d01.fills = [{ fillColor: C.gray50 }];

  // Sidebar
  addRect(d01, 0, 0, 260, 900, C.white, C.gray200);
  addText(d01, 20, 24, "IFNMG • AvaliaAtitude", 15, true, C.gray900);
  addText(d01, 20, 44, "Gestão & Coordenação Pedagógica", 11, false, C.gray500);

  addRect(d01, 12, 110, 236, 40, C.primaryLight, C.primaryBorder, 8);
  addText(d01, 28, 122, "Alerta Precoce (MTSS)", 13, true, C.primaryDark);

  const d1NavD02 = addRect(d01, 12, 156, 236, 40, C.white, null, 8);
  const d1NavD02T = addText(d01, 28, 168, "Clima Escolar Finlandês", 13, false, C.gray600);

  const d1NavD03 = addRect(d01, 12, 202, 236, 40, C.white, null, 8);
  const d1NavD03T = addText(d01, 28, 214, "Prontuário do Aluno", 13, false, C.gray600);

  const d1NavD04 = addRect(d01, 12, 248, 236, 40, C.white, null, 8);
  const d1NavD04T = addText(d01, 28, 260, "Central de Mediação", 13, false, C.gray600);

  // Topbar
  addRect(d01, 260, 0, 1180, 72, C.white, C.gray200);
  addText(d01, 290, 28, "Painel de Alerta Precoce (MTSS) • 2º Bimestre", 16, true, C.gray900);

  // 4 KPIs
  addRect(d01, 290, 96, 260, 80, C.white, C.gray200, 10);
  addText(d01, 310, 110, "Estudantes Acompanhados", 11, false, C.gray500);
  addText(d01, 310, 130, "482", 22, true, C.gray900);
  addText(d01, 310, 158, "100% da rede ativa", 10, true, C.primary);

  addRect(d01, 570, 96, 260, 80, C.white, C.gray200, 10);
  addText(d01, 590, 110, "Nível 1 (Universal / Preventivo)", 11, false, C.gray500);
  addText(d01, 590, 130, "438", 22, true, C.primary);
  addText(d01, 590, 158, "90.8% sem intercorrências", 10, true, C.primary);

  addRect(d01, 850, 96, 260, 80, C.white, C.gray200, 10);
  addText(d01, 870, 110, "Nível 2 (Apoio Focal)", 11, false, C.gray500);
  addText(d01, 870, 130, "31", 22, true, "#D97706");
  addText(d01, 870, 158, "6.4% em monitoramento", 10, true, "#D97706");

  addRect(d01, 1130, 96, 260, 80, C.alertBg, C.alertBorder, 10);
  addText(d01, 1150, 110, "Nível 3 (Intervenção Imediata)", 11, false, C.alert);
  addText(d01, 1150, 130, "13", 22, true, C.alert);
  addText(d01, 1150, 158, "2.7% requer ação emergencial", 10, true, C.alert);

  // MTSS Table Container with focus on Lucas and Beatriz
  addRect(d01, 290, 196, 1100, 480, C.white, C.gray200, 12);
  addText(d01, 314, 216, "Estudantes em Monitoramento Preventivo (Cruzamento Multidimensional)", 14, true, C.gray800);

  // Row 1: Lucas Mendes Silva
  const row1B = addRect(d01, 314, 256, 1052, 64, C.primaryLight, C.primary, 8);
  addText(d01, 334, 268, "Lucas Mendes Silva • Matrícula 2024.1.09B.01 • 9º Ano B", 13, true, C.gray900);
  addText(d01, 334, 292, "Queda Atitudinal: -12% (Sonolência / Acolhida) | Frequência: 96% | Entregas: 94% | Nível 2", 11, false, C.gray600);
  const r1BtnP = addRect(d01, 1180, 270, 80, 32, C.white, C.gray300, 6);
  const r1BtnPT = addText(d01, 1194, 278, "Prontuário", 11, true, C.gray700);
  const r1BtnM = addRect(d01, 1270, 270, 80, 32, C.primary, null, 6);
  const r1BtnMT = addText(d01, 1282, 278, "Ver SLA", 11, true, C.white);

  // Row 2: Beatriz Santos Oliveira
  const row2B = addRect(d01, 314, 330, 1052, 64, C.primaryLight, C.primary, 8);
  addText(d01, 334, 342, "Beatriz Santos Oliveira • Matrícula 2024.1.09B.02 • 9º Ano B", 13, true, C.gray900);
  addText(d01, 334, 366, "Queda Atitudinal: -15% (Autogestão de materiais) | Frequência: 91% | Entregas: 88% | Nível 2", 11, false, C.gray600);
  const r2BtnP = addRect(d01, 1180, 344, 80, 32, C.white, C.gray300, 6);
  const r2BtnPT = addText(d01, 1194, 352, "Prontuário", 11, true, C.gray700);
  const r2BtnI = addRect(d01, 1270, 344, 80, 32, C.white, C.primary, 6);
  const r2BtnIT = addText(d01, 1282, 352, "+ Apoio", 11, true, C.primary);

  // Row 3: Gabriel Costa
  addRect(d01, 314, 404, 1052, 64, C.gray50, C.gray200, 8);
  addText(d01, 334, 416, "Gabriel Costa Souza • Matrícula 2024.1.09B.03 • 9º Ano B", 13, true, C.gray900);
  addText(d01, 334, 440, "Queda Atitudinal: -28% (Engajamento / Atrasos) | Frequência: 81% | Entregas: 72% | Nível 3 (Intensivo)", 11, false, C.alert);

  if (d01) makeInteractive([c4B, c4T], d01);

  // 8. [D02] Coordenação - Clima Escolar
  const d02 = penpot.createBoard();
  d02.name = "[D02] Coordenação - Clima Escolar (Abordagem Finlandesa)";
  d02.x = 1540;
  d02.y = 960;
  d02.resize(1440, 900);
  d02.fills = [{ fillColor: C.gray50 }];

  // Sidebar
  addRect(d02, 0, 0, 260, 900, C.white, C.gray200);
  addText(d02, 20, 24, "IFNMG • AvaliaAtitude", 15, true, C.gray900);
  addText(d02, 20, 44, "Gestão & Coordenação Pedagógica", 11, false, C.gray500);

  const d2NavD01 = addRect(d02, 12, 110, 236, 40, C.white, null, 8);
  const d2NavD01T = addText(d02, 28, 122, "Alerta Precoce (MTSS)", 13, false, C.gray600);

  addRect(d02, 12, 156, 236, 40, C.primaryLight, C.primaryBorder, 8);
  addText(d02, 28, 168, "Clima Escolar Finlandês", 13, true, C.primaryDark);

  const d2NavD03 = addRect(d02, 12, 202, 236, 40, C.white, null, 8);
  const d2NavD03T = addText(d02, 28, 214, "Prontuário do Aluno", 13, false, C.gray600);

  const d2NavD04 = addRect(d02, 12, 248, 236, 40, C.white, null, 8);
  const d2NavD04T = addText(d02, 28, 260, "Central de Mediação", 13, false, C.gray600);

  addRect(d02, 260, 0, 1180, 72, C.white, C.gray200);
  addText(d02, 290, 28, "Painel de Gestão do Clima Escolar (Abordagem Finlandesa / WHO)", 16, true, C.gray900);

  // Heatmap Table
  addRect(d02, 290, 96, 1100, 360, C.white, C.gray200, 12);
  addText(d02, 314, 116, "Mapa de Calor por Turma e Dimensão BNCC/CASEL (Sem rotular indivíduos)", 14, true, C.gray800);

  // 9º B Highlighted Row
  addText(d02, 314, 170, "9º Ano B (Foco)", 13, true, C.gray900);
  // Cells
  addRect(d02, 490, 160, 120, 38, "#DCFCE7", "#86EFAC", 6);
  addText(d02, 536, 172, "8.8", 12, true, C.primaryDark);

  const alertCell = addRect(d02, 630, 160, 120, 38, "#FEE2E2", C.primary, 6);
  addText(d02, 676, 172, "6.2", 12, true, C.alert);

  addRect(d02, 770, 160, 120, 38, "#DCFCE7", "#86EFAC", 6);
  addText(d02, 816, 172, "8.4", 12, true, C.primaryDark);

  addRect(d02, 910, 160, 120, 38, "#FEF3C7", "#FCD34D", 6);
  addText(d02, 956, 172, "7.4", 12, true, "#92400E");

  // Diagnosis Card
  addRect(d02, 290, 480, 1100, 140, C.white, C.gray200, 12);
  addRect(d02, 290, 480, 6, 140, C.primary, null, 2);
  addText(d02, 320, 502, "Diagnóstico Contextual: 9º Ano B • Autogestão & Prazos (Índice 6.2/10)", 14, true, C.gray900);
  addText(d02, 320, 528, "Mais de 35% dos estudantes relataram sobrecarga ou dificuldade de autorregulação. Recomendada oficina do NAPNE de gestão de tempo e alinhamento de cronograma de entregas.", 12, false, C.gray700, 850);
  const planBtn = addRect(d02, 320, 570, 240, 36, C.primary, null, 6);
  const planBtnT = addText(d02, 346, 580, "Criar Plano de Ação (9º B)", 12, true, C.white);

  // 9. [D03] Coordenação - Prontuário do Aluno
  const d03 = penpot.createBoard();
  d03.name = "[D03] Coordenação - Prontuário do Aluno";
  d03.x = 3080;
  d03.y = 960;
  d03.resize(1440, 900);
  d03.fills = [{ fillColor: C.gray50 }];

  // Sidebar
  addRect(d03, 0, 0, 260, 900, C.white, C.gray200);
  addText(d03, 20, 24, "IFNMG • AvaliaAtitude", 15, true, C.gray900);
  addText(d03, 20, 44, "Gestão & Coordenação Pedagógica", 11, false, C.gray500);

  const d3NavD01 = addRect(d03, 12, 110, 236, 40, C.white, null, 8);
  const d3NavD01T = addText(d03, 28, 122, "Alerta Precoce (MTSS)", 13, false, C.gray600);

  const d3NavD02 = addRect(d03, 12, 156, 236, 40, C.white, null, 8);
  const d3NavD02T = addText(d03, 28, 168, "Clima Escolar Finlandês", 13, false, C.gray600);

  addRect(d03, 12, 202, 236, 40, C.primaryLight, C.primaryBorder, 8);
  addText(d03, 28, 214, "Prontuário do Aluno", 13, true, C.primaryDark);

  const d3NavD04 = addRect(d03, 12, 248, 236, 40, C.white, null, 8);
  const d3NavD04T = addText(d03, 28, 260, "Central de Mediação", 13, false, C.gray600);

  addRect(d03, 260, 0, 1180, 72, C.white, C.gray200);
  addText(d03, 290, 28, "Prontuário Atitudinal e Socioemocional • Visão Formativa 360º", 16, true, C.gray900);

  // Student Switcher Pills
  const pLucas = addRect(d03, 290, 96, 200, 36, C.primaryLight, C.primary, 18);
  addText(d03, 314, 106, "Lucas Mendes (9º B)", 12, true, C.primaryDark);

  const pBeatriz = addRect(d03, 502, 96, 200, 36, C.white, C.gray300, 18);
  addText(d03, 526, 106, "Beatriz Santos (9º B)", 12, true, C.gray700);

  // Student Header Card
  addRect(d03, 290, 148, 1100, 90, C.white, C.gray200, 12);
  addRect(d03, 310, 163, 56, 56, C.primaryLight, C.primaryBorder, 28);
  addText(d03, 326, 178, "LM", 18, true, C.primaryDark);
  addText(d03, 382, 170, "Lucas Mendes Silva • Matrícula 2024.1.09B.01 • 9º Ano B", 15, true, C.gray900);
  addText(d03, 382, 196, "Índice Geral: 8.8/10 | Frequência: 96% | Entregas: 94% | Status: Consistente (SLA Homologado)", 12, false, C.gray600);

  // 10. [D04] Coordenação - Central de Mediação
  const d04 = penpot.createBoard();
  d04.name = "[D04] Coordenação - Central de Mediação";
  d04.x = 4620;
  d04.y = 960;
  d04.resize(1440, 900);
  d04.fills = [{ fillColor: C.gray50 }];

  addRect(d04, 0, 0, 260, 900, C.white, C.gray200);
  addText(d04, 20, 24, "IFNMG • AvaliaAtitude", 15, true, C.gray900);
  addText(d04, 20, 44, "Gestão & Coordenação Pedagógica", 11, false, C.gray500);

  const d4NavD01 = addRect(d04, 12, 110, 236, 40, C.white, null, 8);
  const d4NavD01T = addText(d04, 28, 122, "Alerta Precoce (MTSS)", 13, false, C.gray600);

  const d4NavD02 = addRect(d04, 12, 156, 236, 40, C.white, null, 8);
  const d4NavD02T = addText(d04, 28, 168, "Clima Escolar Finlandês", 13, false, C.gray600);

  const d4NavD03 = addRect(d04, 12, 202, 236, 40, C.white, null, 8);
  const d4NavD03T = addText(d04, 28, 214, "Prontuário do Aluno", 13, false, C.gray600);

  addRect(d04, 12, 248, 236, 40, C.primaryLight, C.primaryBorder, 8);
  addText(d04, 28, 260, "Central de Mediação", 13, true, C.primaryDark);

  addRect(d04, 260, 0, 1180, 72, C.white, C.gray200);
  addText(d04, 290, 28, "Central de Mediação & Diálogo Transparente (Garantia SLA 48h)", 16, true, C.gray900);

  // Protocol Card
  addRect(d04, 290, 96, 1100, 460, C.white, C.gray200, 12);
  addRect(d04, 290, 96, 6, 460, C.primary, null, 2);
  addText(d04, 320, 120, "Protocolo #CONT-2026-89 • Lucas Mendes Silva (9º Ano B)", 15, true, C.gray900);
  addText(d04, 320, 144, "Recebido em 25/10/2026 às 14:10 • SLA Restante: 31 horas", 11, false, C.gray500);

  // Side-by-side
  addRect(d04, 320, 178, 500, 140, C.gray50, C.gray200, 8);
  addText(d04, 336, 192, "1. Registro do Docente em Sala", 12, true, C.gray600);
  addText(d04, 336, 216, "Profª. Camila Diniz: 'Estudante apresentou postura apática e desengajada durante a explicação matinal.'", 11, false, C.gray700, 460);

  addRect(d04, 850, 178, 514, 140, C.gray50, C.gray200, 8);
  addText(d04, 866, 192, "2. Justificativa da Família & Aluno", 12, true, C.gray700);
  addText(d04, 866, 216, "Srª. Mariana Mendes: 'Lucas iniciou tratamento com anti-histamínico na véspera. O atestado médico do Dr. Roberto foi anexado.'", 11, false, C.gray700, 480);

  // Official Feedback Box
  addRect(d04, 320, 338, 1044, 130, C.primaryLight, C.primaryBorder, 8);
  addText(d04, 336, 352, "Parecer Devolutivo Homologado (Enviado no app da família):", 12, true, C.primaryDark);
  addText(d04, 336, 376, "'Atestado médico acolhido pelo núcleo pedagógico. A equipe docente foi orientada quanto à sonolência matinal. O registro atitudinal foi retificado para preservar a trajetória formativa do estudante.'", 11, false, C.gray800, 1000);
  addText(d04, 336, 436, "Assinado por: Profª. Cristina Prado (Coordenação Pedagógica)", 11, true, C.primaryDark);

  // Connect inter-board navigation
  makeInteractive([r1BtnP, r1BtnPT, r2BtnP, r2BtnPT], d03);
  makeInteractive([r1BtnM, r1BtnMT], d04);
  makeInteractive([d1NavD02, d1NavD02T], d02);
  makeInteractive([d1NavD03, d1NavD03T], d03);
  makeInteractive([d1NavD04, d1NavD04T], d04);

  makeInteractive([d2NavD01, d2NavD01T], d01);
  makeInteractive([d2NavD03, d2NavD03T], d03);
  makeInteractive([d2NavD04, d2NavD04T], d04);
  makeInteractive([planBtn, planBtnT], d01);

  makeInteractive([d3NavD01, d3NavD01T], d01);
  makeInteractive([d3NavD02, d3NavD02T], d02);
  makeInteractive([d3NavD04, d3NavD04T], d04);

  makeInteractive([d4NavD01, d4NavD01T], d01);
  makeInteractive([d4NavD02, d4NavD02T], d02);
  makeInteractive([d4NavD03, d4NavD03T], d03);

  return {
    success: true,
    page: penpot.currentPage.name,
    totalBoards: page.root.children.filter(c => c.type === "board").length
  };
})();
`;

async function main() {
  console.log("Iniciando reconstrução total e sincronização do Protótipo Interativo no Penpot...");
  const result = await runPenpotScript(BUILDER_CODE);
  console.log("Resultado da execução:", result);
}

main().catch(console.error);
