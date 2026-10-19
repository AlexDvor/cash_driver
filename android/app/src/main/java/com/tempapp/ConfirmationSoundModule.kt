package com.tempapp

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.SoundPool
import android.os.SystemClock
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class ConfirmationSoundModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context), LifecycleEventListener {
  private var pool: SoundPool? = null
  private var sample = 0
  private var loaded = false
  private var requestedAt: Long? = null

  init { context.addLifecycleEventListener(this) }
  override fun getName() = "CashDriverConfirmationSound"

  private fun allowed(): Boolean {
    val audio = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    return context.currentActivity?.hasWindowFocus() == true &&
      audio.ringerMode == AudioManager.RINGER_MODE_NORMAL &&
      audio.getStreamVolume(AudioManager.STREAM_SYSTEM) > 0
  }

  @ReactMethod
  fun play() {
    UiThreadUtil.runOnUiThread {
      try {
        if (!allowed()) return@runOnUiThread
        if (loaded) {
          pool?.play(sample, 0.6f, 0.6f, 1, 0, 1f)
          return@runOnUiThread
        }
        requestedAt = SystemClock.elapsedRealtime()
        if (pool != null) return@runOnUiThread
        val player = SoundPool.Builder().setMaxStreams(1).setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
        ).build()
        pool = player
        player.setOnLoadCompleteListener { source, id, status ->
          try {
            if (pool !== source) return@setOnLoadCompleteListener
            loaded = status == 0
            val requested = requestedAt
            requestedAt = null
            if (loaded && requested != null &&
              SystemClock.elapsedRealtime() - requested <= 1000 && allowed()) {
              source.play(id, 0.6f, 0.6f, 1, 0, 1f)
            }
            if (!loaded) release()
          } catch (_: Exception) { release() }
        }
        sample = player.load(context, R.raw.payment_confirmation, 1)
        if (sample == 0) release()
      } catch (_: Exception) { release() }
    }
  }

  private fun release() {
    requestedAt = null
    loaded = false
    sample = 0
    pool?.release()
    pool = null
  }

  override fun onHostResume() = Unit
  override fun onHostPause() {
    requestedAt = null
    pool?.autoPause()
  }
  override fun onHostDestroy() { release() }
  override fun invalidate() {
    context.removeLifecycleEventListener(this)
    UiThreadUtil.runOnUiThread { release() }
    super.invalidate()
  }
}
