let oscOctave, oscFifth;
let isPlaying = false;
let button;

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    oscOctave = new p5.Oscillator('sine');
    oscFifth = new p5.Oscillator('sine');
    
    let baseFreq = 55;
    oscOctave.freq(baseFreq * Math.pow(2, 7));       // 7 Ottave
    oscFifth.freq(baseFreq * Math.pow(1.5, 12));     // 12 Quinte
    
    button = createButton('Genera Segnale di Discrepanza');
    button.position(20, 20);
    button.mousePressed(toggleAudio);
}

function draw() {
    background(240);
    
    fill(50);
    textSize(14);
    text("Rapporto 7 Ottave (2^7): 128.00", 20, 80);
    text("Rapporto 12 Quinte ((3/2)^12): 129.74", 20, 110);
    text("Comma Pitagorico: 1.0136", 20, 140);
    
    if (isPlaying) {
        fill(255, 100, 100);
        rect(20, 160, 300, 20);
        fill(100, 100, 255);
        let errorWidth = 300 * (129.74 / 128.00);
        rect(20, 190, errorWidth, 20);
        
        fill(50);
        text("Rappresentazione vettoriale dell'errore", 20, 230);
    }
}

function toggleAudio() {
    if (!isPlaying) {
        oscOctave.start();
        oscOctave.amp(0.1, 0.1);
        oscFifth.start();
        oscFifth.amp(0.1, 0.1);
        button.html('Interrompi Segnale');
        isPlaying = true;
    } else {
        oscOctave.amp(0, 0.1);
        oscFifth.amp(0, 0.1);
        setTimeout(() => {
            oscOctave.stop();
            oscFifth.stop();
        }, 100);
        button.html('Genera Segnale di Discrepanza');
        isPlaying = false;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
