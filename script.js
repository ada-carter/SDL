/* ---------- Helper ---------- */
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
let step = 0;
const STEPS = 10;
const DURATION = 5 * 60; // 5 minutes in seconds
let timeLeft = DURATION;
let timerId;
let isMobile = false;

// Check if device is mobile
function checkMobile() {
  isMobile = window.innerWidth <= 768 || 
             navigator.maxTouchPoints > 0 || 
             navigator.msMaxTouchPoints > 0 ||
             window.matchMedia("(pointer: coarse)").matches;
  return isMobile;
}

// Add direct button selectors at the top level
const copyReportBtn = () => document.querySelector('#copyReportBtn');
const downloadReportBtn = () => document.querySelector('#downloadReportBtn');
const editReportBtn = () => document.querySelector('#editReportBtn');
const restartFromReportBtn = () => document.querySelector('#restartFromReportBtn');

function updateSliderFill(el) {
  const pct = el.value;
  el.style.background = `linear-gradient(to right, #6a68d5 ${pct}%, #e0e0e0 ${pct}%)`;
  
  // Don't use transform for tooltip on mobile - handled by CSS instead
  if (!checkMobile()) {
    // Use requestAnimationFrame for smooth tooltip updates
    requestAnimationFrame(() => {
      const thumbPosition = (pct / 100) * (el.offsetWidth - 16) + 8;
      qs('#respLabel').style.transform = `translateX(${thumbPosition}px) translateX(-50%)`;
    });
  }
}

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
      resources: window.resourceManager ? window.resourceManager.resources : [],
      circumstance: qs('#answer5').value,
      evaluation: qs('#answer6').value,
      responsibility: qs('#respLabel').textContent,
    };
    localStorage.setItem('sdlForm', JSON.stringify(data));
    nextStep();
    renderSDLReport(); // Render report when moving to step 8
  };

  // Bind summary navigation buttons if present
  const copyBtn = qs('#copyBtn');
  if (copyBtn) copyBtn.onclick = copySummary;
  const editBtn = qs('#editBtn');
  if (editBtn) editBtn.onclick = () => prevStep();
  const next8Btn = qs('#next8');
  if (next8Btn) next8Btn.onclick = () => nextStep();

  // Restart
  qs('#restartBtn').onclick = () => {
    localStorage.removeItem('sdlForm');
    step = 0;
    updateUI();
    resetTimer();
  };
  
  // Back to Report button on final step
  const backToReportBtn = qs('#backToReportBtn');
  if (backToReportBtn) backToReportBtn.onclick = () => {
    step = 8; // Go back to the report step
    updateUI();
  };

  // Bind report buttons directly
  // Copy Report button
  const copyReportButton = copyReportBtn();
  if (copyReportButton) {
    copyReportButton.addEventListener('click', copySDLReport);
  }
  
  // Download Report button
  const downloadReportButton = downloadReportBtn();
  if (downloadReportButton) {
    downloadReportButton.addEventListener('click', downloadSDLReport);
  }
  
  // Back from Report button
  const backFromReportBtn = qs('#backFromReportBtn');
  if (backFromReportBtn) {
    backFromReportBtn.addEventListener('click', () => {
      step = 7; // Go back to previous question (responsibility slider)
      updateUI();
    });
  }

  // Load saved answers if present
  // if (localStorage.getItem('sdlForm')) buildSummary(); // disabled to avoid errors
  
  // Render SDL report on step 8
  if (qs('#sdlReport')) {
    renderSDLReport();
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
  let html = `<div class="sdl-report-glass">
    <h2 class="sdl-report-title">Your Self-Directed Learning Journey</h2>
    <div class="sdl-report-section"><span class="sdl-label">Goal:</span><div class="sdl-value">${data.goal || '<em>Not provided</em>'}</div></div>
    <div class="sdl-report-section"><span class="sdl-label">Diagnosing What to Learn:</span><div class="sdl-value">${data.diagnose || '<em>Not provided</em>'}</div></div>
    <div class="sdl-report-section"><span class="sdl-label">Strategies Used:</span><div class="sdl-value">${data.strategy || '<em>Not provided</em>'}</div></div>
    <div class="sdl-report-section"><span class="sdl-label">Key Resources:</span>`;
  
  if (Array.isArray(data.resources) && data.resources.length > 0) {
    html += '<ul class="sdl-report-resources-list">';
    data.resources.forEach(resource => {
      const resourceType = RESOURCE_TYPES[resource.type]?.label || 'Resource';
      html += `<li>${resource.name} (${resourceType}): ${resource.description}</li>`;
    });
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
  
  // Show loading indicator
  const downloadBtn = qs('#downloadReportBtn');
  const originalBtnText = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
  
  // Create a temporary container with proper styling for export
  const exportContainer = document.createElement('div');
  exportContainer.className = 'export-container';
  exportContainer.style.width = `${Math.min(el.offsetWidth + 40, 800)}px`;
  exportContainer.style.position = 'absolute';
  exportContainer.style.left = '-9999px';
  exportContainer.style.top = '-9999px';
  
  // Clone the report content
  const reportClone = el.cloneNode(true);
  
  // Apply export-specific styling
  const glassElement = reportClone.querySelector('.sdl-report-glass');
  if (glassElement) {
    glassElement.classList.add('export-ready');
    
    // Ensure proper font loading
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap';
    fontLink.rel = 'stylesheet';
    exportContainer.appendChild(fontLink);
  }
  
  // Add the styled clone to our export container
  exportContainer.appendChild(reportClone);
  document.body.appendChild(exportContainer);
  
  // Set options for html2canvas
  const options = {
    backgroundColor: null, // Allow background to show
    scale: 2, // Higher quality
    logging: false,
    useCORS: true,
    allowTaint: true,
    width: exportContainer.offsetWidth,
    height: exportContainer.offsetHeight,
    onclone: function(clonedDoc) {
      // Fix any remaining styling issues in the cloned document
      const clonedGlass = clonedDoc.querySelector('.export-ready');
      if (clonedGlass) {
        // Ensure text color is white
        Array.from(clonedGlass.querySelectorAll('*')).forEach(el => {
          el.style.color = 'white';
        });
      }
    }
  };
  
  // Wait a moment for fonts to load before capturing
  setTimeout(() => {
    // Capture the properly styled container
    html2canvas(exportContainer, options).then(canvas => {
      try {
        // Create downloadable image
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'sdl-summary.png';
        link.href = imgData;
        link.click();
        
        // Clean up
        document.body.removeChild(exportContainer);
        
        // Success indicator
        downloadBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
        setTimeout(() => {
          downloadBtn.innerHTML = originalBtnText;
        }, 2000);
        
      } catch (error) {
        console.error('Error creating image:', error);
        alert('Sorry, there was an error creating the image.');
        document.body.removeChild(exportContainer);
        downloadBtn.innerHTML = originalBtnText;
      }
    }).catch(error => {
      console.error('Error generating canvas:', error);
      alert('Sorry, there was an error generating the image.');
      document.body.removeChild(exportContainer);
      downloadBtn.innerHTML = originalBtnText;
    });
  }, 100); // Small delay to ensure fonts and styling are applied
}
