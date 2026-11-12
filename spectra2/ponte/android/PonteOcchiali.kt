/* ═══════════════════════════════════════════════════════════════════════════
   PonteOcchiali.kt — il ponte fra i Ray-Ban Meta e il cervello di Spectra

   CHE COS'E'
   Un'app Android compagna, in primo piano come servizio. Gli occhiali non
   eseguono codice di terzi: tutto passa dal telefono. Il Wearables Device
   Access Toolkit (DAT) di Meta da' all'app del telefono l'accesso alla
   fotocamera, ai microfoni e agli altoparlanti degli occhiali; quest'app li
   collega al servizio di Spectra (spectra/servizio.py).

       occhiali ⇄ (Bluetooth / Wi-Fi, DAT) ⇄ QUESTA APP ⇄ (HTTPS, rete privata) ⇄ Spectra

   STATO DI QUESTO FILE — da leggere prima di usarlo
   · NON E' STATO COMPILATO. E' il progetto del ponte scritto come codice, non
     un'app provata: qui non ci sono ne' l'SDK ne' gli occhiali.
   · Tutto cio' che dipende dal DAT e' chiuso dietro l'interfaccia `Occhiali`.
     La classe `OcchialiMeta` in fondo e' l'UNICO punto che tocca l'SDK, e i
     nomi che usa vanno controllati sul riferimento della versione installata
     (il toolkit e' cambiato piu' volte durante l'anteprima: moduli
     `mwdat-core` e `mwdat-camera`, sessione di streaming con stati, fotogrammi
     video, cattura di una foto). Dove un nome non e' certo c'e' scritto
     «DA VERIFICARE».
   · `OcchialiFinti` permette di far girare e provare tutto il resto (il
     ciclo, il servizio, la voce) sul telefono, senza occhiali; il Mock Device
     Kit del toolkit fa lo stesso a livello di SDK.
   · Limiti reali da tenere presenti: la fotocamera si usa su richiesta (una
     foto o un breve flusso), non «sempre accesa»: lo vietano la batteria e la
     riservatezza, e il LED di registrazione degli occhiali si accende.
   · IL NOME «SPECTRA». «Hey Meta» e' riconosciuto DENTRO gli occhiali, dal loro
     processore, e resta dell'assistente di Meta: nessuna app di terzi puo'
     cambiarlo o aggiungerne un altro li'. Spectra risponde al suo nome in un
     altro modo, che funziona ma ha un costo: quest'app tiene aperto il
     microfono degli occhiali (che per Android e' una cuffia Bluetooth) e
     cerca la parola «Spectra» SUL TELEFONO (classe `SentinellaDelNome`).
     Conseguenze da sapere prima: l'ascolto va acceso (tocco o pulsante
     dell'app: «modalita' Spectra») e resta acceso finche' non lo si spegne;
     consuma batteria degli occhiali e del telefono, perche' il collegamento
     audio resta aperto; mentre e' acceso la musica passa in qualita' da
     telefonata; in tasca, con lo schermo spento, serve un servizio in primo
     piano con la notifica fissa. Senza la modalita' accesa, Spectra si attiva
     con un tocco sulla stanghetta.
   ═══════════════════════════════════════════════════════════════════════════ */
package it.biospecinfo.spectra.ponte

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Base64
import kotlinx.coroutines.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.Locale
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume

/* ── 1. cio' che il ponte chiede agli occhiali: quattro cose, niente di piu' ── */
interface Occhiali {
    val collegati: Boolean
    /** Una foto di cio' che l'utente sta guardando, in JPEG. Null se la fotocamera non e' disponibile o il permesso manca. */
    suspend fun scattaFoto(): ByteArray?
    /** Instrada l'audio del telefono verso gli altoparlanti degli occhiali (di norma lo fa il profilo Bluetooth). */
    fun preparaAudio()
    /** Chiama `azione` quando l'utente tocca la stanghetta (o il pulsante dell'app, se il gesto non e' esposto). */
    fun alTocco(azione: () -> Unit)
    fun chiudi()
}

