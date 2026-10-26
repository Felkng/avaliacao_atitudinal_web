/**
 * Lógica Interativa do Protótipo Mobile (IFNMG AvaliaAtitude)
 * Cobre 100% dos fluxos de Professor, Estudante e Responsáveis.
 */

// Estado da Aplicação Mobile
const MobileState = {
  currentProfile: 'professor',
  selectedClass: '9º Ano B - Ensino Fundamental',
  selectedStudent: 'Lucas Mendes Silva',
  selectedDimension: 'Cooperação e Empatia',
  selectedNature: 'formativa',
  selectedChips: new Set(['Apoio aos colegas']),
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

  if (['m01', 'm02'].includes(screenId)) {
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
    showToast('Perfil alterado: Estudante Lucas Mendes');
  } else if (profile === 'responsavel') {
    switchScreen('m07');
    showToast('Perfil alterado: Responsável (Srª. Silva)');
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
function startQuickRecord(studentName, matricula) {
  MobileState.selectedStudent = studentName;
  const nameEl = document.getElementById('quickRecordStudentName');
  if (nameEl) nameEl.textContent = studentName;
  const matEl = document.getElementById('quickRecordStudentMat');
  if (matEl) matEl.textContent = matricula || '2024.1.09B';
  switchScreen('m03');
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
function selectNature(card, type) {
  document.querySelectorAll('.nature-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  MobileState.selectedNature = type;
}

function toggleEvidenceChip(chip) {
  chip.classList.toggle('selected');
  const text = chip.textContent.trim();
  if (MobileState.selectedChips.has(text)) {
    MobileState.selectedChips.delete(text);
  } else {
    MobileState.selectedChips.add(text);
  }
}

function submitQuickRecord() {
  const student = MobileState.selectedStudent;
  showToast(`Registro salvo com sucesso para ${student}! Protocolo #9102 gerado.`);
  setTimeout(() => {
    switchScreen('m04');
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
