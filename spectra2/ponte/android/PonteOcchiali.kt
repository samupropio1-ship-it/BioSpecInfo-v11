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
     riservatezza, e il LED di registrazione degli occhiali si accende. La
     parola di attivazione «Hey Meta» resta dell'assistente di Meta: Spectra si
     attiva con un tocco sulla stanghetta o da questa app.
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
        val corpo = JSONObject().put("testo", testo).put("sessione", "occhiali").put("canale", "occhiali").put("audio", true)
            .put("contesto", JSONObject(contesto))
        if (foto != null) corpo.put("immagini", JSONArray().put(JSONObject().put("mime", "image/jpeg").put("b64", Base64.encodeToString(foto, Base64.NO_WRAP))))
        return chiama("POST", "/turno", corpo)
    }

    fun iniziativa(): String? = chiama("GET", "/iniziativa?sessione=occhiali").optString("frase").takeIf { it.isNotBlank() && it != "null" }
    fun registraStrumenti(strumenti: JSONArray) = chiama("POST", "/strumenti/registra", JSONObject().put("client", "occhiali").put("strumenti", strumenti))
    fun attendiChiamata(): JSONObject? = chiama("GET", "/strumenti/attesa?client=occhiali&attesa=20").optJSONObject("chiamata")
    fun esito(id: String, esito: String) = chiama("POST", "/strumenti/esito", JSONObject().put("id", id).put("esito", esito))
    fun fineSessione() = chiama("POST", "/sessione/fine", JSONObject().put("sessione", "occhiali"))
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

/* ── 5. il ponte: il ciclo che tiene tutto insieme ── */
class PonteOcchiali(ctx: Context, private val occhiali: Occhiali, private val spectra: ClientSpectra) {
    private val ambito = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val voce = VoceTelefono(ctx)
    private val ascolto = Ascolto(ctx)
    private var occupato = false

    /** Le parole che dicono a Spectra di guardare: allora, e solo allora, parte una foto. */
    private val GUARDA = Regex("\\b(guarda|cosa (vedi|sto guardando|c'è)|che (cos'è|molecola|spettro|reagente)|leggi|questo|questa|qui)\\b", RegexOption.IGNORE_CASE)

    fun avvia() {
        occhiali.preparaAudio()
        occhiali.alTocco { ambito.launch { conversa() } }
        ambito.launch(Dispatchers.IO) { runCatching { spectra.registraStrumenti(STRUMENTI) }; serviStrumenti() }
        ambito.launch { iniziativa() }
    }

    /** Un turno a voce: ascolta, decide se serve la foto, chiede a Spectra, dice la risposta. */
    private suspend fun conversa() {
        if (occupato) { voce.ferma(); occupato = false; return }      // un secondo tocco mentre parla: lo zittisce
        occupato = true
        try {
            val detto = ascolto.ascolta()?.trim().orEmpty()
            if (detto.isEmpty()) return
            val foto = if (GUARDA.containsMatchIn(detto) && occhiali.collegati) occhiali.scattaFoto() else null
            val r = withContext(Dispatchers.IO) { spectra.turno(detto, foto, mapOf("dispositivo" to "Ray-Ban Meta", "foto" to (if (foto != null) "sì" else "no"))) }
            voce.di(r.optString("voce"), r.optJSONObject("audio")?.optString("b64"))
        } catch (e: Exception) {
            voce.di("Non riesco a raggiungere il mio cervello. Riprova fra poco.", null)
        } finally { occupato = false }
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

    /** Ogni dieci minuti chiede a Spectra se ha qualcosa che vale un'interruzione. Quasi sempre la risposta e' no. */
    private suspend fun iniziativa() {
        while (ambito.isActive) {
            delay(10 * 60_000L)
            if (occupato || !occhiali.collegati) continue
            val frase = runCatching { withContext(Dispatchers.IO) { spectra.iniziativa() } }.getOrNull() ?: continue
            voce.di(frase, null)
        }
    }

    fun chiudi() { ambito.launch(Dispatchers.IO) { runCatching { spectra.fineSessione() } }; voce.chiudi(); occhiali.chiudi(); ambito.cancel() }

    companion object {
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