/* ── 2. il client del servizio di Spectra ── */
class ClientSpectra(private val url: String, private val gettone: String) {
    private val http = OkHttpClient.Builder().connectTimeout(10, TimeUnit.SECONDS).readTimeout(120, TimeUnit.SECONDS).build()
    private val json = "application/json; charset=utf-8".toMediaType()

    private fun chiama(metodo: String, strada: String, corpo: JSONObject? = null): JSONObject {
        val r = Request.Builder().url(url.trimEnd('/') + strada).header("Authorization", "Bearer $gettone")
            .method(metodo, corpo?.toString()?.toRequestBody(json)).build()
        http.newCall(r).execute().use { risposta ->
            val testo = risposta.body?.string().orEmpty()
            if (!risposta.isSuccessful) throw IllegalStateException("Spectra: HTTP ${risposta.code} $testo")
            return JSONObject(testo)
        }
    }

    /** Un turno: testo (da voce), eventuale foto, canale «occhiali». Chiede anche l'audio gia' sintetizzato con la voce di Spectra. */
    fun turno(testo: String, foto: ByteArray?, contesto: Map<String, String> = emptyMap()): JSONObject {
        // la sessione e' «principale», la stessa del computer e del telefono: cambia solo il dispositivo. E' cio' che permette
        // di cominciare una frase alla scrivania e finirla per strada.
        val corpo = JSONObject().put("testo", testo).put("sessione", "principale").put("canale", "occhiali").put("audio", true)
            .put("dispositivo", DISPOSITIVO).put("tipo", "occhiali").put("contesto", JSONObject(contesto))
        if (foto != null) corpo.put("immagini", JSONArray().put(JSONObject().put("mime", "image/jpeg").put("b64", Base64.encodeToString(foto, Base64.NO_WRAP))))
        return chiama("POST", "/turno", corpo)
    }

    /** L'attesa lunga degli eventi: i promemoria e le iniziative che il battito del servizio pubblica, e i turni fatti altrove. */
    fun eventi(dopo: Long): JSONObject = chiama("GET", "/eventi?dispositivo=$DISPOSITIVO&tipo=occhiali&dopo=$dopo&attesa=20")
    fun registraStrumenti(strumenti: JSONArray) = chiama("POST", "/strumenti/registra", JSONObject().put("client", "occhiali").put("strumenti", strumenti))
    fun attendiChiamata(): JSONObject? = chiama("GET", "/strumenti/attesa?client=occhiali&attesa=20").optJSONObject("chiamata")
    fun esito(id: String, esito: String) = chiama("POST", "/strumenti/esito", JSONObject().put("id", id).put("esito", esito))
    fun fineSessione() = chiama("POST", "/sessione/fine", JSONObject().put("sessione", "principale"))

    companion object { const val DISPOSITIVO = "occhiali" }
}

/* ── 3. la voce: l'audio che arriva da Spectra, oppure la sintesi del telefono con gli stessi parametri ── */
class VoceTelefono(private val ctx: Context) {
    private var tts: TextToSpeech? = null
    private var lettore: MediaPlayer? = null

    init {
        tts = TextToSpeech(ctx) { stato ->
            if (stato == TextToSpeech.SUCCESS) tts?.apply { language = Locale.ITALIAN; setPitch(0.58f); setSpeechRate(0.88f) }
        }
    }

