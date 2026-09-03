package com.nakulkundra.vakta

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.view.WindowManager
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var pendingPermissionRequest: PermissionRequest? = null
    private val AUDIO_PERMISSION_CODE = 1001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen awake while receiving acoustic packets
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Dark Mode status bar and navigation bar matching Liquid Glass void (#040711)
        window.statusBarColor = Color.parseColor("#040711")
        window.navigationBarColor = Color.parseColor("#040711")

        webView = WebView(this)
        setContentView(webView)

        setupWebView()
        checkAndRequestPermissions()
    }

    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // Dark background prevents white flash on initial render
        webView.setBackgroundColor(Color.parseColor("#040711"))

        // Host local web assets securely at https://appassets.androidplatform.net/assets/
        // Android WebView treats this as a Secure Context (HTTPS), enabling Web Audio & getUserMedia
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                // Grant microphone capture permission to the internal Web Audio engine
                if (hasAudioPermission()) {
                    request.grant(request.resources)
                } else {
                    pendingPermissionRequest = request
                    ActivityCompat.requestPermissions(
                        this@MainActivity,
                        arrayOf(Manifest.permission.RECORD_AUDIO),
                        AUDIO_PERMISSION_CODE
                    )
                }
            }
        }

        // Load Project Vakta via the secure asset loader
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }

    private fun hasAudioPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun checkAndRequestPermissions() {
        if (!hasAudioPermission()) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                AUDIO_PERMISSION_CODE
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == AUDIO_PERMISSION_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                pendingPermissionRequest?.grant(pendingPermissionRequest?.resources)
                pendingPermissionRequest = null
            } else {
                Toast.makeText(this, "Microphone permission is required to decode data over sound.", Toast.LENGTH_LONG).show()
                pendingPermissionRequest?.deny()
                pendingPermissionRequest = null
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
