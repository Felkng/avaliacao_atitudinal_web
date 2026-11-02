/**
 * scripts/update_penpot_mobile.js
 * 
 * Script Node.js que interage com o Penpot MCP (http://localhost:4401/mcp)
 * via JSON-RPC para:
 * 1. Atualizar [M01] com exatamente 2 alunos (Lucas Mendes e Beatriz Santos)
 * 2. Gerar [M02-A] (Cooperação + Formativa + Chips verdes selecionados)
 * 3. Gerar [M02-B] (Autogestão + Ponto de Atenção + Chips selecionados)
 * 4. Gerar [M03] (Radar e Prontuário Atitudinal)
 * 5. Criar conexões de interação nativa (addInteraction) entre as pranchas
 * 6. Sincronizar nas páginas do Penpot
 */

const PENPOT_MCP_URL = "http://localhost:4401/mcp";

async function executePenpotCode(code) {
  // 1. Initialize session
  const initRes = await fetch(PENPOT_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "penpot-mobile-updater", version: "1.0" }
      }
    })
  });

  const sessionId = initRes.headers.get("mcp-session-id");
  if (!sessionId) {
    throw new Error("Não foi possível obter mcp-session-id do servidor Penpot.");
  }

  // 2. Notification initialized
  await fetch(PENPOT_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "mcp-session-id": sessionId
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized"
    })
  });

  // 3. Call execute_code
  const callRes = await fetch(PENPOT_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "mcp-session-id": sessionId
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "execute_code",
        arguments: { code }
      }
    })
  });

  const text = await callRes.text();
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = JSON.parse(line.slice(6));
      if (data.error) {
        throw new Error("Erro MCP: " + JSON.stringify(data.error));
      }
      if (data.result && data.result.content) {
        const payloadText = data.result.content[0]?.text;
        if (payloadText && payloadText.startsWith("Tool execution failed:")) {
          throw new Error(payloadText);
        }
        try {
          return JSON.parse(payloadText);
        } catch (e) {
          return { rawPayload: payloadText };
        }
      }
    }
  }
  return { raw: text };
}

