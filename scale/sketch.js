// ── Scale e Battimenti ──
// Beating: interference between two close frequencies

let sliderF1, sliderF2;
let osc1, osc2;
let isPlaying = false;
let btnToggle;
let phase = 0;
let lastSentHTML = '';

// UI value labels
let valF1, valF2;

function setup() {
  let canvas = createCanvas(800, 480);
  canvas.parent('canvas-holder');
  textFont('Helvetica');

  // Toggle button
  btnToggle = createButton('▶  Avvia Audio');
  btnToggle.parent('options-container');
  btnToggle.mousePressed(toggleAudio);

  // Sliders with value labels
  let row1 = createDiv('').class('control-row').parent('sliders-container');
  createDiv('F1').class('control-label').parent(row1);
  sliderF1 = createSlider(100, 1000, 440, 1).parent(row1);
  valF1 = createDiv('440 Hz').class('control-value').parent(row1);
  sliderF1.input(() => { valF1.html(sliderF1.value() + ' Hz'); updateParentParams(); });

  let row2 = createDiv('').class('control-row').parent('sliders-container');
  createDiv('F2').class('control-label').parent(row2);
  sliderF2 = createSlider(100, 1000, 444, 1).parent(row2);
  valF2 = createDiv('444 Hz').class('control-value').parent(row2);
  sliderF2.input(() => { valF2.html(sliderF2.value() + ' Hz'); updateParentParams(); });

  // Oscillators
  osc1 = new p5.Oscillator('sine');
  osc1.amp(0.3);
  osc2 = new p5.Oscillator('sine');
  osc2.amp(0.3);

  updateParentParams();
}

function toggleAudio() {
  if (!isPlaying) {
    if (getAudioContext().state !== 'running') getAudioContext().resume();
    osc1.freq(sliderF1.value());
    osc2.freq(sliderF2.value());
    osc1.start();
    osc2.start();
    isPlaying = true;
    btnToggle.html('⏹  Ferma Audio');
    btnToggle.style('background', '#222');
    btnToggle.style('color', '#fff');
  } else {
    osc1.stop();
    osc2.stop();
    isPlaying = false;
    btnToggle.html('▶  Avvia Audio');
    btnToggle.style('background', '#fff');
    btnToggle.style('color', '#000');
  }
}

function draw() {
  background(255);

  let f1 = sliderF1.value();
  let f2 = sliderF2.value();

  if (isPlaying) {
    osc1.freq(f1);
    osc2.freq(f2);
  }

  // Draw pure waveform on white background (decorative grid lines removed)
  drawWaveform(f1, f2);
  updateParentParams();
}

function drawWaveform(f1, f2) {
  let visScale = 4.0 / 440.0; 
  let waveH = height * 0.4;
  let centerY = height * 0.5;
  let dt = 1.0 / width; 

  phase += deltaTime * 0.001;

  // Zero line
  stroke(200);
  line(0, centerY, width, centerY);

  // Wave 1 (blue)
  noFill();
  stroke(40, 100, 220, 120);
  strokeWeight(1.5);
  beginShape();
  for (let px = 0; px < width; px+=2) {
    let t = px * dt + phase;
    let y1 = sin(TWO_PI * f1 * visScale * t);
    vertex(px, centerY + y1 * waveH * 0.4);
  }
  endShape();

  // Wave 2 (red)
  stroke(220, 40, 40, 120);
  beginShape();
  for (let px = 0; px < width; px+=2) {
    let t = px * dt + phase;
    let y2 = sin(TWO_PI * f2 * visScale * t);
    vertex(px, centerY + y2 * waveH * 0.4);
  }
  endShape();

  // Combined wave
  stroke(0);
  strokeWeight(2);
  beginShape();
  for (let px = 0; px < width; px++) {
    let t = px * dt + phase;
    let y1 = sin(TWO_PI * f1 * visScale * t);
    let y2 = sin(TWO_PI * f2 * visScale * t);
    vertex(px, centerY + (y1 + y2) * waveH * 0.4);
  }
  endShape();

  // Envelope
  stroke(0, 150, 80, 150);
  strokeWeight(2);
  drawingContext.setLineDash([5, 5]);
  beginShape();
  for (let px = 0; px < width; px+=2) {
    let t = px * dt + phase;
    let env = cos(PI * abs(f1 - f2) * visScale * t);
    vertex(px, centerY + abs(env) * waveH * 0.8);
  }
  endShape();
  beginShape();
  for (let px = 0; px < width; px+=2) {
    let t = px * dt + phase;
    let env = cos(PI * abs(f1 - f2) * visScale * t);
    vertex(px, centerY - abs(env) * waveH * 0.8);
  }
  endShape();
  drawingContext.setLineDash([]);
}

function updateParentParams() {
  let f1 = sliderF1.value();
  let f2 = sliderF2.value();
  let media = (f1 + f2) / 2;
  let battimento = abs(f1 - f2);

  let html = `
    <div class="param-row"><span class="param-label" style="color:rgb(40, 100, 220);">Frequenza 1 (f₁):</span><span class="param-value" style="color:rgb(40, 100, 220);">${f1} Hz</span></div>
    <div class="param-row"><span class="param-label" style="color:rgb(220, 40, 40);">Frequenza 2 (f₂):</span><span class="param-value" style="color:rgb(220, 40, 40);">${f2} Hz</span></div>
    <div class="param-row"><span class="param-label" style="color:#000;">Media (Portante):</span><span class="param-value" style="color:#000;">${media.toFixed(1)} Hz</span></div>
    <div class="param-row"><span class="param-label" style="color:rgb(0, 150, 80);">Battimenti al sec:</span><span class="param-value" style="color:rgb(0, 150, 80);">${battimento} Hz</span></div>
    <div class="param-row" style="margin-top:10px;"><span class="param-label">Formula Dinamica:</span><span class="param-value" style="font-weight:normal;font-family:monospace;">2·sin(${media.toFixed(1)}·2π·t)·cos(${battimento}·π·t)</span></div>
  `;

  if (html !== lastSentHTML) {
    lastSentHTML = html;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'params', moduleId: 'scale', html: html }, '*');
    }
  }
}
