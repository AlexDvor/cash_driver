package com.tempapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(AppVersionPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Brand font family: res/font/inter.xml maps fontWeight 400/500/600/700 to Inter files.
    ReactFontManager.getInstance().addCustomFont(this, "Inter", R.font.inter)
    loadReactNative(this)
  }
}
