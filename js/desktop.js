/**
 * Lógica Interativa do Painel Desktop de Gestão e Coordenação (IFNMG AvaliaAtitude)
 */

function switchView(viewId, element) {
  document.querySelectorAll('.content-area').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');
  if (element) element.classList.add('active');
}

function openStudentProntuario(studentName) {
  switchView('d03', document.querySelectorAll('.nav-item')[2]);
}

function filterByLevel(level) {
  const rows = document.querySelectorAll('#alertTable tbody tr');
  rows.forEach(r => {
    if (level === 'all' || r.getAttribute('data-tier') === level) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });

  const buttons = document.querySelectorAll('.panel-header .btn-sm');
  buttons.forEach(btn => btn.classList.remove('btn-primary'));
}

function filterTable() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#alertTable tbody tr');
  rows.forEach(r => {
    const text = r.innerText.toLowerCase();
    r.style.display = text.includes(query) ? '' : 'none';
  });
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

function saveIntervention() {
  alert('Intervenção pedagógica registrada com sucesso! Notificação enviada aos docentes do 9º Ano B.');
  closeModal('modalIntervencao');
}

function resolveMediation() {
  alert('Parecer homologado! O registro no prontuário de Lucas Mendes Silva foi atualizado e a família foi notificada via app.');
  closeModal('modalResolucao');
  switchView('d01', document.querySelectorAll('.nav-item')[0]);
}

function showActionToast(turma) {
  alert('Plano de ação institucional para o ' + turma + ' aberto para consulta da equipe multidisciplinar.');
}