async function main() {
  console.log("Iniciando sincronização mobile no Penpot via MCP...");

  const penpotScript = `
    function syncMobileBoardsOnPage(targetPage) {
      const root = targetPage.root;

      // Helper functions
      function addRect(board, x, y, w, h, fillHex, radius, strokeHex) {
        const r = penpot.createRectangle();
        r.resize(w, h);
        r.x = board.x + x;
        r.y = board.y + y;
        if (fillHex) r.fills = [{ fillColor: fillHex, fillOpacity: 1 }];
        else r.fills = [];
        if (strokeHex) r.strokes = [{ strokeColor: strokeHex, strokeOpacity: 1, strokeWidth: 1 }];
        if (radius) r.borderRadius = radius;
        board.appendChild(r);
        return r;
      }

      function addText(board, x, y, text, size, weight, colorHex, align) {
        const t = penpot.createText(text);
        t.x = board.x + x;
        t.y = board.y + y;
        if (size) t.fontSize = String(size);
        if (weight) t.fontWeight = String(weight);
        if (colorHex) t.fills = [{ fillColor: colorHex, fillOpacity: 1 }];
        if (align) t.align = align;
        board.appendChild(t);
        return t;
      }

      function addBadge(board, x, y, w, h, text, bgHex, textColorHex) {
        addRect(board, x, y, w, h, bgHex, 10);
        addText(board, x + 6, y + 2, text, 9, "700", textColorHex);
      }

      function buildStatusBar(board) {
        addRect(board, 0, 0, 390, 36, "#FFFFFF", 0);
        addText(board, 24, 10, "09:41", 12, "700", "#111827");
        addText(board, 310, 10, "5G • 100%", 11, "600", "#6B7280");
      }

      function buildBottomNav(board, activeIndex) {
        const navY = 770;
        addRect(board, 0, navY, 390, 74, "#FFFFFF", 0, "#E5E7EB");

        const tabs = [
          { name: "Turmas", icon: "⊞", x: 40 },
          { name: "Registro", icon: "✍", x: 135 },
          { name: "Radar", icon: "◎", x: 235 },
          { name: "Aluno", icon: "👤", x: 325 }
        ];

        const tabShapes = [];
        tabs.forEach((tab, idx) => {
          const isActive = idx === activeIndex;
          const color = isActive ? "#2F9E41" : "#6B7280";
          let bgShape = null;
          if (isActive) {
            bgShape = addRect(board, tab.x - 18, navY + 8, 54, 48, "#F0FDF4", 10);
          } else {
            bgShape = addRect(board, tab.x - 18, navY + 8, 54, 48, null, 10);
          }
          addText(board, tab.x, navY + 14, tab.icon, 14, "700", color, "center");
          addText(board, tab.x - 10, navY + 34, tab.name, 10, isActive ? "700" : "400", color);
          tabShapes.push(bgShape);
        });
        return tabShapes;
      }

      // ==========================================
      // [M01] Prof - Turma e Alunos (1º Toque)
      // ==========================================
      let m01 = root.children.find(b => b.type === 'board' && b.name && b.name.includes('[M01]'));
      if (!m01) {
        m01 = penpot.createBoard();
        m01.name = "[M01] Prof - Turma e Alunos (1º Toque)";
        m01.resize(390, 844);
      } else {
        const ch = [...m01.children];
        ch.forEach(c => c.remove());
      }
      m01.x = 0;
      m01.y = 0;
      m01.fills = [{ fillColor: "#F9FAFB", fillOpacity: 1 }];
      buildStatusBar(m01);

      // Header M01
      addRect(m01, 0, 36, 390, 68, "#FFFFFF", 0, "#E5E7EB");
      addRect(m01, 16, 50, 34, 40, "#FFFFFF", 6, "#2F9E41");
      addText(m01, 23, 62, "IF", 14, "700", "#2F9E41");
      addText(m01, 60, 48, "IFNMG • AvaliaAtitude", 14, "700", "#111827");
      addText(m01, 60, 68, "Profª. Luciana Rocha • 2º Bimestre", 11, "400", "#6B7280");
      addBadge(m01, 298, 56, 76, 22, "DOCENTE", "#F0FDF4", "#166534");

      // Turma Card
      addRect(m01, 16, 116, 358, 64, "#FFFFFF", 12, "#E5E7EB");
      addText(m01, 30, 126, "Turma: 9º Ano B • Ensino Fundamental", 13, "700", "#111827");
      addText(m01, 30, 148, "2 Estudantes Matriculados • Registro Semanal Ativo", 11, "400", "#6B7280");
      addBadge(m01, 305, 126, 56, 20, "Sala 14", "#F3F4F6", "#374151");

      // Busca e Filtros
      addRect(m01, 16, 192, 358, 40, "#FFFFFF", 8, "#D1D5DB");
      addText(m01, 32, 204, "🔍 Buscar estudante por nome...", 12, "400", "#9CA3AF");

      addBadge(m01, 16, 242, 70, 24, "Todos (2)", "#2F9E41", "#FFFFFF");
      addBadge(m01, 92, 242, 96, 24, "Cooperação (1)", "#FFFFFF", "#374151");
      addBadge(m01, 194, 242, 96, 24, "Autogestão (1)", "#FFFFFF", "#374151");

      addText(m01, 16, 282, "ESTUDANTES DA TURMA (SELECIONE PARA REGISTRAR)", 11, "700", "#6B7280");

      // Aluno 1: Lucas Mendes Silva
      const cardLucas = addRect(m01, 16, 304, 358, 96, "#FFFFFF", 12, "#2F9E41");
      addRect(m01, 16, 304, 6, 96, "#2F9E41", 4);
      addRect(m01, 32, 320, 44, 44, "#DCFCE7", 22);
      addText(m01, 44, 332, "LM", 14, "700", "#166534");
      addText(m01, 88, 320, "Lucas Mendes Silva", 14, "700", "#111827");
      addText(m01, 88, 340, "Matrícula: 2024.1.09B.01 • 9º Ano B", 11, "400", "#6B7280");
      addText(m01, 88, 358, "Última: Cooperação e Empatia • Hoje 08:30", 11, "600", "#166534");
      addBadge(m01, 284, 318, 76, 20, "Consistente", "#DCFCE7", "#166534");

      const btnRegLucas = addRect(m01, 88, 376, 110, 20, "#2F9E41", 6);
      addText(m01, 104, 380, "+ REGISTRAR", 10, "700", "#FFFFFF");
      const btnRadarLucas = addRect(m01, 208, 376, 70, 20, "#FFFFFF", 6, "#D1D5DB");
      addText(m01, 224, 380, "RADAR", 10, "700", "#374151");

      // Aluno 2: Beatriz Santos Oliveira
      const cardBeatriz = addRect(m01, 16, 416, 358, 96, "#FFFFFF", 12, "#2563EB");
      addRect(m01, 16, 416, 6, 96, "#2563EB", 4);
      addRect(m01, 32, 432, 44, 44, "#EFF6FF", 22);
      addText(m01, 45, 444, "BS", 14, "700", "#1D4ED8");
      addText(m01, 88, 432, "Beatriz Santos Oliveira", 14, "700", "#111827");
      addText(m01, 88, 452, "Matrícula: 2024.1.09B.02 • 9º Ano B", 11, "400", "#6B7280");
      addText(m01, 88, 470, "Última: Autogestão e Prazos • Ontem 14:15", 11, "600", "#1D4ED8");
      addBadge(m01, 294, 430, 66, 20, "Destaque", "#EFF6FF", "#1D4ED8");

      const btnRegBeatriz = addRect(m01, 88, 488, 110, 20, "#2F9E41", 6);
      addText(m01, 104, 492, "+ REGISTRAR", 10, "700", "#FFFFFF");
      const btnRadarBeatriz = addRect(m01, 208, 488, 70, 20, "#FFFFFF", 6, "#D1D5DB");
      addText(m01, 224, 492, "RADAR", 10, "700", "#374151");

      const navM01Tabs = buildBottomNav(m01, 0);

      // ==========================================
      // [M02-A] Prof - Registro (Cooperação + Formativa)
      // ==========================================
      let m02A = root.children.find(b => b.type === 'board' && b.name && b.name.includes('[M02-A]'));
      if (!m02A) {
        m02A = penpot.createBoard();
        m02A.name = "[M02-A] Prof - Registro (Cooperação + Formativa)";
        m02A.resize(390, 844);
      } else {
        const ch = [...m02A.children];
        ch.forEach(c => c.remove());
      }
      m02A.x = 440;
      m02A.y = 0;
      m02A.fills = [{ fillColor: "#F9FAFB", fillOpacity: 1 }];
      buildStatusBar(m02A);

      // Header M02-A
      addRect(m02A, 0, 36, 390, 56, "#FFFFFF", 0, "#E5E7EB");
      const backBtnA = addRect(m02A, 14, 46, 32, 32, "#FFFFFF", 6, "#D1D5DB");
      addText(m02A, 24, 52, "←", 14, "700", "#374151");
      addText(m02A, 56, 46, "Registro Rápido (3 Toques)", 14, "700", "#111827");
      addText(m02A, 56, 66, "Formulário Ágil Sem Digitação", 11, "400", "#6B7280");
      addBadge(m02A, 300, 50, 74, 22, "9º Ano B", "#F0FDF4", "#166534");

      // Estudante Ativo Lucas
      addRect(m02A, 16, 102, 358, 54, "#FFFFFF", 10, "#E5E7EB");
      addRect(m02A, 16, 102, 5, 54, "#2F9E41", 3);
      addRect(m02A, 28, 110, 38, 38, "#DCFCE7", 19);
      addText(m02A, 38, 120, "LM", 13, "700", "#166534");
      addText(m02A, 76, 112, "Lucas Mendes Silva", 13, "700", "#111827");
      addText(m02A, 76, 130, "Matrícula: 2024.1.09B.01 • 9º Ano B", 10, "400", "#6B7280");

      // Toque 1: Dimensões
      addText(m02A, 16, 168, "TOQUE 1: DIMENSÃO SOCIOEMOCIONAL (BNCC)", 11, "700", "#6B7280");

      // Cooperação (ATIVA)
      addRect(m02A, 16, 186, 358, 48, "#F0FDF4", 8, "#2F9E41");
      addRect(m02A, 28, 200, 16, 16, "#2F9E41", 8);
      addRect(m02A, 33, 205, 6, 6, "#FFFFFF", 3);
      addText(m02A, 52, 194, "Cooperação e Empatia (Ativa)", 13, "700", "#166534");
      addText(m02A, 52, 212, "Trabalho coletivo, escuta ativa e solidariedade", 10, "400", "#166534");
      addBadge(m02A, 286, 198, 76, 18, "BNCC CG09", "#DCFCE7", "#166534");

      // Autogestão (clicável -> navega para M02-B)
      const cardDimAutoA = addRect(m02A, 16, 240, 358, 42, "#FFFFFF", 8, "#E5E7EB");
      addRect(m02A, 28, 252, 16, 16, "#FFFFFF", 8, "#D1D5DB");
      addText(m02A, 52, 246, "Autogestão e Pontualidade", 12, "600", "#374151");
      addText(m02A, 52, 262, "Organização, cumprimento de prazos e foco", 10, "400", "#9CA3AF");

      // Engajamento
      addRect(m02A, 16, 288, 358, 42, "#FFFFFF", 8, "#E5E7EB");
      addRect(m02A, 28, 300, 16, 16, "#FFFFFF", 8, "#D1D5DB");
      addText(m02A, 52, 294, "Engajamento e Comunicação", 12, "600", "#374151");
      addText(m02A, 52, 310, "Participação e postura propositiva em grupo", 10, "400", "#9CA3AF");

      // Resiliência
      addRect(m02A, 16, 336, 358, 42, "#FFFFFF", 8, "#E5E7EB");
      addRect(m02A, 28, 348, 16, 16, "#FFFFFF", 8, "#D1D5DB");
      addText(m02A, 52, 342, "Resiliência e Superação", 12, "600", "#374151");
      addText(m02A, 52, 358, "Persistência diante de erros e regulação emocional", 10, "400", "#9CA3AF");

      // Toque 2: Natureza
      addText(m02A, 16, 392, "TOQUE 2: NATUREZA DA EVIDÊNCIA", 11, "700", "#6B7280");

      // Formativa (Ativa)
      addRect(m02A, 16, 410, 114, 54, "#F0FDF4", 10, "#2F9E41");
      addText(m02A, 30, 420, "✓ Formativa", 12, "700", "#2F9E41");
      addText(m02A, 24, 438, "Comportamento positivo", 9, "400", "#166534");

      // Ponto de Atenção (clicável -> navega para M02-B)
      const cardNatAtencaoA = addRect(m02A, 138, 410, 114, 54, "#FFFFFF", 10, "#E5E7EB");
      addText(m02A, 146, 420, "Ponto Atenção", 12, "600", "#CD191E");
      addText(m02A, 146, 438, "Demanda mediação", 9, "400", "#6B7280");

      // Neutra
      addRect(m02A, 260, 410, 114, 54, "#FFFFFF", 10, "#E5E7EB");
      addText(m02A, 286, 420, "Neutra", 12, "600", "#374151");
      addText(m02A, 270, 438, "Fato contextual", 9, "400", "#6B7280");

      // Toque 3: Evidências Objetivas (Chips Selecionados)
      addText(m02A, 16, 480, "TOQUE 3: EVIDÊNCIA OBSERVÁVEL (CHIPS MÚLTIPLOS)", 11, "700", "#6B7280");

      addRect(m02A, 16, 500, 170, 32, "#2F9E41", 8);
      addText(m02A, 26, 508, "✓ Apoio ativo aos colegas", 11, "700", "#FFFFFF");

      addRect(m02A, 194, 500, 150, 32, "#2F9E41", 8);
      addText(m02A, 204, 508, "✓ Escuta acolhedora", 11, "700", "#FFFFFF");

      addRect(m02A, 16, 540, 150, 32, "#FFFFFF", 8, "#D1D5DB");
      addText(m02A, 26, 548, "Mediação de conflitos", 11, "600", "#374151");

      addRect(m02A, 174, 540, 140, 32, "#FFFFFF", 8, "#D1D5DB");
      addText(m02A, 184, 548, "Postura receptiva", 11, "600", "#374151");

      addRect(m02A, 16, 580, 180, 32, "#FFFFFF", 8, "#D1D5DB");
      addText(m02A, 26, 588, "Liderança compartilhada", 11, "600", "#374151");

      const btnSalvarA = addRect(m02A, 16, 636, 358, 48, "#2F9E41", 10);
      addText(m02A, 90, 650, "✓ SALVAR REGISTRO IMEDIATO", 13, "700", "#FFFFFF");
      addText(m02A, 70, 696, "+ Anotação confidencial / foto caderno", 11, "600", "#6B7280");

      const navM02ATabs = buildBottomNav(m02A, 1);

      // ==========================================
      // [M02-B] Prof - Registro (Autogestão + Ponto de Atenção)
      // ==========================================
      let m02B = root.children.find(b => b.type === 'board' && b.name && b.name.includes('[M02-B]'));
      if (!m02B) {
        m02B = penpot.createBoard();
        m02B.name = "[M02-B] Prof - Registro (Autogestão + Ponto de Atenção)";
        m02B.resize(390, 844);
      } else {
        const ch = [...m02B.children];
        ch.forEach(c => c.remove());
      }
      m02B.x = 880;
      m02B.y = 0;
      m02B.fills = [{ fillColor: "#F9FAFB", fillOpacity: 1 }];
      buildStatusBar(m02B);

      // Header M02-B
      addRect(m02B, 0, 36, 390, 56, "#FFFFFF", 0, "#E5E7EB");
      const backBtnB = addRect(m02B, 14, 46, 32, 32, "#FFFFFF", 6, "#D1D5DB");
      addText(m02B, 24, 52, "←", 14, "700", "#374151");
      addText(m02B, 56, 46, "Registro Rápido (3 Toques)", 14, "700", "#111827");
      addText(m02B, 56, 66, "Estado: Ponto de Atenção Selecionado", 11, "400", "#6B7280");
      addBadge(m02B, 300, 50, 74, 22, "9º Ano B", "#EFF6FF", "#1D4ED8");

      // Estudante Ativo Beatriz
      addRect(m02B, 16, 102, 358, 54, "#FFFFFF", 10, "#E5E7EB");
      addRect(m02B, 16, 102, 5, 54, "#2563EB", 3);
      addRect(m02B, 28, 110, 38, 38, "#EFF6FF", 19);
      addText(m02B, 38, 120, "BS", 13, "700", "#1D4ED8");
      addText(m02B, 76, 112, "Beatriz Santos Oliveira", 13, "700", "#111827");
      addText(m02B, 76, 130, "Matrícula: 2024.1.09B.02 • 9º Ano B", 10, "400", "#6B7280");

      // Toque 1: Dimensões
      addText(m02B, 16, 168, "TOQUE 1: DIMENSÃO SOCIOEMOCIONAL (BNCC)", 11, "700", "#6B7280");

      // Cooperação (clicável -> navega para M02-A)
      const cardDimCoopB = addRect(m02B, 16, 186, 358, 42, "#FFFFFF", 8, "#E5E7EB");
      addRect(m02B, 28, 198, 16, 16, "#FFFFFF", 8, "#D1D5DB");
      addText(m02B, 52, 192, "Cooperação e Empatia", 12, "600", "#374151");
      addText(m02B, 52, 208, "Trabalho coletivo, escuta ativa e solidariedade", 10, "400", "#9CA3AF");

      // Autogestão (ATIVA)
      addRect(m02B, 16, 234, 358, 48, "#F0FDF4", 8, "#2F9E41");
      addRect(m02B, 28, 248, 16, 16, "#2F9E41", 8);
      addRect(m02B, 33, 253, 6, 6, "#FFFFFF", 3);
      addText(m02B, 52, 242, "Autogestão e Pontualidade (Ativa)", 13, "700", "#166534");
      addText(m02B, 52, 260, "Organização de material, cumprimento de prazos e rotina", 10, "400", "#166534");
      addBadge(m02B, 286, 246, 76, 18, "BNCC CG08", "#DCFCE7", "#166534");

      // Engajamento
      addRect(m02B, 16, 288, 358, 42, "#FFFFFF", 8, "#E5E7EB");
      addRect(m02B, 28, 300, 16, 16, "#FFFFFF", 8, "#D1D5DB");
      addText(m02B, 52, 294, "Engajamento e Comunicação", 12, "600", "#374151");
      addText(m02B, 52, 310, "Participação e postura propositiva em grupo", 10, "400", "#9CA3AF");

      // Resiliência
      addRect(m02B, 16, 336, 358, 42, "#FFFFFF", 8, "#E5E7EB");
      addRect(m02B, 28, 348, 16, 16, "#FFFFFF", 8, "#D1D5DB");
      addText(m02B, 52, 342, "Resiliência e Superação", 12, "600", "#374151");
      addText(m02B, 52, 358, "Persistência diante de erros e autorregulação", 10, "400", "#9CA3AF");

      // Toque 2: Natureza
      addText(m02B, 16, 392, "TOQUE 2: NATUREZA DA EVIDÊNCIA", 11, "700", "#6B7280");

      // Formativa (clicável -> navega para M02-A)
      const cardNatFormativaB = addRect(m02B, 16, 410, 114, 54, "#FFFFFF", 10, "#E5E7EB");
      addText(m02B, 26, 420, "Formativa", 12, "600", "#2F9E41");
      addText(m02B, 24, 438, "Comportamento positivo", 9, "400", "#6B7280");

      // Ponto de Atenção (ATIVO - Alerta)
      addRect(m02B, 138, 410, 114, 54, "#FEF2F2", 10, "#CD191E");
      addText(m02B, 144, 420, "⚠ Ponto Atenção", 12, "700", "#CD191E");
      addText(m02B, 146, 438, "Demanda Mediação", 9, "600", "#991B1B");

      // Neutra
      addRect(m02B, 260, 410, 114, 54, "#FFFFFF", 10, "#E5E7EB");
      addText(m02B, 286, 420, "Neutra", 12, "600", "#374151");
      addText(m02B, 270, 438, "Fato contextual", 9, "400", "#6B7280");

      // Toque 3: Evidências Objetivas de Autogestão
      addText(m02B, 16, 480, "TOQUE 3: EVIDÊNCIA OBSERVÁVEL (CHIPS MÚLTIPLOS)", 11, "700", "#6B7280");

      addRect(m02B, 16, 500, 190, 32, "#2F9E41", 8);
      addText(m02B, 26, 508, "✓ Pontualidade nas entregas", 11, "700", "#FFFFFF");

      addRect(m02B, 214, 500, 160, 32, "#2F9E41", 8);
      addText(m02B, 224, 508, "✓ Organização de material", 11, "700", "#FFFFFF");

      addRect(m02B, 16, 540, 170, 32, "#FFFFFF", 8, "#D1D5DB");
      addText(m02B, 26, 548, "Cumprimento de combinados", 11, "600", "#374151");

      addRect(m02B, 194, 540, 120, 32, "#FFFFFF", 8, "#D1D5DB");
      addText(m02B, 204, 548, "Foco nas tarefas", 11, "600", "#374151");

      addRect(m02B, 16, 580, 160, 32, "#FFFFFF", 8, "#D1D5DB");
      addText(m02B, 26, 588, "Planejamento de rotina", 11, "600", "#374151");

      const btnSalvarB = addRect(m02B, 16, 636, 358, 48, "#2F9E41", 10);
      addText(m02B, 90, 650, "✓ SALVAR REGISTRO IMEDIATO", 13, "700", "#FFFFFF");
      addText(m02B, 70, 696, "+ Anotação confidencial / foto caderno", 11, "600", "#6B7280");

      const navM02BTabs = buildBottomNav(m02B, 1);

      // ==========================================
      // [M03] Prof - Radar e Devolutiva
      // ==========================================
      let m03 = root.children.find(b => b.type === 'board' && b.name && b.name.includes('[M03]'));
      if (!m03) {
        m03 = penpot.createBoard();
        m03.name = "[M03] Prof - Radar e Devolutiva";
        m03.resize(390, 844);
      } else {
        const ch = [...m03.children];
        ch.forEach(c => c.remove());
      }
      m03.x = 1320;
      m03.y = 0;
      m03.fills = [{ fillColor: "#F9FAFB", fillOpacity: 1 }];
      buildStatusBar(m03);

      // Header M03
      addRect(m03, 0, 36, 390, 56, "#FFFFFF", 0, "#E5E7EB");
      const backBtnM03 = addRect(m03, 14, 46, 32, 32, "#FFFFFF", 6, "#D1D5DB");
      addText(m03, 24, 52, "←", 14, "700", "#374151");
      addText(m03, 56, 46, "Prontuário Atitudinal", 14, "700", "#111827");
      addText(m03, 56, 66, "Visão do Professor • 9º Ano B", 11, "400", "#6B7280");
      addBadge(m03, 296, 50, 78, 22, "Autoavaliação", "#F0FDF4", "#166534");

      // Card Aluno Lucas
      addRect(m03, 16, 102, 358, 64, "#FFFFFF", 10, "#E5E7EB");
      addRect(m03, 16, 102, 5, 64, "#2F9E41", 3);
      addRect(m03, 28, 112, 44, 44, "#DCFCE7", 22);
      addText(m03, 40, 124, "LM", 14, "700", "#166534");
      addText(m03, 82, 114, "Lucas Mendes Silva", 14, "700", "#111827");
      addText(m03, 82, 134, "9º Ano B • Matrícula 2024.1.09B.01", 11, "400", "#6B7280");
      addBadge(m03, 290, 114, 72, 20, "8.8 Geral", "#DCFCE7", "#166534");

      // Radar e Barras de Dimensão
      addRect(m03, 16, 178, 358, 196, "#FFFFFF", 12, "#E5E7EB");
      addText(m03, 28, 190, "Equilíbrio Socioemocional (Radar)", 12, "700", "#111827");

      // Circulo do radar
      const radarCircle = penpot.createEllipse();
      radarCircle.resize(90, 90);
      radarCircle.x = m03.x + 36;
      radarCircle.y = m03.y + 220;
      radarCircle.fills = [{ fillColor: "#F0FDF4", fillOpacity: 1 }];
      radarCircle.strokes = [{ strokeColor: "#86EFAC", strokeOpacity: 1, strokeWidth: 1.5 }];
      m03.appendChild(radarCircle);
      addText(m03, 72, 256, "8.8", 16, "700", "#166534", "center");

      // Barras
      const barStartY = 216;
      const dims = [
        { name: "Cooperação", score: "9.2", fillW: 130 },
        { name: "Autogestão", score: "8.4", fillW: 118 },
        { name: "Engajamento", score: "9.0", fillW: 126 },
        { name: "Resiliência", score: "8.6", fillW: 120 }
      ];

      dims.forEach((d, i) => {
        const yPos = barStartY + (i * 34);
        addText(m03, 142, yPos, d.name, 11, "600", "#374151");
        addText(m03, 330, yPos, d.score, 11, "700", "#166534");
        addRect(m03, 142, yPos + 16, 210, 6, "#E5E7EB", 3);
        addRect(m03, 142, yPos + 16, d.fillW, 6, "#2F9E41", 3);
      });

      // Histórico de Observações Recentes
      addText(m03, 16, 388, "HISTÓRICO DE EVIDÊNCIAS RECENTES", 11, "700", "#6B7280");

      addRect(m03, 16, 408, 358, 80, "#FFFFFF", 10, "#E5E7EB");
      addBadge(m03, 28, 418, 80, 20, "Cooperação", "#DCFCE7", "#166534");
      addText(m03, 270, 420, "Hoje, 08:30", 11, "400", "#9CA3AF");
      addText(m03, 28, 444, "Apoio ativo aos colegas no trabalho de campo de Geografia.", 12, "600", "#111827");
      addText(m03, 28, 464, "Registrado por: Profª. Luciana Rocha (Geografia)", 10, "400", "#6B7280");

      addRect(m03, 16, 498, 358, 80, "#FFFFFF", 10, "#E5E7EB");
      addBadge(m03, 28, 508, 76, 20, "Autogestão", "#DCFCE7", "#166534");
      addText(m03, 270, 510, "24/10/2026", 11, "400", "#9CA3AF");
      addText(m03, 28, 534, "Entrega antecipada do relatório em grupo com síntese.", 12, "600", "#111827");
      addText(m03, 28, 554, "Registrado por: Prof. Marcos Prado (História)", 10, "400", "#6B7280");

      addRect(m03, 16, 588, 358, 80, "#FFFFFF", 10, "#E5E7EB");
      addBadge(m03, 28, 598, 80, 20, "Engajamento", "#EFF6FF", "#1D4ED8");
      addText(m03, 270, 600, "20/10/2026", 11, "400", "#9CA3AF");
      addText(m03, 28, 624, "Participação espontânea e assertiva nos debates matinais.", 12, "600", "#111827");
      addText(m03, 28, 644, "Registrado por: Prof. Carlos Mendes (Matemática)", 10, "400", "#6B7280");

      const navM03Tabs = buildBottomNav(m03, 2);

      // ==========================================
      // Interações Nativas com addInteraction
      // ==========================================
      // M01 -> M02-A, M02-B, M03
      btnRegLucas.addInteraction("click", { type: "navigate-to", destination: m02A });
      cardLucas.addInteraction("click", { type: "navigate-to", destination: m02A });
      btnRadarLucas.addInteraction("click", { type: "navigate-to", destination: m03 });

      btnRegBeatriz.addInteraction("click", { type: "navigate-to", destination: m02B });
      cardBeatriz.addInteraction("click", { type: "navigate-to", destination: m02B });
      btnRadarBeatriz.addInteraction("click", { type: "navigate-to", destination: m03 });

      if (navM01Tabs[1]) navM01Tabs[1].addInteraction("click", { type: "navigate-to", destination: m02A });
      if (navM01Tabs[2]) navM01Tabs[2].addInteraction("click", { type: "navigate-to", destination: m03 });

      // M02-A -> M02-B, M03, M01
      backBtnA.addInteraction("click", { type: "navigate-to", destination: m01 });
      cardDimAutoA.addInteraction("click", { type: "navigate-to", destination: m02B });
      cardNatAtencaoA.addInteraction("click", { type: "navigate-to", destination: m02B });
      btnSalvarA.addInteraction("click", { type: "navigate-to", destination: m03 });
      if (navM02ATabs[0]) navM02ATabs[0].addInteraction("click", { type: "navigate-to", destination: m01 });
      if (navM02ATabs[2]) navM02ATabs[2].addInteraction("click", { type: "navigate-to", destination: m03 });

      // M02-B -> M02-A, M03, M01
      backBtnB.addInteraction("click", { type: "navigate-to", destination: m01 });
      cardDimCoopB.addInteraction("click", { type: "navigate-to", destination: m02A });
      cardNatFormativaB.addInteraction("click", { type: "navigate-to", destination: m02A });
      btnSalvarB.addInteraction("click", { type: "navigate-to", destination: m03 });
      if (navM02BTabs[0]) navM02BTabs[0].addInteraction("click", { type: "navigate-to", destination: m01 });
      if (navM02BTabs[2]) navM02BTabs[2].addInteraction("click", { type: "navigate-to", destination: m03 });

      // M03 -> M01, M02-A
      backBtnM03.addInteraction("click", { type: "navigate-to", destination: m01 });
      if (navM03Tabs[0]) navM03Tabs[0].addInteraction("click", { type: "navigate-to", destination: m01 });
      if (navM03Tabs[1]) navM03Tabs[1].addInteraction("click", { type: "navigate-to", destination: m02A });

      return {
        page: targetPage.name,
        boards: [m01.name, m02A.name, m02B.name, m03.name]
      };
    }

    // Executa na página atual ativa (penpot.currentPage)
    const result = syncMobileBoardsOnPage(penpot.currentPage);

    return {
      status: "success",
      page: penpot.currentPage.name,
      result
    };
  `;

  const result = await executePenpotCode(penpotScript);
  console.log("Resultado da sincronização no Penpot:", JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error("Erro ao sincronizar com Penpot:", err);
  process.exit(1);
});