    /** Preferisce il WAV sintetizzato dal servizio (la voce «vera» di Spectra); se manca, parla il telefono. */
    fun di(testo: String, wavB64: String?) {
        ferma()
        if (wavB64 != null) {
            val f = File.createTempFile("spectra", ".wav", ctx.cacheDir)
            f.writeBytes(Base64.decode(wavB64, Base64.DEFAULT))
            lettore = MediaPlayer().apply {
                setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANT).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                setDataSource(f.absolutePath); setOnCompletionListener { f.delete() }; prepare(); start()
            }
        } else tts?.speak(testo, TextToSpeech.QUEUE_FLUSH, null, "spectra")
    }

    fun ferma() { lettore?.runCatching { stop(); release() }; lettore = null; tts?.stop() }
    fun chiudi() { ferma(); tts?.shutdown() }
}

/* ── 4. l'ascolto: il riconoscimento vocale di Android, dal microfono instradato dagli occhiali ── */
class Ascolto(private val ctx: Context) {
    suspend fun ascolta(): String? = suspendCancellableCoroutine { cont ->
        val r = SpeechRecognizer.createSpeechRecognizer(ctx)
        r.setRecognitionListener(object : RecognitionListener {
            override fun onResults(b: Bundle) { r.destroy(); if (cont.isActive) cont.resume(b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()) }
            override fun onError(e: Int) { r.destroy(); if (cont.isActive) cont.resume(null) }
            override fun onReadyForSpeech(p: Bundle?) {}; override fun onBeginningOfSpeech() {}; override fun onRmsChanged(v: Float) {}
            override fun onBufferReceived(b: ByteArray?) {}; override fun onEndOfSpeech() {}; override fun onPartialResults(b: Bundle?) {}; override fun onEvent(t: Int, b: Bundle?) {}
        })
        r.startListening(android.content.Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM).putExtra(RecognizerIntent.EXTRA_LANGUAGE, "it-IT"))
        cont.invokeOnCancellation { r.destroy() }
    }
}

/* ── 4 bis. il nome: «Spectra» come parola di attivazione, cercata sul telefono ───────────────────────────────
   Due modi di farlo, dietro la stessa interfaccia:
     · `SentinellaConRiconoscitore` (qui sotto): usa il riconoscimento vocale di Android in sessioni che si riaprono da
       sole, e guarda i risultati parziali. Non chiede librerie in piu'. Limiti: su molti telefoni ogni sessione fa un
       suono (si toglie abbassando per un istante il volume delle notifiche), e senza il pacchetto di lingua italiano
       installato sul telefono l'audio va ai server di Google: installarlo, e tenere EXTRA_PREFER_OFFLINE.
     · un motore di «keyword spotting» fatto per questo (per esempio openWakeWord o Vosk con una grammatica di una
       parola sola): gira tutto sul telefono, consuma meno, non fa suoni. E' la strada giusta per l'uso di tutti i
       giorni; richiede di addestrare o scegliere il modello della parola «Spectra». Si innesta implementando
       `SentinellaDelNome` e basta: il resto del ponte non cambia.
   In tutti e due i casi cio' che la sentinella sente NON lascia il telefono finche' il nome non e' stato detto: al
   servizio arriva solo la frase che segue «Spectra». */
interface SentinellaDelNome {
    /** Comincia ad ascoltare. `chiamato(comando)`: il nome e' stato detto; `comando` e' cio' che lo segue ('' se ha detto solo il nome). */
    fun avvia(chiamato: (comando: String) -> Unit)
    fun sospendi()          // mentre Spectra parla: altrimenti sentirebbe se stesso
    fun riprendi()
    fun ferma()
}

/** La stessa regola del client web (client/index.html, `estraiComando`), provata li' in un browser: il riconoscimento
 *  scrive il nome in molti modi, e «spettrometria» non e' una chiamata. */
object Nome {
    private val RE = Regex("(?:^|[\\s,.;:!?«\"'(])(?:ehi\\s+|hey\\s+|ok\\s+|senti\\s+)?(spectra|spettra|spectre|spetra|spektra|spekt?tra|specter)(?=$|[\\s,.;:!?»\"')])[\\s,.;:!?]*", RegexOption.IGNORE_CASE)
    /** Null se non lo sta chiamando; altrimenti il comando che segue il nome (anche vuoto). */
    fun comando(trascrizione: String): String? {
        val t = trascrizione.trim(); val m = RE.find(t) ?: return null
        return t.substring(m.range.last + 1).trim()
    }
}

