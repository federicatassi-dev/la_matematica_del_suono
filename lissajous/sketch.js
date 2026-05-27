// ─── Lissajous ───────────────────────────────────────────
// x = sin(fx·t + φ) · cos(mx·t)
// y = sin(fy·t + φ) · cos(my·t)

let sliderFx, sliderFy, sliderMx, sliderMy;
let btnOttava, btnQuinta, btnTerza, btnUnisono;
let valFx, valFy, valMx, valMy;

// Animation & Audio variables
let animPhase = 0;
let isAnimating = true;
let btnAnim;

let oscX, oscY;
let isAudioPlaying = false;
let btnAudio;
let baseAud = 150; // Warm mid-bass register

let lastSentHTML = '';

function setup() {
  let canvas = createCanvas(800, 480);
  canvas.parent('canvas-holder');

  // Audio setup
  oscX = new p5.Oscillator('sine');
  oscX.amp(0);
  oscX.pan(-1.0); // Left channel
  oscX.start();

  oscY = new p5.Oscillator('sine');
  oscY.amp(0);
  oscY.pan(1.0); // Right channel
  oscY.start();

  // Audio Toggle Button
  btnAudio = createButton('▶  Avvia audio').parent('options-container');
  btnAudio.mousePressed(toggleAudio);

  // Animation Toggle Button
  btnAnim = createButton('■  Ferma animazione').parent('options-container');
  btnAnim.mousePressed(() => {
    isAnimating = !isAnimating;
    btnAnim.html(isAnimating ? '■  Ferma animazione' : '▶  Anima');
    if (isAnimating) {
      btnAnim.style('background', '#000');
      btnAnim.style('color', '#fff');
    } else {
      btnAnim.style('background', '#fff');
      btnAnim.style('color', '#000');
    }
  });
  btnAnim.style('background', '#000');
  btnAnim.style('color', '#fff');

  // Preset Buttons
  btnUnisono = createButton('1:1 unisono').parent('options-container');
  btnOttava = createButton('2:1 ottava').parent('options-container');
  btnQuinta = createButton('3:2 quinta').parent('options-container');
  btnTerza  = createButton('5:4 terza mag').parent('options-container');
  
  // Go to new line after 5:4 button
  createDiv('').style('width', '100%').style('height', '0').parent('options-container');
  
  // Add Quinta Mag button on new line
  btnQuintaMag = createButton('8:5 quinta mag').parent('options-container');

  btnUnisono.mousePressed(() => setPreset(1, 1));
  btnOttava.mousePressed(()  => setPreset(2, 1));
  btnQuinta.mousePressed(()  => setPreset(3, 2));
  btnTerza.mousePressed(()   => setPreset(5, 4));
  btnQuintaMag.mousePressed(() => setPreset(8, 5));

  // --- Grid 2x2 of Sliders ---
  // Row 1 (Fx, Fy)
  let r1 = createDiv('').class('control-row').parent('sliders-container');
  createDiv('Fx').class('control-label').parent(r1);
  sliderFx = createSlider(1, 10, 3, 0.1).parent(r1);
  valFx = createDiv('3.0').class('control-value').parent(r1);
  sliderFx.input(() => { valFx.html(nf(sliderFx.value(), 1, 1)); updateParentParams(); });

  let r2 = createDiv('').class('control-row').parent('sliders-container');
  createDiv('Fy').class('control-label').parent(r2);
  sliderFy = createSlider(1, 10, 2, 0.1).parent(r2);
  valFy = createDiv('2.0').class('control-value').parent(r2);
  sliderFy.input(() => { valFy.html(nf(sliderFy.value(), 1, 1)); updateParentParams(); });

  // Row 2 (Mx, My)
  let r3 = createDiv('').class('control-row').parent('sliders-container');
  createDiv('Mx').class('control-label').parent(r3);
  sliderMx = createSlider(0, 1, 0, 0.01).parent(r3);
  valMx = createDiv('0.00').class('control-value').parent(r3);
  sliderMx.input(() => { valMx.html(nf(sliderMx.value(), 1, 2)); updateParentParams(); });

  let r4 = createDiv('').class('control-row').parent('sliders-container');
  createDiv('My').class('control-label').parent(r4);
  sliderMy = createSlider(0, 1, 0, 0.01).parent(r4);
  valMy = createDiv('0.00').class('control-value').parent(r4);
  sliderMy.input(() => { valMy.html(nf(sliderMy.value(), 1, 2)); updateParentParams(); });

  updateParentParams();
}

