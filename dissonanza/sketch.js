// ── Dissonanza – Curve di Helmholtz con Parziali Spread ──

let spreadSlider;
let valSpread;
let partialsRadio;
let dissonanceCurve = [];
let baseFreq = 261.63; // Do4

// Audio variables
let oscA, oscB;
let isAudioPlaying = false;
let btnAudio;

let mLeft = 60, mRight = 40, mTop = 50, mBottom = 60;
let plotW, plotH;
let lastSentHTML = '';

const consonances = [
  { name: 'Unisono',    ratio: 1/1 },
  { name: 'III min',    ratio: 6/5 },
  { name: 'III Mag',    ratio: 5/4 },
  { name: 'Quarta',     ratio: 4/3 },
  { name: 'Quinta',     ratio: 3/2 },
  { name: 'Ottava',     ratio: 2/1 }
];

function plompLevelt(f1, f2) {
  let fMin = min(f1, f2);
  let df = abs(f1 - f2);
  let s = 0.24 / (0.0207 * fMin + 18.96);
  let x = s * df;
  let d = 5 * exp(-3.5 * x) - 5 * exp(-5.75 * x);
  return max(d, 0);
}

function totalDissonance(r, a, numPartials) {
  let partialsA = [];
  let partialsB = [];
  for (let n = 1; n <= numPartials; n++) {
    partialsA.push(pow(n, a) * baseFreq);
    partialsB.push(pow(n, a) * baseFreq * r);
  }
  let dTotal = 0;
  for (let i = 0; i < numPartials; i++) {
    for (let j = 0; j < numPartials; j++) {
      dTotal += plompLevelt(partialsA[i], partialsB[j]);
    }
  }
  return dTotal;
}

function buildCurve() {
  let a = spreadSlider.value();
  let numP = parseInt(partialsRadio.value()) || 6;
  dissonanceCurve = [];
  let steps = 400; // Ottimizzato per 800px di larghezza
  for (let i = 0; i <= steps; i++) {
    let ratio = map(i, 0, steps, 1.0, 2.0);
    let d = totalDissonance(ratio, a, numP);
    dissonanceCurve.push({ ratio: ratio, d: d });
  }
}

function setup() {
  let canvas = createCanvas(800, 480);
  canvas.parent('canvas-holder');
  textFont('Helvetica');

  // Audio setup
  oscA = new p5.Oscillator('sine');
  oscA.amp(0);
  oscA.freq(baseFreq);
  oscA.start();

  oscB = new p5.Oscillator('sine');
  oscB.amp(0);
  oscB.freq(baseFreq);
  oscB.start();

  // Audio Toggle Button (Top Left)
  btnAudio = createButton('▶  Avvia Audio');
  btnAudio.parent('options-container');
  btnAudio.mousePressed(toggleAudio);

  // Radio button top
  let optionsLabel = createDiv('Parziali:').style('font-size', '0.85rem').style('font-weight', '700').parent('options-container');
  partialsRadio = createRadio('partials');
  partialsRadio.option('6');
  partialsRadio.option('8');
  partialsRadio.option('10');
  partialsRadio.selected('6');
  partialsRadio.parent('options-container');
  partialsRadio.class('p5-radio-wrapper');
  partialsRadio.input(() => { buildCurve(); updateParentParams(); });

  // Slider bottom
  let row1 = createDiv('').class('control-row').parent('sliders-container');
  createDiv('Spread (a)').class('control-label').parent(row1);
  spreadSlider = createSlider(1.0, 1.3, 1.0, 0.01).parent(row1);
  valSpread = createDiv('1.00').class('control-value').parent(row1);
  spreadSlider.input(() => { 
    valSpread.html(nf(spreadSlider.value(), 1, 2)); 
    buildCurve(); 
    updateParentParams(); 
  });

  plotW = width - mLeft - mRight;
  plotH = height - mTop - mBottom;

  buildCurve();
}

function toggleAudio() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  if (!isAudioPlaying) {
    isAudioPlaying = true;
    oscA.amp(0.25, 0.05);
    oscB.amp(0.25, 0.05);
    btnAudio.html('■  Ferma Audio');
    btnAudio.style('background', '#000');
    btnAudio.style('color', '#fff');
  } else {
    isAudioPlaying = false;
    oscA.amp(0, 0.1);
    oscB.amp(0, 0.1);
    btnAudio.html('▶  Avvia Audio');
    btnAudio.style('background', '#fff');
    btnAudio.style('color', '#000');
  }
  updateParentParams();
}