class SentinellaConRiconoscitore(private val ctx: Context) : SentinellaDelNome {
    private var r: SpeechRecognizer? = null
    private var attiva = false; private var sospesa = false
    private var chiamato: ((String) -> Unit)? = null
    private val mano = android.os.Handler(android.os.Looper.getMainLooper())

    override fun avvia(chiamato: (String) -> Unit) { this.chiamato = chiamato; attiva = true; sospesa = false; apri() }
    override fun sospendi() { sospesa = true; r?.cancel() }
    override fun riprendi() { if (attiva && sospesa) { sospesa = false; mano.postDelayed({ apri() }, 400) } }
    override fun ferma() { attiva = false; r?.destroy(); r = null }

    private fun apri() {
        if (!attiva || sospesa) return
        r?.destroy()
        val ric = SpeechRecognizer.createSpeechRecognizer(ctx); r = ric
        ric.setRecognitionListener(object : RecognitionListener {
            private var gia = false
            private fun guarda(b: Bundle?, finale: Boolean) {
                if (gia) return
                val t = b?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: return
                val c = Nome.comando(t) ?: return
                if (!finale && c.isNotEmpty()) return          // ha detto il nome e sta ancora parlando: si aspetta la frase intera
                gia = true; sospendi(); chiamato?.invoke(c)
            }
            override fun onPartialResults(b: Bundle?) = guarda(b, false)
            override fun onResults(b: Bundle) { guarda(b, true); if (!gia) riapri() }
            override fun onError(e: Int) = riapri()               // silenzio, nessuna corrispondenza, rete: si riapre e basta
            private fun riapri() { mano.postDelayed({ apri() }, 250) }
            override fun onReadyForSpeech(p: Bundle?) {}; override fun onBeginningOfSpeech() {}; override fun onRmsChanged(v: Float) {}
            override fun onBufferReceived(b: ByteArray?) {}; override fun onEndOfSpeech() {}; override fun onEvent(t: Int, b: Bundle?) {}
        })
        ric.startListening(android.content.Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM).putExtra(RecognizerIntent.EXTRA_LANGUAGE, "it-IT")
            .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true).putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true))
    }
}

