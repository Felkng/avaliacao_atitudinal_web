/**
 * Lógica Interativa do Protótipo Mobile (IFNMG AvaliaAtitude)
 * Cobre 100% dos fluxos de Professor, Estudante e Responsáveis com 2 alunos interativos.
 */

// Base de Dados dos Estudantes Interativos
const StudentsData = {
  'Lucas Mendes Silva': {
    name: 'Lucas Mendes Silva',
    matricula: '2024.1.09B.01',
    turma: '9º Ano B',
    initials: 'LM',
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    generalScore: '8.8 Geral',
    generalScoreNum: '8.8',
    scores: {
      cooperacao: 9.2,
      autogestao: 8.4,
      engajamento: 9.0,
      resiliencia: 8.6
    },
    history: [
      {
        dim: 'Cooperação',
        badge: 'badge-green',
        time: 'Hoje, 08:30',
        text: 'Apoio ativo aos colegas no trabalho de campo de Geografia.',
        teacher: 'Profª. Luciana Rocha (Geografia)'
      },
      {
        dim: 'Autogestão',
        badge: 'badge-green',
        time: '24/10/2026',
        text: 'Entrega antecipada do relatório em grupo com síntese organizada.',
        teacher: 'Prof. Marcos Prado (História)'
      }
    ]
  },
  'Beatriz Santos Oliveira': {
    name: 'Beatriz Santos Oliveira',
    matricula: '2024.1.09B.02',
    turma: '9º Ano B',
    initials: 'BS',
    avatarBg: '#EFF6FF',
    avatarColor: '#1D4ED8',
    generalScore: '9.1 Geral',
    generalScoreNum: '9.1',
    scores: {
      cooperacao: 8.8,
      autogestao: 9.5,
      engajamento: 8.9,
      resiliencia: 9.2
    },
    history: [
      {
        dim: 'Autogestão',
        badge: 'badge-green',
        time: 'Ontem, 14:15',
        text: 'Excelente organização do cronograma de estudos e liderança de tarefas.',
        teacher: 'Profª. Luciana Rocha (Geografia)'
      },
      {
        dim: 'Resiliência',
        badge: 'badge-green',
        time: '22/10/2026',
        text: 'Persistência exemplar na resolução de problemas matemáticos complexos.',
        teacher: 'Prof. Carlos Mendes (Matemática)'
      }
    ]
  }
};

// Catálogo de Evidências por Dimensão (BNCC / Projeto Institucional)
const DIMENSION_DATA = {
  cooperacao: {
    name: 'Cooperação e Empatia',
    chips: [
      'Apoio ativo aos colegas',
      'Escuta acolhedora',
      'Mediação de conflitos',
      'Postura receptiva',
      'Liderança compartilhada'
    ]
  },
  autogestao: {
    name: 'Autogestão e Pontualidade',
    chips: [
      'Pontualidade nas entregas',
      'Organização de material',
      'Cumprimento de combinados',
      'Foco nas tarefas',
      'Planejamento de rotina'
    ]
  },
  engajamento: {
    name: 'Engajamento e Comunicação',
    chips: [
      'Participação ativa em aula',
      'Curiosidade investigativa',
      'Propositividade de ideias',
      'Comunicação assertiva',
      'Entusiasmo cooperativo'
    ]
  },
  resiliencia: {
    name: 'Resiliência e Superação',
    chips: [
      'Persistência diante de erros',
      'Acolhimento de feedbacks',
      'Regulação socioemocional',
      'Adaptação a mudanças',
      'Superação de desafios'
    ]
  }
};

// Estado da Aplicação Mobile
const MobileState = {
  currentProfile: 'professor',
  selectedClass: '9º Ano B - Ensino Fundamental',
  selectedStudent: 'Lucas Mendes Silva',
  selectedDimension: 'cooperacao',
  selectedNature: 'formativa',
  selectedChips: new Set(['Apoio ativo aos colegas']),
  ratings: { q1: 3, q2: 4, q3: 3, q4: 4 }
};

