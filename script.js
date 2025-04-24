/* ---------- Helper ---------- */
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
let step = 0;
const STEPS = 10;
const DURATION = 15 * 60; // 15 minutes in seconds
let timeLeft = DURATION;
let timerId;

/* ---------- Init ---------- */
window.addEventListener('DOMContentLoaded', () => {
  // Intro > Step 1
  qs('#startBtn').onclick = () => {
    startTimer();
    nextStep();
  };

  // Single-question navigation
  ['1','2','3','4','5','6'].forEach(i => {
    qs(`#next${i}`).onclick = () => nextStep();
    qs(`#back${i}`).onclick = () => prevStep();
  });
  // Back from responsibility question
  qs('#back7').onclick = () => prevStep();

  // Bind responsibility slider label update (rounded to whole number)
  const slider = qs('#answer7');
  const respLabel = qs('#respLabel');
  function updateSliderFill(el) {
    const pct = el.value;
    el.style.background = `linear-gradient(to right, #6a68d5 ${pct}%, #e0e0e0 ${pct}%)`;
    // Use requestAnimationFrame for smooth tooltip updates
    requestAnimationFrame(() => {
      const thumbPosition = (pct / 100) * (el.offsetWidth - 16) + 8;
      respLabel.style.transform = `translateX(${thumbPosition}px) translateX(-50%)`;
    });
  }
  slider.oninput = () => {
    const pct = Math.round(slider.value);
    respLabel.textContent = `${pct}%`;
    updateSliderFill(slider);
  };
  // Initialize slider fill
  updateSliderFill(slider);
  
  // Update tooltip position on window resize
  window.addEventListener('resize', () => updateSliderFill(slider));

  // Submit answers on last question
  qs('#submitAnswers').onclick = () => {
    const data = {
      goal: qs('#answer1').value,
      diagnose: qs('#answer2').value,
      strategy: qs('#answer3').value,
      resources: qs('#answer4').value,
      circumstance: qs('#answer5').value,
      evaluation: qs('#answer6').value,
      responsibility: qs('#respLabel').textContent,
    };
    localStorage.setItem('sdlForm', JSON.stringify(data));
    nextStep();
    renderSDLReport(); // Render report when moving to step 8
  };

  // Summary buttons
  qs('#copyBtn').onclick = copySummary;
  qs('#editBtn').onclick = () => prevStep();
  qs('#next8').onclick = () => nextStep();

  // Restart
  qs('#restartBtn').onclick = () => {
    localStorage.removeItem('sdlForm');
    step = 0;
    updateUI();
    resetTimer();
  };

  // Load saved answers if present
  if (localStorage.getItem('sdlForm')) buildSummary();

  // Render SDL report on step 8
  if (qs('#sdlReport')) {
    renderSDLReport();
    qs('#copyReportBtn').onclick = copySDLReport;
    qs('#downloadReportBtn').onclick = downloadSDLReport;
  }
});

/* ---------- Navigation ---------- */
function nextStep() { 
  if (step < STEPS - 1) { 
    step++; 
    updateUI(); 
    // Re-render report when navigating back to step 8
    if (step === 8) {
      renderSDLReport();
    }
  } 
}
function prevStep() { if (step > 0) { step--; updateUI(); } }

function updateUI() {
  qsa('.card').forEach(c => c.classList.toggle('active', +c.dataset.step === step));
  qsa('.step').forEach(s => s.classList.toggle('active', +s.dataset.step === step));
}

/* ---------- Timer ---------- */
function startTimer() {
  timerId = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) { clearInterval(timerId); qs('#timeLeft').textContent = "00:00"; return; }
    qs('#timeLeft').textContent = formatTime(timeLeft);
  }, 1000);
}
function resetTimer() { clearInterval(timerId); timeLeft = DURATION; qs('#timeLeft').textContent = formatTime(timeLeft); timerId = null; }
const formatTime = s => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