/* ── 5. il ponte: il ciclo che tiene tutto insieme ── */
class PonteOcchiali(ctx: Context, private val occhiali: Occhiali, private val spectra: ClientSpectra,
                    private val sentinella: SentinellaDelNome = SentinellaConRiconoscitore(ctx)) {
    private val ambito = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val voce = VoceTelefono(ctx)
    private val ascolto = Ascolto(ctx)
    private var occupato = false
    /** La «modalita' Spectra»: il microfono resta aperto e Spectra risponde al suo nome. Si accende e si spegne con `nome(true/false)`. */
    var ascoltaIlNome = false; private set

    /** Le parole che dicono a Spectra di guardare: allora, e solo allora, parte una foto. */
    private val GUARDA = Regex("\\b(guarda|cosa (vedi|sto guardando|c'è)|che (cos'è|molecola|spettro|reagente)|leggi|questo|questa|qui)\\b", RegexOption.IGNORE_CASE)

    fun avvia() {
        occhiali.preparaAudio()
        occhiali.alTocco { ambito.launch { conversa() } }
        ambito.launch(Dispatchers.IO) { runCatching { spectra.registraStrumenti(STRUMENTI) }; serviStrumenti() }
        ambito.launch { eventi() }
    }

    /** Accende o spegne l'ascolto del nome. Acceso: «Spectra, …» da' il via a un turno senza toccare nulla. */
    fun nome(acceso: Boolean) {
        ascoltaIlNome = acceso
        if (!acceso) { sentinella.ferma(); return }
        sentinella.avvia { comando -> ambito.launch {
            if (comando.isEmpty()) { voce.di("Sì.", null); delay(700); conversa() }       // ha detto solo «Spectra»: la frase dopo e' la domanda
            else conversa(comando)
        } }
    }

    /** Un turno a voce: ascolta (se la frase non e' gia' arrivata con il nome), decide se serve la foto, chiede a Spectra, dice la risposta. */
    private suspend fun conversa(giaDetto: String? = null) {
        if (occupato) { voce.ferma(); occupato = false; return }      // un secondo tocco mentre parla: lo zittisce
        occupato = true; sentinella.sospendi()
        try {
            val detto = (giaDetto ?: ascolto.ascolta())?.trim().orEmpty()
            if (detto.isEmpty()) return
            val foto = if (GUARDA.containsMatchIn(detto) && occhiali.collegati) occhiali.scattaFoto() else null
            val r = withContext(Dispatchers.IO) { spectra.turno(detto, foto, mapOf("dispositivo" to "Ray-Ban Meta", "foto" to (if (foto != null) "sì" else "no"))) }
            voce.di(r.optString("voce"), r.optJSONObject("audio")?.optString("b64"))
        } catch (e: Exception) {
            voce.di("Non riesco a raggiungere il mio cervello. Riprova fra poco.", null)
        } finally {
            occupato = false
            if (ascoltaIlNome) { delay(DOPO_LA_VOCE); sentinella.riprendi() }      // torna ad ascoltare quando ha finito di parlare
        }
    }

    /** Il rele' degli strumenti: cio' che Spectra puo' chiedere agli occhiali mentre ragiona.
     *  Per ora solo lo stato. La FOTO NON e' uno strumento del modello: la scatta il ponte PRIMA del turno, quando la frase
     *  dell'utente chiede di guardare, e parte insieme al messaggio. Farla chiedere al modello a meta' ragionamento vorrebbe
     *  dire far passare un'immagine dentro l'esito di uno strumento, che il servizio oggi tratta come testo: e' nel piano
     *  (fase 4), non qui. */
    private suspend fun serviStrumenti() {
        var errori = 0
        while (ambito.isActive) {
            try {
                val c = spectra.attendiChiamata(); errori = 0
                if (c == null) continue
                val esito = when (c.getString("nome")) {
                    "stato_occhiali" -> if (occhiali.collegati) "collegati" else "non collegati"
                    else -> "strumento sconosciuto"
                }
                spectra.esito(c.getString("id"), esito)
            } catch (e: Exception) { errori++; delay(minOf(60_000L, 1000L shl minOf(errori, 6))) }
        }
    }

    /** Gli eventi del servizio: un promemoria giunto all'ora o un'iniziativa. Il servizio dice su quale dispositivo va detto
     *  (`parla_su`, l'ultimo usato): se sono gli occhiali lo dicono loro, altrimenti tacciono. I turni fatti altrove non si dicono. */
    private suspend fun eventi() {
        var dopo = -1L; var errori = 0
        while (ambito.isActive) {
            try {
                val d = withContext(Dispatchers.IO) { spectra.eventi(dopo) }; errori = 0
                dopo = d.optLong("ultimo", dopo)
                val ev = d.optJSONArray("eventi") ?: continue
                for (k in 0 until ev.length()) {
                    val e = ev.getJSONObject(k); val tipo = e.optString("tipo")
                    if (tipo != "promemoria" && tipo != "iniziativa") continue
                    val dati = e.optJSONObject("dati") ?: continue
                    if (dati.optString("parla_su") == ClientSpectra.DISPOSITIVO && occhiali.collegati && !occupato) voce.di(dati.optString("frase"), null)
                }
            } catch (e: Exception) { errori++; delay(minOf(60_000L, 1000L shl minOf(errori, 6))) }
        }
    }

    fun chiudi() { sentinella.ferma(); ambito.launch(Dispatchers.IO) { runCatching { spectra.fineSessione() } }; voce.chiudi(); occhiali.chiudi(); ambito.cancel() }

    companion object {
        const val DOPO_LA_VOCE = 1500L      // DA TARARE: quanto aspettare prima di riaprire il microfono, perche' non senta la coda della propria voce
        val STRUMENTI: JSONArray = JSONArray()
            .put(JSONObject().put("nome", "stato_occhiali").put("descrizione", "Dice se gli occhiali sono collegati.")
                .put("schema", JSONObject().put("type", "object").put("properties", JSONObject())))
    }
}

