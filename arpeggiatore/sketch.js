// === ARPEGGIATORE MATEMATICO ===

let osc;
let fft;
let playing = false;

// Presets mapping
let presets = {
  'Maggiore': '0, 4, 7, 12',
  'Minore': '0, 3, 7, 12',
  'Diminuito': '0, 3, 6, 12',
  'Aumentato': '0, 4, 8, 12',
  'Maj 7': '0, 4, 7, 11, 12',
  'Pentatonica': '0, 2, 4, 7, 9, 12',
  'Custom 12 Note': '0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12',
  'Ascendente (30 note)': '0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29'
};

let chordName = 'Maggiore';
let chordIntervals = [0, 4, 7, 12];
let currentStep = 0;
let baseFreq = 261.63; // C4
let currentFreq = baseFreq;
let waveType = 'sine';
let tempo = 250;
let lastStepTime = 0;

let toggleBtn;
let selPreset;
let seqInput;
let tempoSlider;
let valTempo;
let lastSentHTML = '';

function setup() {
  let canvas = createCanvas(800, 480);
  canvas.parent('canvas-holder');
  textFont('Helvetica');

  // Audio setup
  osc = new p5.Oscillator(waveType);
  osc.amp(0);
  osc.start();

  fft = new p5.FFT(0.8, 256);
  fft.setInput(osc);

  // Play/Stop Button
  toggleBtn = createButton('▶ START').parent('options-container');
  toggleBtn.mousePressed(togglePlay);

  // Presets Dropdown
  createSpan('Presets:').class('label-bold').parent('options-container');
  selPreset = createSelect().parent('options-container');
  selPreset.class('p5-select-preset');
  Object.keys(presets).forEach(name => {
    selPreset.option(name);
  });
  selPreset.changed(() => {
    let chosen = selPreset.value();
    chordName = chosen;
    let seqStr = presets[chosen];
    seqInput.value(seqStr);
    parseSequence(seqStr);
  });

  // Custom Input Box
  createSpan('Sequenza:').class('label-bold').parent('options-container');
  seqInput = createInput('0, 4, 7, 12').parent('options-container');
  seqInput.class('p5-input-seq');
  seqInput.input(() => {
    chordName = 'Personalizzato';
    selPreset.value('Custom 12 Note'); // visual fallback or keep custom
    parseSequence(seqInput.value());
  });

  // Tempo Slider (Bottom)
  let r1 = createDiv('').class('control-row').parent('sliders-container');
  createDiv('Tempo').class('control-label').parent(r1);
  tempoSlider = createSlider(50, 1000, 250, 1).parent(r1);
  valTempo = createDiv('250 ms').class('control-value').parent(r1);
  tempoSlider.input(() => { 
    tempo = tempoSlider.value(); 
    valTempo.html(tempo + ' ms'); 
    updateParentParams(); 
  });

  parseSequence(seqInput.value());
}

// Parses string to numbers list, clamping between 3 and 30 notes
function parseSequence(str) {
  let parts = str.split(',');
  let arr = [];
  parts.forEach(p => {
    let val = parseInt(p.trim());
    if (!isNaN(val)) {
      arr.push(val);
    }
  });

  // Clamp limits to [3, 30]
  if (arr.length < 3) {
    while (arr.length < 3) arr.push(0);
  } else if (arr.length > 30) {
    arr = arr.slice(0, 30);
  }

  chordIntervals = arr;
  currentStep = currentStep % chordIntervals.length;
  updateParentParams();
}

