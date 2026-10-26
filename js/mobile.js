/**
 * Lógica Interativa do Protótipo Mobile (IFNMG AvaliaAtitude)
 */

function switchScreen(screenId, btn) {
  document.querySelectorAll('.screen-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.demo-btn').forEach(b => b.classList.remove('active'));
  
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
}

function goToScreen(screenId) {
  document.querySelectorAll('.screen-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.demo-btn').forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(screenId)) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

function selectNature(card) {
  document.querySelectorAll('.nature-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
}