/* ── 6. gli occhiali finti: per provare tutto senza hardware ── */
class OcchialiFinti(private val foto: ByteArray? = null) : Occhiali {
    private var tocco: (() -> Unit)? = null
    override val collegati = true
    override suspend fun scattaFoto(): ByteArray? = foto
    override fun preparaAudio() {}
    override fun alTocco(azione: () -> Unit) { tocco = azione }
    fun simulaTocco() { tocco?.invoke() }
    override fun chiudi() {}
}

/* ── 7. gli occhiali veri: L'UNICO punto che tocca il Device Access Toolkit ──────────────────────────
   Dipendenze (build.gradle.kts), dai moduli del toolkit:
       implementation("com.meta.wearable:mwdat-core:<versione>")
       implementation("com.meta.wearable:mwdat-camera:<versione>")
   Il flusso che il toolkit prevede, a parole (i nomi esatti sono DA VERIFICARE sul riferimento della versione usata):
     1. inizializzare il toolkit con il contesto dell'applicazione;
     2. far partire la REGISTRAZIONE: l'utente conferma nell'app Meta AI che questa app puo' usare gli occhiali;
     3. chiedere il PERMESSO della fotocamera degli occhiali (distinto da quello di Android);
     4. osservare i dispositivi collegati;
     5. aprire una SESSIONE DI STREAMING sulla fotocamera con una configurazione (risoluzione, fotogrammi al secondo),
        osservarne lo stato e, a sessione attiva, chiedere la CATTURA DI UNA FOTO (oppure prendere un fotogramma);
     6. chiudere la sessione appena la foto e' arrivata: la fotocamera non resta accesa.
   L'audio non passa dal toolkit: microfoni e altoparlanti degli occhiali sono un dispositivo Bluetooth (profilo per le
   chiamate), e Android li usa quando l'app chiede la comunicazione vocale. */
class OcchialiMeta(private val ctx: Context) : Occhiali {
    override val collegati: Boolean get() = TODO("DA VERIFICARE: stato del dispositivo dal selettore dei dispositivi del toolkit")

    override suspend fun scattaFoto(): ByteArray? {
        // DA VERIFICARE, in quest'ordine: permesso della fotocamera concesso → sessione di streaming aperta con la configurazione
        // a bassa risoluzione → attesa dello stato «in streaming» → cattura della foto in JPEG → chiusura della sessione.
        // Qualunque passo fallisca, si restituisce null: Spectra risponde senza vedere e lo dice.
        TODO("collegare al modulo mwdat-camera della versione installata")
    }

    override fun preparaAudio() {
        val am = ctx.getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
        am.mode = android.media.AudioManager.MODE_IN_COMMUNICATION        // instrada microfono e altoparlanti sul dispositivo Bluetooth attivo
    }

    override fun alTocco(azione: () -> Unit) {
        // DA VERIFICARE: se la versione del toolkit espone i gesti della stanghetta, registrarsi li'.
        // Altrimenti il tocco arriva come pulsante multimediale Bluetooth (MediaSession) oppure dal pulsante dell'app.
        TODO("registrare il gesto, oppure una MediaSession che riceve il pulsante «riproduci/pausa»")
    }

    override fun chiudi() {}
}
