let osc;
let baseFreq = 261.63; // C4
let root12 = Math.pow(2, 1/12);
let currentStep = 0;
let playing = false;

function setup() {
    createCanvas(windowWidth, windowHeight);
    osc = new p5.Oscillator('sine');
    
    let btn = createButton('Esegui Scala Logaritmica');
    btn.position(20, 20);
    btn.mousePressed(playScale);
}

function draw() {
    background(240);
    
    fill(50);
    textSize(14);
    text("Parametro Moltiplicatore: " + root12.toFixed(5), 20, 80);
    
    let barWidth = width - 40;
    
    for (let i = 0; i <= 12; i++) {
        let x = map(i, 0, 12, 20, width - 40);
        let freq = baseFreq * Math.pow(root12, i);
        
        if (playing && i === currentStep) {
            fill(100, 100, 255);
            rect(x, 120, 20, -100 * (freq/1000));
            text(freq.toFixed(1) + "Hz", x, 140);
        } else {
            fill(150);
            rect(x, 120, 20, -50);
        }
    }
}

function playScale() {
    if (playing) return;
    playing = true;
    currentStep = 0;
    osc.start();
    osc.amp(0.1, 0.1);
    
    let interval = setInterval(() => {
        let freq = baseFreq * Math.pow(root12, currentStep);
        osc.freq(freq, 0.05);
        
        currentStep++;
        if (currentStep > 12) {
            clearInterval(interval);
            osc.amp(0, 0.5);
            setTimeout(() => osc.stop(), 500);
            playing = false;
        }
    }, 400);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
