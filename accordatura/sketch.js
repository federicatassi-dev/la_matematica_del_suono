// Accordatura — Pythagorean vs Equal Temperament interactive piano
// Base frequency: C4 = 261.63 Hz

let tuningRadio;
let osc;
let activeKey = -1; // index of pressed key (-1 = none)
let selectedFreq = 0;
let selectedFormula = '';
let lastSentHTML = '';

const BASE_FREQ = 261.63;
const NOTE_NAMES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// Frazioni pitagoriche esatte (ridotte all'ottava [1, 2))
const PYTH_FRACTIONS = [
  '1/1', '2187/2048', '9/8', '19683/16384', '81/64', '4/3',
  '729/512', '3/2', '6561/4096', '27/16', '59049/32768', '243/128'
];

function buildPythagoreanRatios() {
  let fifthSteps = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
  let raw = [];
  for (let i = 0; i < 12; i++) {
    let fIdx = fifthSteps.indexOf(i);
    let ratio = Math.pow(3 / 2, fIdx);
    while (ratio >= 2) ratio /= 2;
    while (ratio < 1) ratio *= 2;
    raw.push(ratio);
  }
  return raw;
}
const PYTH_RATIOS = buildPythagoreanRatios();

// ----- Piano key geometry -----
const WHITE_CHROMATIC = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
const BLACK_CHROMATIC = [1, 3, 6, 8, 10]; // C# D# F# G# A#
const BLACK_POSITIONS = [0, 1, 3, 4, 5]; // after white key 0,1,3,4,5

let PIANO_X = 140; // Centered in 800px
let PIANO_Y = 130;
let WHITE_W = 74;
let WHITE_H = 260;
let BLACK_W = 46;
let BLACK_H = 160;

function setup() {
  let canvas = createCanvas(800, 480);
  canvas.parent('canvas-holder');

  tuningRadio = createRadio('tuning');
  tuningRadio.option('Equabile');
  tuningRadio.option('Pitagorico');
  tuningRadio.selected('Equabile');
  tuningRadio.parent('options-container');
  tuningRadio.class('p5-radio-wrapper');
  tuningRadio.input(() => updateParentParams());

  osc = new p5.Oscillator('sine');
  osc.amp(0);
  osc.start();

  updateParentParams();
}

function draw() {
  background(255);

  // Clean solid white background (decorative grid lines removed)
  drawPiano();

  // Send updates
  updateParentParams();
}

function drawPiano() {
  // White keys
  for (let i = 0; i < 7; i++) {
    let x = PIANO_X + i * WHITE_W;
    let chromatic = WHITE_CHROMATIC[i];
    let isActive = activeKey === chromatic;

    stroke(0);
    strokeWeight(1.5);
    fill(isActive ? color(40, 100, 220) : 255);
    rect(x, PIANO_Y, WHITE_W, WHITE_H);

    // Note label
    noStroke();
    fill(isActive ? 255 : 0);
    textSize(14);
    textFont('Helvetica');
    textAlign(CENTER, BOTTOM);
    text(NOTE_NAMES[chromatic], x + WHITE_W / 2, PIANO_Y + WHITE_H - 14);
  }

  // Black keys
  for (let i = 0; i < 5; i++) {
    let wPos = BLACK_POSITIONS[i];
    let x = PIANO_X + wPos * WHITE_W + WHITE_W - BLACK_W / 2;
    let chromatic = BLACK_CHROMATIC[i];
    let isActive = activeKey === chromatic;

    stroke(0);
    strokeWeight(1.5);
    fill(isActive ? color(40, 100, 220) : 30);
    rect(x, PIANO_Y, BLACK_W, BLACK_H);

    // Note label
    noStroke();
    fill(isActive ? 255 : 200);
    textSize(11);
    textAlign(CENTER, BOTTOM);
    text(NOTE_NAMES[chromatic], x + BLACK_W / 2, PIANO_Y + BLACK_H - 10);
  }
}

function getFrequency(n) {
  let mode = tuningRadio.value() || 'Equabile';
  if (mode === 'Pitagorico') {
    let ratio = PYTH_RATIOS[n];
    let frac = PYTH_FRACTIONS[n];
    selectedFormula = frac + ' &times; ' + BASE_FREQ.toFixed(2);
    return BASE_FREQ * ratio;
  } else {
    selectedFormula = '2<sup>' + n + '/12</sup> &times; ' + BASE_FREQ.toFixed(2);
    return BASE_FREQ * Math.pow(2, n / 12);
  }
}

function hitTestPiano(mx, my) {
  for (let i = 0; i < 5; i++) {
    let wPos = BLACK_POSITIONS[i];
    let x = PIANO_X + wPos * WHITE_W + WHITE_W - BLACK_W / 2;
    if (mx >= x && mx <= x + BLACK_W && my >= PIANO_Y && my <= PIANO_Y + BLACK_H) {
      return BLACK_CHROMATIC[i];
    }
  }
  for (let i = 0; i < 7; i++) {
    let x = PIANO_X + i * WHITE_W;
    if (mx >= x && mx <= x + WHITE_W && my >= PIANO_Y && my <= PIANO_Y + WHITE_H) {
      return WHITE_CHROMATIC[i];
    }
  }
  return -1;
}

function mousePressed() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  let k = hitTestPiano(mouseX, mouseY);
  if (k >= 0) {
    activeKey = k;
    selectedFreq = getFrequency(k);
    osc.freq(selectedFreq);
    osc.amp(0.4, 0.05);
    updateParentParams();
  }
}

function mouseReleased() {
  if (activeKey >= 0) {
    osc.amp(0, 0.15);
    activeKey = -1;
    updateParentParams();
  }
}

function updateParentParams() {
  let mode = tuningRadio.value() || 'Equabile';
  let noteStr = activeKey >= 0 ? NOTE_NAMES[activeKey] : '&mdash;';
  let freqStr = activeKey >= 0 ? selectedFreq.toFixed(2) + ' Hz' : '&mdash;';
  let formStr = activeKey >= 0 ? selectedFormula : '&mdash;';

  let activeColor = activeKey >= 0 ? 'rgb(40, 100, 220)' : '#000';

  let html = `
    <div class="param-row"><span class="param-label">Modello Attivo:</span><span class="param-value">${mode}</span></div>
    <div class="param-row"><span class="param-label">Frequenza Base:</span><span class="param-value">${BASE_FREQ.toFixed(2)} Hz</span></div>
    <div class="param-row"><span class="param-label" style="color:${activeColor};">Nota Selezionata:</span><span class="param-value" style="color:${activeColor};">${noteStr}</span></div>
    <div class="param-row"><span class="param-label" style="color:${activeColor};">Frequenza Calcolata:</span><span class="param-value" style="color:${activeColor};">${freqStr}</span></div>
    <div class="param-row"><span class="param-label">Formula:</span><span class="param-value" style="font-weight:normal;font-family:monospace;">${formStr}</span></div>
  `;

  if (html !== lastSentHTML) {
    lastSentHTML = html;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'params', moduleId: 'accordatura', html: html }, '*');
    }
  }
}
