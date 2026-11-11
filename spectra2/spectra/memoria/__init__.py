"""La memoria di Spectra: archivio, recupero, cura, modello di se'."""
from .archivio import Archivio, Ricordo
from .cura import Cura, stima
from .recupero import Recupero, Trovato, ritenzione
from .se import Lacune, Obiettivi, SeStesso
from .vettori import Incorporatore, coseno

__all__ = ["Archivio", "Ricordo", "Cura", "stima", "Recupero", "Trovato", "ritenzione", "Lacune", "Obiettivi", "SeStesso", "Incorporatore", "coseno"]
