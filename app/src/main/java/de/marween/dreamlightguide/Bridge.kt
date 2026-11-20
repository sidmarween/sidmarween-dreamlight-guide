package de.marween.dreamlightguide

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.net.Uri
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.TranslateRemoteModel
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Schnittstelle zwischen Oberfläche (JavaScript) und Android.
 * Alle Methoden antworten asynchron über MainActivity.resolve(id, …).
 */
class Bridge(private val activity: MainActivity) {

    private val ctx: Context = activity.applicationContext
    private val net = Executors.newFixedThreadPool(4)
    private val trExec = Executors.newSingleThreadExecutor()
    private val cacheDir = File(ctx.filesDir, "wiki-cache").apply { mkdirs() }
    private val db = TranslationDb(ctx)
    private val userAgent: String by lazy { WebSettings.getDefaultUserAgent(ctx) }

    private var enDe: Translator? = null
    private var deEn: Translator? = null

    fun close() {
        net.shutdownNow()
        trExec.shutdownNow()
        enDe?.close()
        deEn?.close()
        db.close()
    }

    // ---------------------------------------------------------------- Netzwerk

    /**
     * Lädt eine Wiki-API-Adresse. Antworten werden gespeichert; ist das Netz weg
     * oder blockiert, kommt die gespeicherte Fassung zurück.
     * maxAgeSec > 0: gespeicherte Fassung, die jünger ist, wird direkt genutzt.
     */
    @JavascriptInterface
    fun fetch(id: String, url: String, maxAgeSec: Int) {
        net.execute {
            val out = JSONObject()
            try {
                val host = Uri.parse(url).host ?: ""
                if (!ALLOWED_HOSTS.contains(host)) {
                    out.put("ok", false).put("status", 0).put("error", "Adresse nicht erlaubt")
                    activity.resolve(id, out); return@execute
                }
                val file = File(cacheDir, sha1(url))
                val age = if (file.exists()) (System.currentTimeMillis() - file.lastModified()) / 1000 else Long.MAX_VALUE

                if (maxAgeSec > 0 && age < maxAgeSec) {
                    out.put("ok", true).put("body", file.readText()).put("cached", true).put("savedAt", file.lastModified())
                    activity.resolve(id, out); return@execute
                }

                var status = 0
                var body = ""
                var challenge = false
                try {
                    val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                        connectTimeout = 12000
                        readTimeout = 20000
                        instanceFollowRedirects = true
                        setRequestProperty("User-Agent", userAgent)
                        setRequestProperty("Accept", "application/json, text/plain, */*")
                        setRequestProperty("Accept-Language", "de-DE,de;q=0.9,en;q=0.8")
                        CookieManager.getInstance().getCookie(url)?.let { setRequestProperty("Cookie", it) }
                    }
                    status = conn.responseCode
                    conn.headerFields["Set-Cookie"]?.forEach { CookieManager.getInstance().setCookie(url, it) }
                    val stream = if (status in 200..299) conn.inputStream else conn.errorStream
                    body = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
                    challenge = conn.getHeaderField("cf-mitigated") != null ||
                        body.contains("Just a moment") || body.contains("challenge-platform")
                    conn.disconnect()
                } catch (e: Exception) {
                    out.put("error", e.javaClass.simpleName + ": " + (e.message ?: ""))
                }

                val looksJson = body.trimStart().startsWith("{")
                if (status in 200..299 && looksJson && !challenge) {
                    try { file.writeText(body) } catch (_: Exception) {}
                    out.put("ok", true).put("body", body).put("cached", false)
                } else if (file.exists()) {
                    out.put("ok", true).put("body", file.readText()).put("cached", true)
                        .put("savedAt", file.lastModified()).put("status", status).put("challenge", challenge)
                } else {
                    out.put("ok", false).put("status", status).put("challenge", challenge)
                }
            } catch (e: Exception) {
                out.put("ok", false).put("status", 0).put("error", e.message ?: "Fehler")
            }
            activity.resolve(id, out)
        }
    }

    @JavascriptInterface
    fun cacheInfo(id: String) {
        net.execute {
            val files = cacheDir.listFiles() ?: emptyArray()
            val bytes = files.sumOf { it.length() }
            activity.resolve(id, JSONObject().put("ok", true).put("count", files.size).put("bytes", bytes)
                .put("translations", db.count()))
        }
    }

    @JavascriptInterface
    fun clearCache(id: String) {
        net.execute {
            cacheDir.listFiles()?.forEach { it.delete() }
            activity.resolve(id, JSONObject().put("ok", true))
        }
    }

    @JavascriptInterface
    fun clearTranslations(id: String) {
        trExec.execute {
            db.clear()
            activity.resolve(id, JSONObject().put("ok", true))
        }
    }

    // ---------------------------------------------------------------- Übersetzung

    private fun translator(dir: String): Translator {
        return if (dir == "de-en") {
            deEn ?: Translation.getClient(
                TranslatorOptions.Builder()
                    .setSourceLanguage(TranslateLanguage.GERMAN)
                    .setTargetLanguage(TranslateLanguage.ENGLISH).build()
            ).also { deEn = it }
        } else {
            enDe ?: Translation.getClient(
                TranslatorOptions.Builder()
                    .setSourceLanguage(TranslateLanguage.ENGLISH)
                    .setTargetLanguage(TranslateLanguage.GERMAN).build()
            ).also { enDe = it }
        }
    }

    @JavascriptInterface
    fun modelStatus(id: String) {
        trExec.execute {
            val out = JSONObject()
            try {
                val model = TranslateRemoteModel.Builder(TranslateLanguage.GERMAN).build()
                val ready = Tasks.await(RemoteModelManager.getInstance().isModelDownloaded(model), 20, TimeUnit.SECONDS)
                out.put("ok", true).put("ready", ready)
            } catch (e: Exception) {
                out.put("ok", false).put("error", e.message ?: "Fehler")
            }
            activity.resolve(id, out)
        }
    }

    /** Lädt das deutsche Sprachpaket (ca. 30 MB) herunter, falls nötig. */
    @JavascriptInterface
    fun downloadModel(id: String) {
        trExec.execute {
            val out = JSONObject()
            try {
                Tasks.await(translator("en-de").downloadModelIfNeeded(DownloadConditions.Builder().build()), 10, TimeUnit.MINUTES)
                Tasks.await(translator("de-en").downloadModelIfNeeded(DownloadConditions.Builder().build()), 10, TimeUnit.MINUTES)
                out.put("ok", true)
            } catch (e: Exception) {
                out.put("ok", false).put("error", e.message ?: "Download fehlgeschlagen")
            }
            activity.resolve(id, out)
        }
    }

    /**
     * Übersetzt eine Liste von Texten. dir = "en-de" oder "de-en".
     * Ergebnisse werden gespeichert, damit wiederholte Texte sofort da sind.
     */
    @JavascriptInterface
    fun translate(id: String, jsonTexts: String, dir: String) {
        trExec.execute {
            val out = JSONObject()
            try {
                val texts = JSONArray(jsonTexts)
                val result = JSONArray()
                val tr = translator(dir)
                var modelReady = false
                for (i in 0 until texts.length()) {
                    val src = texts.optString(i)
                    val cached = db.get(dir, src)
                    if (cached != null) { result.put(cached); continue }
                    if (!modelReady) {
                        Tasks.await(tr.downloadModelIfNeeded(DownloadConditions.Builder().build()), 10, TimeUnit.MINUTES)
                        modelReady = true
                    }
                    val dst = try {
                        Tasks.await(tr.translate(src), 30, TimeUnit.SECONDS)
                    } catch (_: Exception) { src }
                    db.put(dir, src, dst)
                    result.put(dst)
                }
                out.put("ok", true).put("texts", result)
            } catch (e: Exception) {
                out.put("ok", false).put("error", e.message ?: "Übersetzung fehlgeschlagen")
            }
            activity.resolve(id, out)
        }
    }

    // ---------------------------------------------------------------- Sonstiges

    @JavascriptInterface
    fun openVerification() {
        activity.runOnUiThread {
            activity.startActivity(Intent(activity, VerifyActivity::class.java))
        }
    }

    @JavascriptInterface
    fun openExternal(url: String) {
        activity.runOnUiThread { activity.openExternal(url) }
    }

    @JavascriptInterface
    fun appVersion(): String = BuildConfig.VERSION_NAME

    private fun sha1(s: String): String =
        MessageDigest.getInstance("SHA-1").digest(s.toByteArray()).joinToString("") { "%02x".format(it) }

    companion object {
        val ALLOWED_HOSTS = setOf("dreamlightvalleywiki.com", "www.dreamlightvalleywiki.com")
    }
}

/** Kleiner Speicher für bereits übersetzte Texte. */
class TranslationDb(ctx: Context) : SQLiteOpenHelper(ctx, "translations.db", null, 1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE tr (dir TEXT NOT NULL, src TEXT NOT NULL, dst TEXT NOT NULL, PRIMARY KEY(dir, src))")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {}

    fun get(dir: String, src: String): String? =
        readableDatabase.rawQuery("SELECT dst FROM tr WHERE dir=? AND src=?", arrayOf(dir, src)).use {
            if (it.moveToFirst()) it.getString(0) else null
        }

    fun put(dir: String, src: String, dst: String) {
        writableDatabase.insertWithOnConflict("tr", null, ContentValues().apply {
            put("dir", dir); put("src", src); put("dst", dst)
        }, SQLiteDatabase.CONFLICT_REPLACE)
    }

    fun count(): Long =
        readableDatabase.rawQuery("SELECT COUNT(*) FROM tr", null).use { if (it.moveToFirst()) it.getLong(0) else 0 }

    fun clear() {
        writableDatabase.delete("tr", null, null)
    }
}