/* ---------- Summary ---------- */
function buildSummary() {
  const data = JSON.parse(localStorage.getItem('sdlForm') || '{}');
  let html = '<div class="sdl-report">';
  if (data.goal) html += `<div class="sdl-report-section goal"><h4>Goal</h4><div class="sdl-value">${data.goal}</div></div>`;
  if (data.diagnose) html += `<div class="sdl-report-section diagnose"><h4>Diagnosing What to Learn</h4><div class="sdl-value">${data.diagnose}</div></div>`;
  if (data.strategy) html += `<div class="sdl-report-section strategy"><h4>Strategies Used</h4><div class="sdl-value">${data.strategy}</div></div>`;
  if (data.resources) {
    const resourcesArr = data.resources.split(/\n|\r/).filter(Boolean);
    html += `<div class="sdl-report-section resources"><h4>Key Resources</h4>`;
    if (resourcesArr.length > 0) {
      html += '<ul class="sdl-report-resources-list">';
      resourcesArr.forEach(r => html += `<li>${r}</li>`);
      html += '</ul>';
    } else {
      html += '<div class="sdl-value">None listed</div>';
    }
    html += '</div>';
  }
  if (data.circumstance) html += `<div class="sdl-report-section circumstance"><h4>Surprises & Adaptations</h4><div class="sdl-value">${data.circumstance}</div></div>`;
  if (data.evaluation) html += `<div class="sdl-report-section evaluation"><h4>How You Knew You Succeeded</h4><div class="sdl-value">${data.evaluation}</div></div>`;
  if (data.responsibility) html += `<div class="sdl-report-section responsibility"><h4>Responsibility Level</h4><div class="sdl-value">${data.responsibility}</div></div>`;
  html += '</div>';
  qs('#summary').innerHTML = html || 'Nothing saved yet.';
}

function copySummary() {
  const el = qs('#summary');
  navigator.clipboard.writeText(el.innerText)
    .then(() => { qs('#copyBtn').innerHTML = '<i class="fas fa-check"></i> Copied!'; })
    .catch(err => alert('Copy failed', err));
}

// SDL Report rendering for step 8
function renderSDLReport() {
  const data = JSON.parse(localStorage.getItem('sdlForm') || '{}');
  const resourcesArr = (data.resources || '').split(/\n|\r/).filter(Boolean);
  let html = `<div class="sdl-report-glass">
    <h2 class="sdl-report-title">Your Self-Directed Learning Journey</h2>
    <div class="sdl-report-section"><span class="sdl-label">Goal:</span><div class="sdl-value">${data.goal || '<em>Not provided</em>'}</div></div>
    <div class="sdl-report-section"><span class="sdl-label">Diagnosing What to Learn:</span><div class="sdl-value">${data.diagnose || '<em>Not provided</em>'}</div></div>
    <div class="sdl-report-section"><span class="sdl-label">Strategies Used:</span><div class="sdl-value">${data.strategy || '<em>Not provided</em>'}</div></div>
    <div class="sdl-report-section"><span class="sdl-label">Key Resources:</span>`;
  if (resourcesArr.length > 0) {
    html += '<ul class="sdl-report-resources-list">';
    resourcesArr.forEach(r => html += `<li>${r}</li>`);
    html += '</ul>';
  } else {
    html += '<div class="sdl-value">None listed</div>';
  }
  html += `</div>
    <div class="sdl-report-section"><span class="sdl-label">Surprises & Adaptations:</span><div class="sdl-value">${data.circumstance || '<em>Not provided</em>'}</div></div>
    <div class="sdl-report-section"><span class="sdl-label">How You Knew You Succeeded:</span><div class="sdl-value">${data.evaluation || '<em>Not provided</em>'}</div></div>
    <div class="sdl-report-section"><span class="sdl-label">Responsibility Level:</span><div class="sdl-value">${data.responsibility || '<em>Not provided</em>'}</div></div>
  </div>`;
  qs('#sdlReport').innerHTML = html;
}

function copySDLReport() {
  const el = qs('#sdlReport');
  navigator.clipboard.writeText(el.innerText)
    .then(() => { qs('#copyReportBtn').innerHTML = '<i class="fas fa-check"></i> Copied!'; })
    .catch(err => alert('Copy failed', err));
}

function downloadSDLReport() {
  const el = qs('#sdlReport');
  html2canvas(el).then(canvas => {
    const link = document.createElement('a');
    link.download = 'sdl-summary.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}