// Navegação entre Telas
function switchScreen(screenId, btn) {
  document.querySelectorAll('.screen-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.demo-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }
  if (btn) {
    btn.classList.add('active');
  } else {
    // Sincroniza botão de demonstração correspondente
    document.querySelectorAll('.demo-btn').forEach(b => {
      const oc = b.getAttribute('onclick') || '';
      if (oc.includes(screenId)) b.classList.add('active');
    });
  }

  // Sincroniza abas da barra inferior
  updateBottomNav(screenId);
}

function goToScreen(screenId) {
  switchScreen(screenId);
}

// Sincronização da barra de navegação inferior
function updateBottomNav(screenId) {
  const tabs = document.querySelectorAll('.bottom-nav .nav-tab');
  tabs.forEach(t => t.classList.remove('active'));

  if (['m00', 'm01', 'm02'].includes(screenId)) {
    if (tabs[0]) tabs[0].classList.add('active');
  } else if (screenId === 'm03') {
    if (tabs[1]) tabs[1].classList.add('active');
  } else if (screenId === 'm04') {
    if (tabs[2]) tabs[2].classList.add('active');
  } else if (['m05', 'm06', 'm07', 'm08', 'm09'].includes(screenId)) {
    if (tabs[3]) tabs[3].classList.add('active');
  }
}

// M00: Alternância de Perfil
function selectProfile(profile) {
  MobileState.currentProfile = profile;
  document.querySelectorAll('.profile-card').forEach(c => c.classList.remove('active'));
  
  if (profile === 'professor') {
    switchScreen('m01');
    showToast('Perfil alterado: Professor(a) Luciana R.');
  } else if (profile === 'aluno') {
    switchScreen('m05');
    showToast(`Perfil alterado: Estudante ${MobileState.selectedStudent}`);
  } else if (profile === 'responsavel') {
    switchScreen('m07');
    showToast(`Perfil alterado: Responsável de ${MobileState.selectedStudent}`);
  }
}

// M01: Seleção de Turma
function selectTurma(turmaName) {
  MobileState.selectedClass = turmaName;
  const headerTurma = document.getElementById('currentTurmaTitle');
  if (headerTurma) headerTurma.textContent = turmaName;
  switchScreen('m02');
  showToast('Turma ' + turmaName + ' carregada');
}

// M02: Seleção de Aluno para Registro Rápido
function startQuickRecord(studentName) {
  MobileState.selectedStudent = studentName;
  const student = StudentsData[studentName] || StudentsData['Lucas Mendes Silva'];

  // Atualiza cabeçalho do formulário M03
  const avatarEl = document.getElementById('quickRecordStudentAvatar');
  if (avatarEl) {
    avatarEl.textContent = student.initials;
    avatarEl.style.background = student.avatarBg;
    avatarEl.style.color = student.avatarColor;
  }
  const nameEl = document.getElementById('quickRecordStudentName');
  if (nameEl) nameEl.textContent = student.name;
  const matEl = document.getElementById('quickRecordStudentMat');
  if (matEl) matEl.textContent = `Matrícula: ${student.matricula} • ${student.turma}`;

  // Reseta ou inicializa chips para a dimensão atual
  renderEvidenceChips(MobileState.selectedDimension);

  switchScreen('m03');
  showToast(`Registrando observação para ${student.name}`);
}

// M02 / M04: Abertura do Radar com dados específicos do aluno
function openStudentRadar(studentName) {
  MobileState.selectedStudent = studentName;
  const student = StudentsData[studentName] || StudentsData['Lucas Mendes Silva'];

  // Atualiza identificação
  const avatarEl = document.getElementById('prontuarioStudentAvatar');
  if (avatarEl) {
    avatarEl.textContent = student.initials;
    avatarEl.style.background = student.avatarBg;
    avatarEl.style.color = student.avatarColor;
  }
  const nameEl = document.getElementById('prontuarioStudentName');
  if (nameEl) nameEl.textContent = student.name;
  const matEl = document.getElementById('prontuarioStudentMat');
  if (matEl) matEl.textContent = `${student.turma} • Matrícula ${student.matricula}`;
  const badgeEl = document.getElementById('prontuarioStudentScoreBadge');
  if (badgeEl) badgeEl.textContent = student.generalScore;

  // Atualiza Radar e Barras
  const scoreCenter = document.getElementById('radarScoreCenter');
  if (scoreCenter) scoreCenter.textContent = student.generalScoreNum;

  const barCoop = document.getElementById('barFillCooperacao');
  const valCoop = document.getElementById('barValCooperacao');
  if (barCoop && valCoop) {
    valCoop.textContent = student.scores.cooperacao.toFixed(1);
    barCoop.style.width = (student.scores.cooperacao * 10) + '%';
  }

  const barAuto = document.getElementById('barFillAutogestao');
  const valAuto = document.getElementById('barValAutogestao');
  if (barAuto && valAuto) {
    valAuto.textContent = student.scores.autogestao.toFixed(1);
    barAuto.style.width = (student.scores.autogestao * 10) + '%';
  }

  const barEng = document.getElementById('barFillEngajamento');
  const valEng = document.getElementById('barValEngajamento');
  if (barEng && valEng) {
    valEng.textContent = student.scores.engajamento.toFixed(1);
    barEng.style.width = (student.scores.engajamento * 10) + '%';
  }

  const barRes = document.getElementById('barFillResiliencia');
  const valRes = document.getElementById('barValResiliencia');
  if (barRes && valRes) {
    valRes.textContent = student.scores.resiliencia.toFixed(1);
    barRes.style.width = (student.scores.resiliencia * 10) + '%';
  }

  // Atualiza histórico recente
  const historyContainer = document.getElementById('studentHistoryContainer');
  if (historyContainer && student.history) {
    historyContainer.innerHTML = student.history.map(item => `
      <div class="card" style="margin-bottom: 8px;">
        <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
          <span class="badge ${item.badge || 'badge-green'}">${item.dim}</span>
          <span style="font-size: 11px; color: var(--gray-400);">${item.time}</span>
        </div>
        <p style="font-size: 12px; color: var(--gray-800); font-weight: 600;">${item.text}</p>
        <p style="font-size: 11px; color: var(--gray-500); margin-top: 2px;">Registrado por: ${item.teacher}</p>
      </div>
    `).join('');
  }

  switchScreen('m04');
}

// M02: Filtragem de Alunos em Tempo Real
function filterMobileStudents() {
  const query = (document.getElementById('mobileSearchInput')?.value || '').toLowerCase();
  const cards = document.querySelectorAll('#studentListContainer .student-row-card');
  cards.forEach(card => {
    const name = card.getAttribute('data-name')?.toLowerCase() || '';
    const dim = card.getAttribute('data-dim')?.toLowerCase() || '';
    if (name.includes(query) || dim.includes(query)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function filterByDimensionChip(chip, dimension) {
  document.querySelectorAll('.chips-scroll .filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  
  const cards = document.querySelectorAll('#studentListContainer .student-row-card');
  cards.forEach(card => {
    if (dimension === 'all' || card.getAttribute('data-dim') === dimension) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// M03: Registro Rápido em 3 Toques
function selectDimension(dimKey, element) {
  MobileState.selectedDimension = dimKey;

  // Atualiza seleção visual dos cartões
  document.querySelectorAll('#dimensionCardsContainer .dimension-card').forEach(card => {
    card.classList.remove('selected');
    const radio = card.querySelector('input[type="radio"]');
    if (radio) radio.checked = false;
  });

  if (element) {
    element.classList.add('selected');
    const radio = element.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  }

  // Atualiza chips correspondentes à dimensão selecionada
  renderEvidenceChips(dimKey);
}

function renderEvidenceChips(dimKey) {
  const container = document.getElementById('evidenceChipsContainer');
  if (!container) return;

  const data = DIMENSION_DATA[dimKey] || DIMENSION_DATA.cooperacao;
  MobileState.selectedChips.clear();
  
  // Seleciona o primeiro chip por padrão
  if (data.chips.length > 0) {
    MobileState.selectedChips.add(data.chips[0]);
  }

  container.innerHTML = data.chips.map((chipText, index) => {
    const isSelected = index === 0;
    return `
      <div class="ev-chip ${isSelected ? 'selected' : ''}" onclick="toggleEvidenceChip(this)">
        ${isSelected ? '✓ ' : ''}${chipText}
      </div>
    `;
  }).join('');
}

function selectNature(card, type) {
  document.querySelectorAll('.nature-card').forEach(c => {
    c.classList.remove('selected', 'formativa', 'atencao', 'neutra');
  });
  card.classList.add('selected', type);
  MobileState.selectedNature = type;
}

function toggleEvidenceChip(chip) {
  chip.classList.toggle('selected');
  let text = chip.textContent.replace('✓', '').trim();

  if (chip.classList.contains('selected')) {
    MobileState.selectedChips.add(text);
    chip.innerHTML = `✓ ${text}`;
  } else {
    MobileState.selectedChips.delete(text);
    chip.innerHTML = text;
  }
}

function submitQuickRecord() {
  const studentName = MobileState.selectedStudent;
  const student = StudentsData[studentName];
  const dimObj = DIMENSION_DATA[MobileState.selectedDimension] || DIMENSION_DATA.cooperacao;
  const chipsArray = Array.from(MobileState.selectedChips);
  const chipsDesc = chipsArray.length > 0 ? chipsArray.join(', ') : 'Observação atitudinal em aula';

  // Adiciona ao histórico do aluno
  if (student && student.history) {
    const natureBadge = MobileState.selectedNature === 'formativa' 
      ? 'badge-green' 
      : (MobileState.selectedNature === 'atencao' ? 'badge-alert' : 'badge-neutral');

    student.history.unshift({
      dim: dimObj.name,
      badge: natureBadge,
      time: 'Agora mesmo',
      text: `${chipsDesc} (${MobileState.selectedNature.toUpperCase()})`,
      teacher: 'Profª. Luciana Rocha (Geografia)'
    });
  }

  showToast(`Registro salvo com sucesso para ${studentName}! Natureza: ${MobileState.selectedNature.toUpperCase()}`);
  
  setTimeout(() => {
    openStudentRadar(studentName);
  }, 700);
}

// M04: Disparo de Autoavaliação para o Estudante
function requestSelfAssessmentDocente() {
  showToast('Solicitação de Autoavaliação enviada para o aplicativo do estudante!');
}

// M06: Escala de Autoavaliação
function setRating(questionKey, val, btn) {
  MobileState.ratings[questionKey] = val;
  const parent = btn.parentElement;
  if (parent) {
    parent.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }
}

function submitSelfAssessment() {
  showToast('Autoavaliação submetida! Feedback formativo atualizado.');
  setTimeout(() => {
    switchScreen('m05');
  }, 700);
}

// M08: Abertura de Diálogo / Contestação Familiar
function submitFamilyContestation() {
  const reason = document.getElementById('dialogueReasonInput')?.value || '';
  showToast('Protocolo de Diálogo #CONT-2026-89 aberto! SLA de 48h iniciado.');
  setTimeout(() => {
    switchScreen('m09');
  }, 700);
}

// Modais Genéricos
function openMobileModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeMobileModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// Notificação Toast
let toastTimeout;
function showToast(message) {
  let toast = document.getElementById('mobileToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mobileToast';
    toast.className = 'toast-notice';
    document.querySelector('.device-frame')?.appendChild(toast);
  }
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--primary)" style="flex-shrink:0;">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
    <span>${message}</span>
  `;
  toast.classList.add('show');
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Inicialização de chips e navegação no carregamento
document.addEventListener('DOMContentLoaded', () => {
  renderEvidenceChips('cooperacao');
  updateBottomNav('m00');
});