function toggleAudio() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  if (!isAudioPlaying) {
    isAudioPlaying = true;
    oscX.amp(0.2, 0.05);
    oscY.amp(0.2, 0.05);
    btnAudio.html('■  Ferma audio');
    btnAudio.style('background', '#000');
    btnAudio.style('color', '#fff');
  } else {
    isAudioPlaying = false;
    oscX.amp(0, 0.1);
    oscY.amp(0, 0.1);
    btnAudio.html('▶  Avvia audio');
    btnAudio.style('background', '#fff');
    btnAudio.style('color', '#000');
  }
  updateParentParams();
}

function setPreset(fx, fy) {
  sliderFx.value(fx); valFx.html(nf(fx, 1, 1));
  sliderFy.value(fy); valFy.html(nf(fy, 1, 1));
  animPhase = 0; // Reset animation
  updateParentParams();
}

function draw() {
  background(255);

  let fx = sliderFx.value();
  let fy = sliderFy.value();
  let mx = sliderMx.value();
  let my = sliderMy.value();

  // Internally set base phase to PI/2, plus any animated phase offset
  if (isAnimating) {
    animPhase += 0.015;
  }
  let phi = HALF_PI + animPhase;

  let cx = width / 2;
  let cy = height / 2;
  let amp = 200; // max radius

  // Solid white background (Subtle reference crosshair removed as per layout minimalist request)

  noFill();
  stroke(40, 100, 220);
  strokeWeight(1.5);

  // Optimize iterations based on modulation
  let maxT = (mx > 0 || my > 0) ? TWO_PI * 30 : TWO_PI * 5;
  let step = (mx > 0 || my > 0) ? 0.05 : 0.02;

  beginShape();
  for (let t = 0; t <= maxT; t += step) {
    let x = sin(fx * t + phi) * cos(mx * t);
    let y = sin(fy * t + phi) * cos(my * t);
    vertex(cx + x * amp, cy + y * amp);
  }
  endShape();

  // Synthesizer update
  if (isAudioPlaying) {
    oscX.freq(baseAud * fx);
    oscY.freq(baseAud * fy);
  }

  updateParentParams();
}

function gcd(a, b) {
  a = abs(round(a));
  b = abs(round(b));
  while (b) { let temp = b; b = a % b; a = temp; }
  return a;
}

function updateParentParams() {
  if (!sliderFx) return;

  let fx = sliderFx.value();
  let fy = sliderFy.value();
  let mx = sliderMx.value();
  let my = sliderMy.value();
  
  let currentPhi = (HALF_PI + animPhase) % TWO_PI;

  let g = gcd(round(fx * 10), round(fy * 10));
  let rA = round(fx * 10) / g;
  let rB = round(fy * 10) / g;
  
  let stato = (mx === 0 && my === 0) ? "chiusa (consonante)" : "modulata (dissonante)";
  let audioStatus = isAudioPlaying ? "<span style='color:#0a0;font-weight:bold;'>attivo (stereo)</span>" : "<span style='color:#777;'>spento</span>";

  let html = `
    <div class="param-row"><span class="param-label">Stato Audio:</span><span class="param-value">${audioStatus}</span></div>
    <div class="param-row"><span class="param-label" style="color:rgb(40, 100, 220);">Rapporto Fx:Fy:</span><span class="param-value" style="color:rgb(40, 100, 220);">${rA}:${rB}</span></div>
    <div class="param-row"><span class="param-label">Freq. Canale Sx:</span><span class="param-value">${(baseAud * fx).toFixed(0)} Hz</span></div>
    <div class="param-row"><span class="param-label">Freq. Canale Dx:</span><span class="param-value">${(baseAud * fy).toFixed(0)} Hz</span></div>
    <div class="param-row"><span class="param-label">Modulazione X:</span><span class="param-value">${nf(mx, 1, 2)}</span></div>
    <div class="param-row"><span class="param-label">Modulazione Y:</span><span class="param-value">${nf(my, 1, 2)}</span></div>
    <div class="param-row"><span class="param-label">Fase Apparente:</span><span class="param-value">${nf(currentPhi, 1, 2)} rad</span></div>
    <div class="param-row" style="margin-top:10px; border-top: 1px solid #eee; padding-top: 10px;"><span class="param-label" style="color:#444;">Stato Topologico:</span><span class="param-value" style="color:#000;">${stato}</span></div>
  `;

  if (html !== lastSentHTML) {
    lastSentHTML = html;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'params', moduleId: 'lissajous', html: html }, '*');
    }
  }
}