function draw() {
  background(255);

  // Arpeggiator step logic
  if (playing) {
    let now = millis();
    if (now - lastStepTime >= tempo) {
      lastStepTime = now;
      currentStep = (currentStep + 1) % chordIntervals.length;
      let n = chordIntervals[currentStep];
      currentFreq = baseFreq * pow(2, n / 12);
      osc.freq(currentFreq);
      updateParentParams();
    }
  }

  // Draw Waveform from FFT on solid white background (decorative grid lines removed)
  let waveform = fft.waveform();
  let waveCenterY = 160;
  let waveH = 180;

  stroke(220);
  strokeWeight(1);
  line(0, waveCenterY, width, waveCenterY);

  stroke(40, 100, 220);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i = 0; i < waveform.length; i++) {
    let x = map(i, 0, waveform.length, 0, width);
    let y = map(waveform[i], -1, 1, waveCenterY + waveH/2, waveCenterY - waveH/2);
    vertex(x, y);
  }
  endShape();

  // Draw Sequencer Step Rectangles at bottom (Scales dynamic from 3 to 30 elements!)
  let rectY = 320;
  let rectH = 45;
  let rectTotalW = 720;
  let gap = 4;
  let numNotes = chordIntervals.length;
  
  // Fit size dynamically inside rectTotalW
  let rectW = (rectTotalW - (numNotes - 1) * gap) / numNotes;
  let rectStartX = (width - rectTotalW) / 2;

  for (let i = 0; i < numNotes; i++) {
    let x = rectStartX + i * (rectW + gap);
    let isActive = (i === currentStep && playing);
    
    if (isActive) {
      fill(0);
      stroke(0);
    } else {
      fill(250);
      stroke(200);
    }
    strokeWeight(1.5);
    rect(x, rectY, rectW, rectH);

    // Font size scaling depending on element width
    let tSize = 14;
    if (rectW < 20) tSize = 8;
    else if (rectW < 30) tSize = 10;
    else if (rectW < 45) tSize = 12;

    fill(isActive ? 255 : 100);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(tSize);
    textStyle(BOLD);
    
    // If rectW is extremely tiny, hide text to avoid visual overlap
    if (rectW >= 12) {
      text(chordIntervals[i], x + rectW / 2, rectY + rectH / 2);
    }
  }
  textStyle(NORMAL);

  // Draw Live Mathematical Ratio Above Active Step Box
  if (playing && numNotes > 0) {
    let activeN = chordIntervals[currentStep];
    let ratioVal = pow(2, activeN / 12);
    let activeX = rectStartX + currentStep * (rectW + gap) + rectW/2;
    
    // Draw connecting line and pointer
    stroke(220, 40, 40);
    strokeWeight(1);
    line(activeX, waveCenterY + waveH/2, activeX, rectY - 15);
    
    fill(220, 40, 40);
    noStroke();
    ellipse(activeX, rectY - 15, 6, 6);
    
    // Typographical label of the ratio
    textAlign(CENTER, BOTTOM);
    textSize(11);
    textStyle(BOLD);
    text("n: " + activeN + " | " + ratioVal.toFixed(4) + "x", activeX, rectY - 20);
    textStyle(NORMAL);
  }

  // Lower Instructions
  fill(120);
  textSize(12);
  textAlign(CENTER, BOTTOM);
  text("Premi 1, 2, 3 o 4 sulla tastiera per cambiare la forma d'onda (sine, square, triangle, sawtooth).", width/2, height - 15);
}

function togglePlay() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  if (!playing) {
    playing = true;
    currentStep = 0;
    let n = chordIntervals[currentStep];
    currentFreq = baseFreq * pow(2, n / 12);
    osc.freq(currentFreq);
    osc.amp(0.4, 0.05);
    lastStepTime = millis();
    toggleBtn.html('■ STOP');
    toggleBtn.style('background', '#fff');
    toggleBtn.style('color', '#000');
  } else {
    playing = false;
    osc.amp(0, 0.1);
    toggleBtn.html('▶ START');
    toggleBtn.style('background', '#000');
    toggleBtn.style('color', '#fff');
  }
  updateParentParams();
}

function keyPressed() {
  if (key === '1') waveType = 'sine';
  else if (key === '2') waveType = 'square';
  else if (key === '3') waveType = 'triangle';
  else if (key === '4') waveType = 'sawtooth';
  
  if (['1','2','3','4'].includes(key)) {
    osc.setType(waveType);
    updateParentParams();
  }
}

function updateParentParams() {
  if (!chordIntervals || chordIntervals.length === 0) return;
  
  let n = chordIntervals[currentStep];
  let ratio = pow(2, n / 12);
  let activeRatioStr = playing ? ratio.toFixed(4) + " x" : "--";
  let activeNoteStr = playing ? n : "--";
  
  let html = `
    <div class="param-row"><span class="param-label">Nome Sequenza:</span><span class="param-value">${chordName}</span></div>
    <div class="param-row"><span class="param-label">Lunghezza Sequenza:</span><span class="param-value">${chordIntervals.length} note</span></div>
    <div class="param-row"><span class="param-label">Forma d'onda:</span><span class="param-value">${waveType}</span></div>
    <div class="param-row"><span class="param-label">Tempo Arpeggio:</span><span class="param-value">${tempo} ms</span></div>
    <div class="param-row" style="margin-top:8px; border-top:1px solid #000; padding-top:8px;"><span class="param-label" style="color:#000; font-weight:700;">Nota Attiva (Semitoni):</span><span class="param-value" style="color:#000;">${activeNoteStr}</span></div>
    <div class="param-row"><span class="param-label" style="color:#c33; font-weight:700;">Rapporto Frequenza:</span><span class="param-value" style="color:#c33;">${activeRatioStr}</span></div>
    <div class="param-row"><span class="param-label" style="color:#000; font-weight:700;">Frequenza Calcolata:</span><span class="param-value" style="color:#000;">${playing ? currentFreq.toFixed(2) : '--'} Hz</span></div>
  `;

  if (html !== lastSentHTML) {
    lastSentHTML = html;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'params', moduleId: 'arpeggiatore', html: html }, '*');
    }
  }
}
