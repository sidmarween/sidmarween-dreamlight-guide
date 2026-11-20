package de.marween.dreamlightguide

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Öffnet die Wiki-Seite in einem normalen Browserfenster, damit eine
 * eventuelle Sicherheitsprüfung (Cloudflare) einmal selbst bestätigt werden kann.
 * Danach kann die App das Wiki wieder abfragen.
 */
class VerifyActivity : Activity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#1A1033"))
        }

        val bar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(24, 16, 16, 16)
        }
        val info = TextView(this).apply {
            text = "Wiki öffnen und ggf. Prüfung bestätigen"
            setTextColor(Color.WHITE)
            textSize = 14f
        }
        val done = Button(this).apply {
            text = "Fertig"
            setOnClickListener { finish() }
        }
        bar.addView(info, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        bar.addView(done)

        web = WebView(this)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true)
        web.webViewClient = WebViewClient()
        web.loadUrl("https://dreamlightvalleywiki.com/api.php?action=query&meta=siteinfo&format=json")

        root.addView(bar, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        root.addView(web, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        setContentView(root)
    }

    override fun finish() {
        CookieManager.getInstance().flush()
        super.finish()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }
}
