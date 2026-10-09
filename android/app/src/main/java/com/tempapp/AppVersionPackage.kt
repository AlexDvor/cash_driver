package com.tempapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.uimanager.ViewManager

class AppVersionModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "CashDriverAppVersion"
  override fun getConstants(): Map<String, Any> = mapOf(
    "version" to BuildConfig.VERSION_NAME,
    "build" to BuildConfig.VERSION_CODE.toString(),
  )
}

class AppVersionPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(AppVersionModule(context), SystemBarsModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
