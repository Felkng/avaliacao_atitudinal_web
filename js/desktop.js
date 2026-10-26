/**
 * Lógica Interativa do Painel Desktop de Gestão e Coordenação (IFNMG AvaliaAtitude)
 * Cobre 100% dos fluxos analíticos, MTSS, Clima Escolar e Mediação de Contestações.
 */

// Banco de Dados Simulado de Estudantes para o Prontuário
const DesktopDatabase = {
  students: {
    'Lucas Mendes Silva': {
      matricula: '2024.1.09B.01',
      turma: '9º Ano B',
      iniciais: 'LM',
      geral: '8.8',
      frequencia: '96%',
      tarefas: '94%',
      status: 'Consistente',
      radar: { cooperacao: 9.2, autogestao: 8.4, engajamento: 9.0, resiliencia: 8.6, empatia: 9.1 },
      historico: [
        { dim: 'Cooperação', data: 'Hoje, 08:30', prof: 'Profª. Luciana Rocha (Geografia)', obs: 'Apoio ativo aos colegas no trabalho de campo de Geografia física.' },
        { dim: 'Autogestão', data: '24/10/2026', prof: 'Prof. Marcos Prado (História)', obs: 'Entrega antecipada do relatório em grupo com síntese organizada.' },
        { dim: 'Atenção/Saúde', data: '22/10/2026', prof: 'Profª. Camila Diniz (Matemática)', obs: 'Apresentou sonolência leve no primeiro horário (justificativa acolhida).' }
      ]
    },
    'Beatriz Santos Oliveira': {
      matricula: '2024.1.09B.02',
      turma: '9º Ano B',
      iniciais: 'BS',
      geral: '8.1',
      frequencia: '91%',
      tarefas: '88%',
      status: 'Apoio Focal (Tier 2)',
      radar: { cooperacao: 8.5, autogestao: 6.8, engajamento: 8.2, resiliencia: 8.0, empatia: 8.9 },
      historico: [
        { dim: 'Autogestão', data: '23/10/2026', prof: 'Profª. Luciana Rocha (Geografia)', obs: 'Esqueceu o material pedagógico pela segunda vez consecutiva.' },
        { dim: 'Cooperação', data: '19/10/2026', prof: 'Prof. Marcos Prado (História)', obs: 'Excelente acolhimento e mediação com colegas no debate em sala.' }
      ]
    },
    'Gabriel Costa Souza': {
      matricula: '2024.1.09B.03',
      turma: '9º Ano B',
      iniciais: 'GC',
      geral: '6.4',
      frequencia: '81%',
      tarefas: '72%',
      status: 'Intervenção Intensiva (Tier 3)',
      radar: { cooperacao: 6.8, autogestao: 5.5, engajamento: 6.2, resiliencia: 6.9, empatia: 7.0 },
      historico: [
        { dim: 'Engajamento', data: 'Ontem, 10:15', prof: 'Profª. Camila Diniz (Matemática)', obs: 'Dificuldade de concentração e desengajamento nas tarefas individuais.' },
        { dim: 'Pontualidade', data: '21/10/2026', prof: 'Coordenação Pedagógica', obs: 'Atraso de 25 minutos após o intervalo escolar.' }
      ]
    },
    'Julia Almeida Lima': {
      matricula: '2024.1.09B.04',
      turma: '9º Ano B',
      iniciais: 'JA',
      geral: '9.3',
      frequencia: '98%',
      tarefas: '97%',
      status: 'Universal (Tier 1)',
      radar: { cooperacao: 9.5, autogestao: 9.2, engajamento: 9.4, resiliencia: 9.0, empatia: 9.6 },
      historico: [
        { dim: 'Resiliência', data: '23/10/2026', prof: 'Prof. Marcos Prado (História)', obs: 'Excelente postura colaborativa ao refazer trabalho com grupo.' }
      ]
    }
  }
};

// Navegação entre Módulos Principais
function switchView(viewId, element) {
  document.querySelectorAll('.content-area').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');
  if (element) {
    element.classList.add('active');
  } else {
    // Sincroniza item da sidebar correspondente
    document.querySelectorAll('.nav-item').forEach(item => {
      const oc = item.getAttribute('onclick') || '';
      if (oc.includes(viewId)) item.classList.add('active');
    });
  }
}

// Abertura do Prontuário para um Aluno Específico
function openStudentProntuario(studentName) {
  switchView('d03');
  loadStudentData(studentName);
}

