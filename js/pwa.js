// BioSpecInfo v11 — PWA install handler
'use strict';

(function(){
  let deferredPrompt = null;
  const installBtn = document.getElementById('install-cta');

  // Check if already installed
  function isInstalled() {
    return window.matchMedia('(display-mode:standalone)').matches ||
           window.matchMedia('(display-mode:fullscreen)').matches ||
           window.navigator.standalone === true;
  }

  // Show install banner
  function showInstallBanner() {
    if(document.getElementById('pwa-banner')) return;
    if(isInstalled()) return;
    if(sessionStorage.getItem('pwa-banner-dismissed')) return;

    const banner = document.createElement('aside');
    banner.id = 'pwa-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Installa app');
    banner.innerHTML = `
      <span class="pwa-icon" aria-hidden="true">📲</span>
      <div class="pwa-text">
        <strong>Installa BioSpecInfo</strong>
        <small>Accesso veloce · funziona offline</small>
      </div>
      <button class="pwa-yes" aria-label="Installa l'app">Installa</button>
      <button class="pwa-no" aria-label="Chiudi banner">✕</button>
    `;

    document.body.appendChild(banner);

    banner.querySelector('.pwa-yes').onclick = triggerInstall;
    banner.querySelector('.pwa-no').onclick = () => {
      banner.remove();
      sessionStorage.setItem('pwa-banner-dismissed', '1');
    };
  }

  async function triggerInstall() {
    const banner = document.getElementById('pwa-banner');
    if(banner) banner.remove();

    if(!deferredPrompt) {
      showManualInstructions();
      return;
    }

    deferredPrompt.prompt();
    try {
      const {outcome} = await deferredPrompt.userChoice;
      if(outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        deferredPrompt = null;
        if(installBtn) installBtn.hidden = true;
      } else {
        console.log('[PWA] User dismissed install');
      }
    } catch(e) {
      console.warn('[PWA] Prompt failed:', e);
    }
  }

  function showManualInstructions() {
    if(isInstalled()) {
      if(window.App && window.App.toast) window.App.toast('✅ App già installata');
      return;
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);

    let msg;
    if(isIOS) {
      msg = '📱 iPhone/iPad Safari:\n\n' +
            '1. Tocca l\'icona Condividi (⬆️) in basso\n' +
            '2. Scorri e tocca "Aggiungi a schermata Home"\n' +
            '3. Tocca "Aggiungi"';
    } else if(isAndroid) {
      msg = '📱 Android Chrome:\n\n' +
            '1. Tocca il menu ⋮ (tre puntini in alto)\n' +
            '2. Tocca "Installa app" oppure "Aggiungi a schermata Home"\n' +
            '3. Conferma l\'installazione\n\n' +
            'Se non vedi l\'opzione: ricarica la pagina e aspetta 5 secondi.';
    } else {
      msg = '💻 Desktop Chrome/Edge:\n\n' +
            '1. Cerca l\'icona ⊕ nella barra dell\'indirizzo (a destra)\n' +
            '2. Cliccala\n' +
            '3. Clicca "Installa"\n\n' +
            'Oppure: Menu ⋮ → "Installa BioSpecInfo"';
    }
    alert(msg);
  }

  // Show install button only when installable
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if(installBtn) {
      installBtn.hidden = false;
      installBtn.onclick = triggerInstall;
    }

    // Show banner after a delay
    setTimeout(showInstallBanner, 2000);
  });

  // Listen for successful install
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Successfully installed');
    if(installBtn) installBtn.hidden = true;
    const banner = document.getElementById('pwa-banner');
    if(banner) banner.remove();
    deferredPrompt = null;

    if(window.App && window.App.toast) {
      window.App.toast('✅ App installata con successo!', 4000);
    }
  });

  // Manual install via header button
  if(installBtn) {
    installBtn.onclick = triggerInstall;
  }

  // Show install button if not installed (for manual trigger)
  if(!isInstalled() && installBtn) {
    setTimeout(() => {
      if(!deferredPrompt) {
        // Browser doesn't support beforeinstallprompt, but still show button for manual instructions
        installBtn.hidden = false;
        installBtn.onclick = triggerInstall;
      }
    }, 3000);
  }

  // Expose for app
  window.PWA = {
    triggerInstall,
    isInstalled,
    showManualInstructions
  };
})();
