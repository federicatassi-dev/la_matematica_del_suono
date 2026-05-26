/* ── main.js ─────────────────────────────────────────────
   SPA dynamic router based on Tim Tijink's editorial layout.
   ─────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var modules = [
    {
      id: 'accordatura',
      src: 'accordatura/index.html',
      title: 'Sistemi di accordatura',
      formula: '(3/2)¹² ≈ 2⁷   |   ¹²√2 ≈ 1.05946',
      description:
        "Confronto tra accordatura pitagorica (quinte pure) e temperamento equabile (divisione logaritmica). La tastiera interattiva evidenzia il comma pitagorico e la risoluzione tramite distribuzione uniforme dell'errore."
    },
    {
      id: 'scale',
      src: 'scale/index.html',
      title: 'Battimenti e interferenza',
      formula: 'sin(f₁t) + sin(f₂t) = 2·sin((f₁+f₂)/2·t)·cos((f₁−f₂)/2·t)',
      description:
        'Quando due frequenze ravvicinate si sovrappongono, il volume oscilla ciclicamente. Il termine sin genera la portante, il termine cos la modulazione lenta di ampiezza.'
    },
    {
      id: 'dissonanza',
      src: 'dissonanza/index.html',
      title: 'Curve di dissonanza',
      formula: 'd(f) = Σ Plomp-Levelt(p_i, p_j)   |   f_n = n^a · f',
      description:
        "Modello empirico di Helmholtz: la dissonanza totale è la somma delle interferenze tra tutte le coppie di parziali. Il parametro Spread (a) altera lo spettro allungando le parziali, spostando i minimi di consonanza."
    },
    {
      id: 'lissajous',
      src: 'lissajous/index.html',
      title: 'Figure di Lissajous',
      formula: 'x = sin(f_x·t+φ)·cos(m_x·t)   |   y = sin(f_y·t+φ)·cos(m_y·t)',
      description:
        'Intersezione geometrica di due vibrazioni perpendicolari. Rapporti semplici (2:1, 3:2) generano curve chiuse e stabili (consonanza). Rapporti complessi producono tracciati densi (dissonanza).'
    },
    {
      id: 'arpeggiatore',
      src: 'arpeggiatore/index.html',
      title: 'Arpeggiatore vettoriale',
      formula: 'f(n) = f₀ · 2^(n/12)   |   Seq: Custom 3-30 note',
      description:
        "Sequenziatore parametrico di intervalli discreti. Digita la tua sequenza libera di semitoni (da 3 a 30 note) ed esplora visivamente ed acusticamente i rapporti esatti di frequenza per ciascuna parziale."
    }
  ];

  var activeIndex = -1; // -1 means home/index

  // DOM Elements
  var indexView = document.getElementById('index-view');
  var toolView = document.getElementById('tool-view');
  var indexContainer = document.getElementById('index-rows-container');

  var iframe = document.getElementById('tool-iframe');
  var toolTitle = document.getElementById('tool-info-title');
  var toolFormula = document.getElementById('tool-info-formula');
  var toolDesc = document.getElementById('tool-info-desc');
  var toolParamsContent = document.getElementById('tool-params-content');

  var btnPrev = document.getElementById('btn-nav-prev');
  var btnNext = document.getElementById('btn-nav-next');
  var navTitle = document.getElementById('nav-tool-title');

  /* ── SPA Router Navigation ─────────────────────────── */
  function navigateTo(index) {
    activeIndex = index;

    if (activeIndex === -1) {
      // Show Index Page
      toolView.classList.remove('active');
      indexView.classList.add('active');
      iframe.src = ""; // Unload iframe to save memory/audio context
      window.location.hash = "";
    } else {
      // Show Tool Page
      indexView.classList.remove('active');
      toolView.classList.add('active');

      var mod = modules[activeIndex];
      iframe.src = mod.src;
      toolTitle.textContent = mod.title;
      toolFormula.textContent = mod.formula;
      toolDesc.textContent = mod.description;
      navTitle.textContent = mod.title;

      // Reset params pane pending new updates from iframe
      toolParamsContent.innerHTML = '<div class="param-row"><span class="param-label" style="font-style: italic;">In attesa di interazione...</span></div>';

      // Update Navigation Buttons Labels
      var prevIndex = (activeIndex - 1 + modules.length) % modules.length;
      var nextIndex = (activeIndex + 1) % modules.length;
      btnPrev.innerHTML = '<span class="arrow-icon">&larr;</span>' + modules[prevIndex].title;
      btnNext.innerHTML = modules[nextIndex].title + '<span class="arrow-icon">&rarr;</span>';

      window.location.hash = mod.id;
    }
  }

  /* ── Generate Index Table Rows (Tijink Style) ─────── */
  function generateIndexTable() {
    if (!indexContainer) return;
    indexContainer.innerHTML = "";

    modules.forEach(function (mod, i) {
      var row = document.createElement('div');
      row.className = 'index-row';

      // Num cell
      var cellNum = document.createElement('div');
      cellNum.className = 'index-cell num';
      cellNum.textContent = String(i + 1).padStart(2, '0');
      row.appendChild(cellNum);

      // Title cell
      var cellTitle = document.createElement('div');
      cellTitle.className = 'index-cell title';
      cellTitle.textContent = mod.title;
      row.appendChild(cellTitle);

      // Formula cell
      var cellFormula = document.createElement('div');
      cellFormula.className = 'index-cell formula';
      cellFormula.textContent = mod.formula;
      row.appendChild(cellFormula);

      // Action cell
      var cellAction = document.createElement('div');
      cellAction.className = 'index-cell action';
      
      var link = document.createElement('a');
      link.href = "#" + mod.id;
      link.innerHTML = "Esplora &rarr;";
      link.addEventListener('click', function (e) {
        e.preventDefault();
        navigateTo(i);
      });
      cellAction.appendChild(link);
      row.appendChild(cellAction);

      indexContainer.appendChild(row);
    });
  }

  /* ── Setup Event Listeners ─────────────────────────── */
  function setupEvents() {
    // Logo Click -> back to index
    document.querySelector('.logo-text').addEventListener('click', function () {
      navigateTo(-1);
    });

    // Navigation bar click events
    btnPrev.addEventListener('click', function () {
      var prevIndex = (activeIndex - 1 + modules.length) % modules.length;
      navigateTo(prevIndex);
    });

    btnNext.addEventListener('click', function () {
      var nextIndex = (activeIndex + 1) % modules.length;
      navigateTo(nextIndex);
    });

    // Handle back button / URL hashes
    window.addEventListener('hashchange', handleHash);
  }

  function handleHash() {
    var hash = window.location.hash.substring(1);
    if (!hash) {
      navigateTo(-1);
      return;
    }
    var foundIndex = -1;
    for (var i = 0; i < modules.length; i++) {
      if (modules[i].id === hash) {
        foundIndex = i;
        break;
      }
    }
    if (foundIndex !== -1 && foundIndex !== activeIndex) {
      navigateTo(foundIndex);
    }
  }

  /* ── Initialization ────────────────────────────────── */
  generateIndexTable();
  setupEvents();
  handleHash(); // Run once at start to handle direct bookmark loads

})();