// Atualização Dinâmica do Prontuário
function loadStudentData(studentName) {
  const data = DesktopDatabase.students[studentName] || DesktopDatabase.students['Lucas Mendes Silva'];
  
  // Atualiza seletor
  const select = document.getElementById('prontuarioStudentSelect');
  if (select) select.value = studentName;

  // Atualiza cabeçalho do aluno
  const nameEl = document.getElementById('pStudentName');
  if (nameEl) nameEl.textContent = studentName;
  const matEl = document.getElementById('pStudentMat');
  if (matEl) matEl.textContent = `Matrícula: ${data.matricula} • ${data.turma}`;
  const avatarEl = document.getElementById('pStudentAvatar');
  if (avatarEl) avatarEl.textContent = data.iniciais;
  const statusEl = document.getElementById('pStudentStatus');
  if (statusEl) {
    statusEl.textContent = data.status;
    statusEl.className = data.status.includes('Tier 3') ? 'badge badge-alert' : (data.status.includes('Tier 2') ? 'badge badge-neutral' : 'badge badge-green');
  }

  // Atualiza KPIs
  const scoreEl = document.getElementById('pStudentScore');
  if (scoreEl) scoreEl.textContent = data.geral;
  const freqEl = document.getElementById('pStudentFreq');
  if (freqEl) freqEl.textContent = data.frequencia;
  const taskEl = document.getElementById('pStudentTasks');
  if (taskEl) taskEl.textContent = data.tarefas;

  // Atualiza barras de dimensão
  updateDimensionBar('barCoop', 'valCoop', data.radar.cooperacao);
  updateDimensionBar('barAuto', 'valAuto', data.radar.autogestao);
  updateDimensionBar('barEng', 'valEng', data.radar.engajamento);
  updateDimensionBar('barRes', 'valRes', data.radar.resiliencia);

  // Atualiza timeline
  const timelineEl = document.getElementById('pStudentTimeline');
  if (timelineEl) {
    timelineEl.innerHTML = data.historico.map(h => `
      <div style="background:var(--gray-50); border:1px solid var(--gray-200); border-radius:6px; padding:10px 12px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span class="badge ${h.dim.includes('Atenção') ? 'badge-alert' : 'badge-green'}">${h.dim}</span>
          <span style="font-size:11px; color:var(--gray-500);">${h.data}</span>
        </div>
        <p style="font-size:12px; color:var(--gray-800); font-weight:600; margin-bottom:2px;">${h.obs}</p>
        <span style="font-size:11px; color:var(--gray-500);">${h.prof}</span>
      </div>
    `).join('');
  }
}

function updateDimensionBar(barId, valId, value) {
  const bar = document.getElementById(barId);
  const val = document.getElementById(valId);
  if (bar) bar.style.width = (value * 10) + '%';
  if (val) val.textContent = value.toFixed(1);
}

// Filtros do Alerta Precoce (MTSS)
function filterByLevel(level, btn) {
  const rows = document.querySelectorAll('#alertTable tbody tr');
  rows.forEach(r => {
    if (level === 'all' || r.getAttribute('data-tier') === level) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });

  const buttons = document.querySelectorAll('.mtss-filter-btn');
  buttons.forEach(b => b.classList.remove('btn-primary'));
  if (btn) btn.classList.add('btn-primary');
}

function filterByClassDropdown(selectEl) {
  const turma = selectEl.value;
  const rows = document.querySelectorAll('#alertTable tbody tr');
  rows.forEach(r => {
    const rowTurma = r.getAttribute('data-turma') || '';
    if (turma === 'all' || rowTurma === turma) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
}

function filterTable() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const rows = document.querySelectorAll('#alertTable tbody tr');
  rows.forEach(r => {
    const text = r.innerText.toLowerCase();
    r.style.display = text.includes(query) ? '' : 'none';
  });
}

// Interação no Heatmap Finlandês (D02)
function selectHeatmapCell(turma, dimensao, score, nivel, status) {
  const title = document.getElementById('heatmapSelectedTitle');
  const desc = document.getElementById('heatmapSelectedDesc');
  const actionBtn = document.getElementById('heatmapActionBtn');

  if (title) title.textContent = `${turma} • ${dimensao} (Índice: ${score}/10)`;
  if (desc) {
    if (nivel === 'atencao') {
      desc.textContent = `Atenção Pedagógica: Esta turma apresentou queda de 18% nos índices de ${dimensao} nos últimos 15 dias. Recomendada oficina integradora do NAPNE.`;
    } else if (nivel === 'alerta') {
      desc.textContent = `Ponto Crítico Identificado: Mais de 35% dos estudantes relataram sobrecarga ou dificuldade de autorregulação. Intervenção focal requerida.`;
    } else {
      desc.textContent = `Clima Positivo & Consistente: A turma mantém níveis elevados de ${dimensao}, servindo de referência para projetos de tutoria entre pares.`;
    }
  }
  if (actionBtn) {
    actionBtn.textContent = `Criar Plano de Ação para ${turma}`;
    actionBtn.onclick = () => showActionToast(turma);
  }
}

// Modais
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

function openInterventionFor(studentName, turma) {
  const input = document.getElementById('intervStudentInput');
  if (input) input.value = `${studentName} (${turma || '9º Ano B'})`;
  openModal('modalIntervencao');
}

function saveIntervention() {
  const student = document.getElementById('intervStudentInput')?.value || 'Estudante';
  alert(`Intervenção pedagógica MTSS registrada para ${student}! Equipe docente e NAPNE notificados.`);
  closeModal('modalIntervencao');
}

function resolveMediation() {
  alert('Parecer devolutivo homologado com sucesso! A contestação foi acolhida e a família notificada via aplicativo.');
  closeModal('modalResolucao');
  switchView('d01');
}

function showActionToast(turma) {
  alert(`Plano de ação institucional para o ${turma} estruturado com sucesso.`);
}

function printReportPreview() {
  window.print();
}
