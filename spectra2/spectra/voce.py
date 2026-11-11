"""La voce di Spectra: maschile, bassa, fredda, con un timbro metallico.

Tre strade, dalla migliore alla piu' semplice; si usa la prima disponibile:

  1. PIPER + FFMPEG (consigliata, tutta locale): Piper e' un sintetizzatore
     neurale che gira sul mini-PC senza rete; produce una voce italiana
     maschile naturale. FFmpeg ci applica la catena «robotica»: tono abbassato,
     una leggera modulazione ad anello che da' il metallo, un'eco cortissima da
     casco, compressione. Il risultato e' un WAV che il telefono manda agli
     altoparlanti degli occhiali.
  2. ESPEAK-NG + FFMPEG: una voce sintetica vecchio stile, gia' robotica di suo.
     Meno bella, ma sta in 2 MB e parte ovunque.
  3. NESSUNA SINTESI SUL SERVER: il servizio restituisce solo il testo e i
     parametri (tono 0,58 · velocita' 0,88), e la voce la fa il dispositivo con
     la sua sintesi (e' cio' che fa gia' l'app BioSpecInfo nel browser).

ONESTA': il timbro esatto dipende dalla voce Piper scelta e dalle orecchie di
chi ascolta; i numeri della catena qui sotto sono un punto di partenza
ragionevole, da ritoccare ascoltando. Questo modulo e' provato fin dove si puo'
senza altoparlanti: la scelta della strada, i comandi costruiti, il ripiego.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass

# i parametri che anche i client (browser, telefono) usano quando sintetizzano da soli
PARAMETRI_CLIENT = {"pitch": 0.58, "rate": 0.88, "volume": 1.0, "lingua": "it-IT"}


@dataclass
class Timbro:
    tono: float = 0.86          # 1 = invariato; 0,86 = circa due semitoni e mezzo piu' in basso
    metallo_hz: float = 62.0    # frequenza della modulazione ad anello: sotto i 100 Hz da' ruvidita', non un fischio
    metallo: float = 0.18       # quanta modulazione (0 = nessuna)
    eco_ms: float = 14.0        # un'eco cosi' corta non si sente come eco ma come «casco»
    eco: float = 0.28
    velocita: float = 0.94


def catena_ffmpeg(t: Timbro, frequenza: int = 22050) -> str:
    """Il filtro audio. asetrate abbassa il tono (e rallenta), atempo riporta la velocita' voluta; il tremolo veloce fa da
    modulazione ad anello leggera; aecho mette il casco; il compressore pareggia; il limitatore evita la distorsione."""
    passo = max(0.5, min(2.0, t.velocita / t.tono))
    filtri = [f"asetrate={int(frequenza * t.tono)}", f"aresample={frequenza}", f"atempo={passo:.4f}"]
    if t.metallo > 0:
        filtri.append(f"tremolo=f={t.metallo_hz:.1f}:d={min(1.0, t.metallo):.2f}")
    if t.eco > 0:
        filtri.append(f"aecho=0.8:0.7:{t.eco_ms:.0f}:{min(0.9, t.eco):.2f}")
    filtri += ["highpass=f=70", "lowpass=f=7200", "acompressor=threshold=-18dB:ratio=3:attack=5:release=80", "alimiter=limit=0.95"]
    return ",".join(filtri)


class Voce:
    def __init__(self, modello_piper: str | None = None, timbro: Timbro | None = None):
        """modello_piper: il percorso del file .onnx della voce (per l'italiano maschile, ad esempio la voce «riccardo» della raccolta di Piper)."""
        self.modello = modello_piper or os.environ.get("SPECTRA_PIPER_MODELLO")
        self.timbro = timbro or Timbro()
        self.ffmpeg = shutil.which("ffmpeg")
        self.piper = shutil.which("piper") if self.modello and os.path.exists(self.modello) else None
        self.espeak = shutil.which("espeak-ng") or shutil.which("espeak")

    def strada(self) -> str:
        if self.piper and self.ffmpeg:
            return "piper"
        if self.espeak and self.ffmpeg:
            return "espeak"
        return "client"

    def comandi(self, testo: str, grezzo: str, uscita: str) -> list[list[str]]:
        """I comandi da eseguire, in ordine. Separati dall'esecuzione perche' si possano controllare senza sintetizzare."""
        s = self.strada()
        if s == "piper":
            sintesi = [self.piper, "--model", self.modello, "--output_file", grezzo]
        elif s == "espeak":
            sintesi = [self.espeak, "-v", "it+m3", "-p", "25", "-s", "150", "-w", grezzo, testo]
        else:
            return []
        return [sintesi, [self.ffmpeg, "-y", "-loglevel", "error", "-i", grezzo, "-af", catena_ffmpeg(self.timbro), "-ar", "22050", "-ac", "1", uscita]]

    def sintetizza(self, testo: str, attesa: float = 60.0) -> bytes | None:
        """Restituisce un WAV, oppure None se sul server non c'e' modo di sintetizzare (allora parla il dispositivo)."""
        testo = (testo or "").strip()
        if not testo or self.strada() == "client":
            return None
        with tempfile.TemporaryDirectory() as d:
            grezzo, uscita = os.path.join(d, "grezzo.wav"), os.path.join(d, "voce.wav")
            passi = self.comandi(testo, grezzo, uscita)
            try:
                # Piper legge il testo dall'ingresso standard; espeak-ng dall'argomento
                subprocess.run(passi[0], input=testo.encode("utf-8") if self.strada() == "piper" else None, check=True, timeout=attesa, capture_output=True)
                subprocess.run(passi[1], check=True, timeout=attesa, capture_output=True)
                with open(uscita, "rb") as f:
                    return f.read()
            except (subprocess.SubprocessError, OSError):
                return None             # la voce non deve mai fermare la risposta: resta il testo
