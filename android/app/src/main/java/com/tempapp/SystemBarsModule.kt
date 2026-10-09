package com.tempapp

import android.graphics.Color
import android.os.Build
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SystemBarsModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "CashDriverSystemBars"

  @ReactMethod
  fun setAppearance(dark: Boolean, background: String) {
    reactApplicationContext.runOnUiQueueThread {
      val window = reactApplicationContext.currentActivity?.window ?: return@runOnUiQueueThread
      val color = if (Build.VERSION.SDK_INT < 26) Color.BLACK else Color.parseColor(background)
      window.decorView.setBackgroundColor(color)
      if (Build.VERSION.SDK_INT < 35) {
        window.navigationBarColor = color
      }
      if (Build.VERSION.SDK_INT >= 29) {
        // We supply the background and foreground together, including overrides.
        window.isNavigationBarContrastEnforced = false
      }
      WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightNavigationBars = !dark
    }
  }
}
