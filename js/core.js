// BioSpecInfo v11 — Core: router, navigation, lazy loading
'use strict';

const App = {
  state: {
    section: null,
    loaded: new Set(),
    nav: [
      {id: 'dashboard', icon: '🏠', label: 'Home'},
      {id: 'molecules', icon: '🔬', label: 'Molecole'},
      {id: 'pharma', icon: '💊', label: 'Farmaci'},
      {id: 'synthesis', icon: '🧪', label: 'Sintesi'},
      {id: 'periodic', icon: '⬡', label: 'Periodica'},
      {id: 'spectroscopy', icon: '📊', label: 'Spettri'},
      {id: 'analytics', icon: '📚', label: 'Analitica'},
      {id: 'amino', icon: '🧬', label: 'Aminoacidi'},
      {id: 'notes', icon: '📝', label: 'Note'},
      {id: 'filemanager', icon: '📁', label: 'File'},
      {id: 'about', icon: 'ℹ️', label: 'About'},
    ],
  },

  modules: {
    dashboard: () => import('./modules/dashboard.js'),
    molecules: () => import('./modules/molecules.js'),
    pharma: () => import('./modules/pharma.js'),
    synthesis: () => import('./modules/synthesis.js'),
    periodic: () => import('./modules/periodic.js'),
    spectroscopy: () => import('./modules/spectroscopy.js'),
    analytics: () => import('./modules/analytics.js'),
    amino: () => import('./modules/amino.js'),
    notes: () => import('./modules/notes.js'),
    filemanager: () => import('./modules/filemanager.js'),
    about: () => import('./modules/about.js'),
  },

  async init() {
    this.buildNav();
    this.setupRouter();
    this.setupHeaderButtons();
    const initial = location.hash.slice(1) || 'dashboard';
    await this.loadSection(initial);
    // Preload adjacent modules in background
    if(window.requestIdleCallback) {
      requestIdleCallback(() => this.preloadAdjacent());
    }
  },

  setupRouter() {
    window.addEventListener('hashchange', () => {
      const sec = location.hash.slice(1) || 'dashboard';
      this.loadSection(sec);
    });
  },

  setupHeaderButtons() {
    const dl = document.getElementById('download-btn');
    if(dl) dl.onclick = () => this.downloadAll();

    const search = document.getElementById('search-btn');
    if(search) search.onclick = () => this.openSearch();
  },

  async loadSection(secId) {
    const main = document.getElementById('main');
    if(!main) return;

    main.setAttribute('aria-busy', 'true');

    // Update nav active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === secId);
    });

    // Show skeleton immediately
    main.innerHTML = this.renderSkeleton(secId);

    try {
      const moduleLoader = this.modules[secId];
      if(!moduleLoader) {
        main.innerHTML = this.renderNotFound(secId);
        return;
      }

      const mod = await moduleLoader();
      main.innerHTML = '';

      if(typeof mod.default?.render === 'function') {
        await mod.default.render(main);
      } else {
        main.innerHTML = this.renderError('Modulo non valido');
      }

      this.state.loaded.add(secId);
      this.state.section = secId;
      document.title = `${secId.charAt(0).toUpperCase() + secId.slice(1)} — BioSpecInfo`;

      // Scroll to top
      window.scrollTo({top: 0, behavior: 'smooth'});

    } catch(err) {
      console.error(`Failed to load ${secId}:`, err);
      main.innerHTML = this.renderError(err.message);
    } finally {
      main.setAttribute('aria-busy', 'false');
    }
  },

  renderSkeleton(secId) {
    const nav = this.state.nav.find(n => n.id === secId);
    const title = nav ? `${nav.icon} ${nav.label}` : 'Caricamento';
    return `
      <div class="skeleton">
        <div class="section-title">${title}</div>
        <div class="skeleton-line" style="width:65%"></div>
        <div class="skeleton-line" style="width:90%"></div>
        <div class="skeleton-line" style="width:75%"></div>
        <div class="skeleton-line" style="width:55%"></div>
      </div>`;
  },

  renderNotFound(secId) {
    return `
      <div class="empty-state">
        <span class="icon">❓</span>
        <h3>Sezione non trovata</h3>
        <p>La sezione "${secId}" non esiste.</p>
        <button class="btn btn-primary" onclick="location.hash='dashboard'">🏠 Torna alla home</button>
      </div>`;
  },

  renderError(msg) {
    return `
      <div class="error-state">
        <h3>⚠️ Errore di caricamento</h3>
        <p>${msg}</p>
        <button class="btn" onclick="location.reload()">🔄 Ricarica pagina</button>
      </div>`;
  },

  buildNav() {
    const nav = document.getElementById('nav-wrap');
    if(!nav) return;
    nav.innerHTML = this.state.nav.map(item => `
      <button class="nav-btn" data-section="${item.id}" onclick="location.hash='${item.id}'" aria-label="${item.label}">
        <span aria-hidden="true">${item.icon}</span> ${item.label}
      </button>
    `).join('');
  },

  preloadAdjacent() {
    const currentIdx = this.state.nav.findIndex(n => n.id === this.state.section);
    const adjacent = [
      this.state.nav[currentIdx - 1]?.id,
      this.state.nav[currentIdx + 1]?.id,
    ].filter(Boolean);
    adjacent.forEach(id => {
      if(this.modules[id] && !this.state.loaded.has(id)) {
        this.modules[id]().catch(() => {});
      }
    });
  },

  downloadAll() {
    this.toast('Preparazione download...');
    setTimeout(() => {
      try {
        // Download all files as a zip-like instruction
        const msg = 'Per scaricare il sito completo:\n\n1. Vai su GitHub: github.com/samupropio1-ship-it/BioSpecInfo-\n2. Code → Download ZIP\n\nOppure salva ogni pagina con Ctrl+S';
        alert(msg);
      } catch(e) {
        this.toast('Errore download: ' + e.message);
      }
    }, 100);
  },

  openSearch() {
    const modal = document.getElementById('modal-root');
    if(!modal) return;
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this)this.parentElement.innerHTML=''">
        <div class="modal" role="dialog" aria-label="Ricerca">
          <div class="modal-header">
            <strong>🔍 Cerca</strong>
            <button class="btn" onclick="document.getElementById('modal-root').innerHTML=''" aria-label="Chiudi">✕</button>
          </div>
          <div class="modal-body">
            <input type="search" id="globalSearch" placeholder="Cerca farmaci, sintesi, molecole..." autofocus>
            <div id="searchResults" style="margin-top:12px"></div>
          </div>
        </div>
      </div>`;
    const input = document.getElementById('globalSearch');
    const results = document.getElementById('searchResults');
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if(q.length < 2) { results.innerHTML = ''; return; }
      const matches = this.state.nav.filter(n =>
        n.label.toLowerCase().includes(q) || n.id.includes(q)
      );
      results.innerHTML = matches.length
        ? matches.map(m => `<button class="btn" style="width:100%;justify-content:flex-start;margin-bottom:6px" onclick="location.hash='${m.id}';document.getElementById('modal-root').innerHTML=''">${m.icon} ${m.label}</button>`).join('')
        : '<div style="color:var(--text2);padding:14px;text-align:center">Nessun risultato</div>';
    });
  },

  toast(msg, duration = 3000) {
    const root = document.getElementById('toast-root');
    if(!root) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => t.remove(), duration);
  },
};

// Make App globally accessible for modules
window.App = App;

// Init when DOM ready
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

export default App;
