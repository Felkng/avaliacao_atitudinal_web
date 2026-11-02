/**
 * IFNMG • AvaliaAtitude - Lógica Interativa do Painel Desktop de Gestão & Coordenação
 * Cobre 100% dos fluxos de Alerta Precoce (MTSS), Clima Escolar Finlandês,
 * Prontuário Holístico com alternância instantânea entre Lucas Mendes e Beatriz Santos,
 * e Central de Mediação com SLA 48h.
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
      status: 'Consistente (Em Mediação SLA)',
      badgeClass: 'badge badge-green',
      radar: { cooperacao: 9.2, autogestao: 8.4, engajamento: 9.0, resiliencia: 8.6, acolhimento: 9.1 },
      historico: [
        { dim: 'Cooperação', data: 'Hoje, 08:30', prof: 'Profª. Luciana Rocha (Geografia)', obs: 'Apoio ativo aos colegas no trabalho de campo de Geografia física.', alert: false },
        { dim: 'Autogestão', data: '24/10/2026', prof: 'Prof. Marcos Prado (História)', obs: 'Entrega antecipada do relatório em grupo com síntese organizada.', alert: false },
        { dim: 'Atenção / Saúde', data: '22/10/2026', prof: 'Profª. Camila Diniz (Matemática)', obs: 'Apresentou sonolência leve no 1º horário devido a anti-histamínico (protocolo #CONT-2026-89 acolhido).', alert: true }
      ]
    },
    'Beatriz Santos Oliveira': {
      matricula: '2024.1.09B.02',
      turma: '9º Ano B',
      iniciais: 'BS',
      geral: '8.1',
      frequencia: '91%',
      tarefas: '88%',
      status: 'Apoio Focal (Nível 2 MTSS)',
      badgeClass: 'badge badge-neutral',
      radar: { cooperacao: 8.5, autogestao: 6.8, engajamento: 8.2, resiliencia: 8.0, acolhimento: 8.9 },
      historico: [
        { dim: 'Autogestão', data: '23/10/2026', prof: 'Profª. Luciana Rocha (Geografia)', obs: 'Esqueceu o material pedagógico pela segunda vez consecutiva na aula de cartografia.', alert: true },
        { dim: 'Prazos & Tarefas', data: '21/10/2026', prof: 'Prof. Marcos Prado (História)', obs: 'Entrega da síntese histórica com 2 dias de atraso; necessita alinhamento de cronograma.', alert: true },
        { dim: 'Cooperação', data: '19/10/2026', prof: 'Prof. Marcos Prado (História)', obs: 'Excelente acolhimento e facilitação de diálogo com colegas no debate temático em sala.', alert: false }
      ]
    },
    'Gabriel Costa Souza': {
      matricula: '2024.1.09B.03',
      turma: '9º Ano B',
      iniciais: 'GC',
      geral: '6.4',
      frequencia: '81%',
      tarefas: '72%',
      status: 'Intervenção Intensiva (Nível 3)',
      badgeClass: 'badge badge-alert',
      radar: { cooperacao: 6.8, autogestao: 5.5, engajamento: 6.2, resiliencia: 6.9, acolhimento: 7.0 },
      historico: [
        { dim: 'Engajamento', data: 'Ontem, 10:15', prof: 'Profª. Camila Diniz (Matemática)', obs: 'Dificuldade de concentração persistente e desengajamento nas atividades individuais.', alert: true },
        { dim: 'Frequência', data: '21/10/2026', prof: 'Coordenação Pedagógica', obs: '3 faltas consecutivas sem justificativa formal. Contato telefônico com responsável agendado.', alert: true }
      ]
    },
    'Julia Almeida Lima': {
      matricula: '2024.1.09B.04',
      turma: '9º Ano B',
      iniciais: 'JA',
      geral: '9.3',
      frequencia: '98%',
      tarefas: '97%',
      status: 'Universal (Nível 1 MTSS)',
      badgeClass: 'badge badge-green',
      radar: { cooperacao: 9.5, autogestao: 9.2, engajamento: 9.4, resiliencia: 9.0, acolhimento: 9.6 },
      historico: [
        { dim: 'Resiliência', data: '23/10/2026', prof: 'Prof. Marcos Prado (História)', obs: 'Excelente postura colaborativa ao refazer trabalho prático com grupo e orientar pares.', alert: false }
      ]
    }
  }
};

// Navegação entre Módulos Principais (Sidebar e Botões)
function switchView(viewId, element) {
  document.querySelectorAll('.content-area').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
  }

  // Sincroniza item da sidebar
  if (element && element.classList.contains('nav-item')) {
    element.classList.add('active');
  } else {
    document.querySelectorAll('.nav-list .nav-item').forEach(item => {
      const oc = item.getAttribute('onclick') || '';
      if (oc.includes(viewId)) item.classList.add('active');
    });
  }

  // Atualiza indicador da topbar
  const topbarTitle = document.getElementById('topbarCurrentModule');
  if (topbarTitle) {
    const titles = {
      'd01': 'Alerta Precoce (MTSS)',
      'd02': 'Clima Escolar Finlandês',
      'd03': 'Prontuário do Aluno',
      'd04': 'Mediação & Contestações'
    };
    topbarTitle.textContent = titles[viewId] || 'Gestão Pedagógica';
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
  
  // Atualiza seletor dropdown
  const select = document.getElementById('prontuarioStudentSelect');
  if (select) select.value = studentName;

  // Atualiza pílulas de alternância rápida
  const pillLucas = document.getElementById('btnToggleLucas');
  const pillBeatriz = document.getElementById('btnToggleBeatriz');
  if (pillLucas && pillBeatriz) {
    if (studentName === 'Lucas Mendes Silva') {
      pillLucas.classList.add('active');
      pillBeatriz.classList.remove('active');
    } else if (studentName === 'Beatriz Santos Oliveira') {
      pillBeatriz.classList.add('active');
      pillLucas.classList.remove('active');
    } else {
      pillLucas.classList.remove('active');
      pillBeatriz.classList.remove('active');
    }
  }

  // Atualiza cabeçalho do aluno
  const nameEl = document.getElementById('pStudentName');
  if (nameEl) nameEl.textContent = studentName;
  const matEl = document.getElementById('pStudentMat');
  if (matEl) matEl.textContent = `Matrícula: ${data.matricula} • ${data.turma}`;
  const avatarEl = document.getElementById('pStudentAvatar');
  if (avatarEl) {
    avatarEl.textContent = data.iniciais;
    avatarEl.style.background = studentName.includes('Beatriz') ? '#FEF3C7' : '#DCFCE7';
    avatarEl.style.color = studentName.includes('Beatriz') ? '#B45309' : '#166534';
  }
  const statusEl = document.getElementById('pStudentStatus');
  if (statusEl) {
    statusEl.textContent = data.status;
    statusEl.className = data.badgeClass || 'badge badge-green';
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
  updateDimensionBar('barAcolh', 'valAcolh', data.radar.acolhimento);

  // Atualiza Gráfico de Radar SVG
  renderRadarSVG(data.radar);

  // Atualiza botão de prescrição no cabeçalho da timeline
  const btnPresc = document.getElementById('btnTimelinePrescrever');
  if (btnPresc) {
    btnPresc.onclick = () => openInterventionFor(studentName, data.turma);
  }

  // Atualiza timeline de observações
  const timelineEl = document.getElementById('pStudentTimeline');
  if (timelineEl) {
    timelineEl.innerHTML = data.historico.map(h => `
      <div style="background:var(--gray-50); border:1px solid var(--gray-200); border-radius:6px; padding:10px 12px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span class="badge ${h.alert ? 'badge-alert' : 'badge-green'}">${h.dim}</span>
          <span style="font-size:11px; color:var(--gray-500);">${h.data}</span>
        </div>
        <p style="font-size:12px; color:var(--gray-800); font-weight:600; margin-bottom:2px;">${h.obs}</p>
        <span style="font-size:11px; color:var(--gray-500);">${h.prof}</span>
      </div>
    `).join('');
  }

  showToast(`Prontuário carregado: ${studentName}`, 'info');
}

function updateDimensionBar(barId, valId, value) {
  const bar = document.getElementById(barId);
  const val = document.getElementById(valId);
  if (bar) bar.style.width = (value * 10) + '%';
  if (val) val.textContent = value.toFixed(1);
}

// Renderização Dinâmica do Gráfico de Radar em SVG
function renderRadarSVG(radar) {
  const svg = document.getElementById('radarSvg');
  if (!svg) return;

  const cx = 100;
  const cy = 100;
  const rMax = 75;

  // 5 Dimensões distribuídas em 72° (360 / 5)
  // 1: Cooperação (Top / -90°)
  // 2: Autogestão (Right-Top / -18°)
  // 3: Engajamento (Right-Bottom / 54°)
  // 4: Resiliência (Left-Bottom / 126°)
  // 5: Acolhimento (Left-Top / 198°)
  const angles = [-90, -18, 54, 126, 198].map(a => (a * Math.PI) / 180);
  const values = [
    radar.cooperacao / 10,
    radar.autogestao / 10,
    radar.engajamento / 10,
    radar.resiliencia / 10,
    (radar.acolhimento || 9.0) / 10
  ];

  const points = angles.map((ang, i) => {
    const r = values[i] * rMax;
    const x = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const polygon = document.getElementById('radarPolygon');
  if (polygon) {
    polygon.setAttribute('points', points);
  }

  // Atualiza pontos nos vértices
  angles.forEach((ang, i) => {
    const dot = document.getElementById(`radarDot${i}`);
    if (dot) {
      const r = values[i] * rMax;
      dot.setAttribute('cx', (cx + r * Math.cos(ang)).toFixed(1));
      dot.setAttribute('cy', (cy + r * Math.sin(ang)).toFixed(1));
    }
  });
}

// Filtros do Alerta Precoce (MTSS)
function filterByLevel(level, btn) {
  const rows = document.querySelectorAll('#alertTable tbody tr');
  let visibleCount = 0;

  rows.forEach(r => {
    if (level === 'all' || r.getAttribute('data-tier') === level) {
      r.style.display = '';
      visibleCount++;
    } else {
      r.style.display = 'none';
    }
  });

  const buttons = document.querySelectorAll('.mtss-filter-btn');
  buttons.forEach(b => {
    b.classList.remove('btn-primary', 'active');
  });
  if (btn) {
    btn.classList.add('btn-primary', 'active');
  }

  const levelNames = {
    'all': 'Todos os Níveis',
    'tier3': 'Nível 3 (Intensivo)',
    'tier2': 'Nível 2 (Apoio Focal)',
    'tier1': 'Nível 1 (Universal)'
  };
  showToast(`Filtro MTSS: ${levelNames[level] || level} (${visibleCount} exibidos)`, 'info');
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
  showToast(`Filtro por turma: ${turma === 'all' ? 'Todas as Turmas' : turma}`, 'info');
}

function filterTable() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const rows = document.querySelectorAll('#alertTable tbody tr');
  rows.forEach(r => {
    const text = r.innerText.toLowerCase();
    r.style.display = text.includes(query) ? '' : 'none';
  });
}

// Interação no Heatmap Finlandês (D02)
function selectHeatmapCell(element, turma, dimensao, score, nivel) {
  // Remove classe de seleção de todas as células e destaca a clicada
  document.querySelectorAll('.heatmap-cell').forEach(cell => cell.classList.remove('selected'));
  if (element) {
    element.classList.add('selected');
  }

  const title = document.getElementById('heatmapSelectedTitle');
  const desc = document.getElementById('heatmapSelectedDesc');
  const actionBtn = document.getElementById('heatmapActionBtn');

  if (title) {
    title.textContent = `${turma} • ${dimensao} (Índice: ${score}/10)`;
  }

  if (desc) {
    if (nivel === 'alerta') {
      desc.textContent = `Ponto Crítico Identificado: Mais de 35% dos estudantes relataram sobrecarga ou dificuldade em ${dimensao}. Intervenção focal requerida: Oficina do NAPNE de organização de estudos e ajuste de calendário avaliativo com o colegiado.`;
    } else if (nivel === 'atencao') {
      desc.textContent = `Atenção Pedagógica: Esta turma apresentou queda nos índices de ${dimensao} nas últimas duas semanas. Recomendada roda de conversa formativa e acompanhamento pelo professor tutor.`;
    } else {
      desc.textContent = `Clima Positivo & Consistente: A turma mantém níveis elevados de ${dimensao} (${score}/10), servindo de referência positiva para projetos de tutoria e cooperação entre pares.`;
    }
  }

  if (actionBtn) {
    actionBtn.textContent = `Criar Plano de Ação para ${turma}`;
    actionBtn.onclick = () => triggerActionPlan(turma, dimensao);
  }

  showToast(`Célula selecionada: ${turma} • ${dimensao} (${score}/10)`, 'info');
}

function triggerActionPlan(turma, dimensao) {
  showToast(`Plano de ação institucional estruturado com sucesso para ${turma} (${dimensao || 'Clima Escolar'})!`, 'success');
}

// Gerenciamento de Modais
function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Fechamento de modal ao clicar fora ou pressionar ESC
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

function openInterventionFor(studentName, turma) {
  const input = document.getElementById('intervStudentInput');
  if (input) input.value = `${studentName} (${turma || '9º Ano B'})`;
  openModal('modalIntervencao');
}

function saveIntervention() {
  const student = document.getElementById('intervStudentInput')?.value || 'Estudante';
  const actionType = document.getElementById('intervTypeSelect')?.value || 'Tutoria Formativa entre Pares';
  
  // Se o estudante atual no prontuário for o alvo, adiciona à timeline
  const studentKey = student.split(' (')[0];
  if (DesktopDatabase.students[studentKey]) {
    DesktopDatabase.students[studentKey].historico.unshift({
      dim: 'Intervenção MTSS',
      data: 'Hoje, recém-registrado',
      prof: 'Coordenação Pedagógica',
      obs: `Ação prescrita: ${actionType}. Reavaliação em 15 dias.`,
      alert: false
    });
    // Se o prontuário estiver visível com este aluno, recarrega
    const currentSelected = document.getElementById('prontuarioStudentSelect')?.value;
    if (currentSelected === studentKey) {
      loadStudentData(studentKey);
    }
  }

  closeModal('modalIntervencao');
  showToast(`Intervenção MTSS registrada para ${student}! Colegiado e NAPNE notificados.`, 'success');
}

function resolveMediation() {
  closeModal('modalResolucao');

  // Atualiza badge de Lucas no Alerta Precoce
  const lucasRow = document.querySelector('tr[data-tier="tier2"]');
  if (lucasRow) {
    const badgeStatus = lucasRow.querySelector('.badge-status');
    if (badgeStatus) {
      badgeStatus.className = 'badge-status badge-green';
      badgeStatus.textContent = 'Homologado (Concluído)';
    }
  }

  // Atualiza status na Central de Mediação
  const medHeader = document.querySelector('#d04 .panel-card .panel-header h3');
  if (medHeader) {
    medHeader.innerHTML = 'Contestação / Justificativa Médica: Lucas Mendes Silva <span class="badge badge-green" style="margin-left: 8px;">Parecer Homologado</span>';
  }

  showToast('Parecer devolutivo homologado com sucesso! Família notificada via app e registro retificado.', 'success');
}

function printReportPreview() {
  showToast('Gerando visualização da Síntese Formativa para Impressão / PDF...', 'info');
  setTimeout(() => {
    window.print();
  }, 400);
}

// Sistema de Notificações Toast Flutuante
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  
  toast.innerHTML = `<span style="font-weight:600;">${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3200);
}

// Inicialização da Página ao Carregar
document.addEventListener('DOMContentLoaded', () => {
  // Carrega prontuário inicial com Lucas Mendes Silva
  loadStudentData('Lucas Mendes Silva');

  // Garante que a primeira célula crítica do 9º Ano B no heatmap esteja selecionada por padrão
  const defaultCell = document.querySelector('.heatmap-table tr:nth-child(2) td:nth-child(3) .heatmap-cell');
  if (defaultCell) {
    defaultCell.classList.add('selected');
  }
});
