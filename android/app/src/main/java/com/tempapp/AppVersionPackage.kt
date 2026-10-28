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
    "applicationId" to BuildConfig.APPLICATION_ID,
  )
}

class AppVersionPackage : ReactPackage {
  @Deprecated("Legacy ReactPackage registration required by React Native")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = listOf(AppVersionModule(reactContext), SystemBarsModule(reactContext), ConfirmationSoundModule(reactContext))
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = listOf(CalendarPageHostManager())
}