function draw() {
  background(255);

  let maxD = 0;
  for (let pt of dissonanceCurve) if (pt.d > maxD) maxD = pt.d;
  if (maxD === 0) maxD = 1;

  // Clean solid white background (decorative grid lines removed)

  // Axes
  stroke(0);
  strokeWeight(1.5);
  line(mLeft, mTop + plotH, mLeft + plotW, mTop + plotH); // X
  line(mLeft, mTop, mLeft, mTop + plotH); // Y

  // Labels
  noStroke();
  fill(0);
  textAlign(CENTER, TOP);
  textSize(12);
  text('Rapporto di Frequenza', mLeft + plotW / 2, mTop + plotH + 40);

  push();
  translate(mLeft - 40, mTop + plotH / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, BOTTOM);
  text('Dissonanza Totale', 0, 0);
  pop();

  // Tick marks X
  textAlign(CENTER, TOP);
  textSize(10);
  for (let v = 1.0; v <= 2.01; v += 0.1) {
    let x = map(v, 1.0, 2.0, mLeft, mLeft + plotW);
    stroke(0);
    strokeWeight(1);
    line(x, mTop + plotH, x, mTop + plotH + 5);
    noStroke();
    text(nf(v, 1, 1), x, mTop + plotH + 8);
  }

  // Consonances
  for (let c of consonances) {
    let x = map(c.ratio, 1.0, 2.0, mLeft, mLeft + plotW);
    stroke(180);
    strokeWeight(1);
    drawingContext.setLineDash([4, 4]);
    line(x, mTop, x, mTop + plotH);
    drawingContext.setLineDash([]);
    noStroke();
    fill(100);
    textAlign(CENTER, BOTTOM);
    textSize(9);
    text(c.name, x, mTop - 5);
  }

  // Curve
  noFill();
  stroke(40, 100, 220);
  strokeWeight(2);
  beginShape();
  for (let pt of dissonanceCurve) {
    let x = map(pt.ratio, 1.0, 2.0, mLeft, mLeft + plotW);
    let y = map(pt.d, 0, maxD, mTop + plotH, mTop);
    vertex(x, y);
  }
  endShape();

  // Interactive Cursor
  let mx = constrain(mouseX, mLeft, mLeft + plotW);
  let cursorRatio = map(mx, mLeft, mLeft + plotW, 1.0, 2.0);
  let a = spreadSlider.value();
  let numP = parseInt(partialsRadio.value()) || 6;
  let cursorD = totalDissonance(cursorRatio, a, numP);
  let dotX = mx;
  let dotY = map(cursorD, 0, maxD, mTop + plotH, mTop);

  stroke(220, 40, 40);
  strokeWeight(1);
  line(dotX, mTop, dotX, mTop + plotH);

  fill(220, 40, 40);
  noStroke();
  ellipse(dotX, dotY, 8, 8);

  fill(0);
  textAlign(LEFT, BOTTOM);
  textSize(12);
  text(nf(cursorRatio, 1, 3), dotX + 8, dotY - 8);

  // Real-time audio frequency sweep
  if (isAudioPlaying) {
    oscB.freq(baseFreq * cursorRatio);
  }

  updateParentParams(cursorRatio, cursorD, a, numP);
}

function updateParentParams(r, d, a, n) {
  if(r === undefined) return;
  
  let audioStatus = isAudioPlaying ? "<span style='color:#0a0;font-weight:bold;'>ATTIVO</span>" : "<span style='color:#777;'>SPENTO</span>";

  let html = `
    <div class="param-row"><span class="param-label">Stato Audio:</span><span class="param-value">${audioStatus}</span></div>
    <div class="param-row"><span class="param-label">Frequenza Base:</span><span class="param-value">${baseFreq} Hz (Do₄)</span></div>
    <div class="param-row"><span class="param-label">Numero Parziali:</span><span class="param-value">${n}</span></div>
    <div class="param-row"><span class="param-label">Fattore Spread (a):</span><span class="param-value">${nf(a, 1, 2)}</span></div>
    <div class="param-row" style="margin-top:10px;"><span class="param-label" style="color:#c33;">Rapporto Cursore:</span><span class="param-value" style="color:#c33;">${nf(r, 1, 4)} (${nf(baseFreq * r, 1, 1)} Hz)</span></div>
    <div class="param-row"><span class="param-label" style="color:#c33;">Dissonanza Locale:</span><span class="param-value" style="color:#c33;">${nf(d, 1, 2)}</span></div>
  `;

  if (html !== lastSentHTML) {
    lastSentHTML = html;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'params', moduleId: 'dissonanza', html: html }, '*');
    }
  }
}
