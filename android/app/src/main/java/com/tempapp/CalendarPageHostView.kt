package com.tempapp

import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.views.scroll.ReactHorizontalScrollView
import com.facebook.react.views.view.ReactViewGroup

/** Preserves a settled outer calendar page across a native mounting transaction. */
@OptIn(UnstableReactNativeAPI::class)
class CalendarPageHostView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext), UIManagerListener, ViewTreeObserver.OnPreDrawListener {

  private data class Anchor(
    val scroll: ReactHorizontalScrollView,
    val content: ViewGroup,
    val page: View,
    val left: Int,
  )

  private var anchor: Anchor? = null
  private var uiManager: UIManager? = null

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    uiManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
    uiManager?.addUIManagerEventListener(this)
    viewTreeObserver.addOnPreDrawListener(this)
  }

  override fun onDetachedFromWindow() {
    uiManager?.removeUIManagerEventListener(this)
    uiManager = null
    if (viewTreeObserver.isAlive) viewTreeObserver.removeOnPreDrawListener(this)
    anchor = null
    super.onDetachedFromWindow()
  }

  private fun findPager(view: View): ReactHorizontalScrollView? {
    if (view is ReactHorizontalScrollView) return view
    if (view is ViewGroup) {
      for (index in 0 until view.childCount) {
        findPager(view.getChildAt(index))?.let { return it }
      }
    }
    return null
  }

  private fun captureAnchor() {
    if (!isAttachedToWindow || anchor != null) return
    val scroll = findPager(this) ?: return
    val content = scroll.getChildAt(0) as? ViewGroup ?: return
    if (scroll.width == 0 || content.childCount != 3) return
    val maxOffset = content.width - scroll.width
    val page = when {
      scroll.scrollX == 0 -> content.getChildAt(0)
      maxOffset > 0 && scroll.scrollX == maxOffset -> content.getChildAt(2)
      else -> return // Centered arrows/jumps and active intermediate drags are unchanged.
    }
    anchor = Anchor(scroll, content, page, page.left)
  }

  override fun onPreDraw(): Boolean {
    val pending = anchor
    anchor = null
    if (pending != null && pending.scroll.isAttachedToWindow &&
      pending.page.parent === pending.content &&
      pending.scroll.getChildAt(0) === pending.content) {
      val delta = pending.page.left - pending.left
      if (delta != 0) {
        // Mounting and layout are complete; display-list recording has not begun.
        // The same native page and its offset move together in this frame.
        pending.scroll.abortAnimation()
        val animator = pending.scroll.getFlingAnimator()
        if (animator.isRunning) animator.cancel()
        pending.scroll.scrollTo(pending.scroll.scrollX + delta, pending.scroll.scrollY)
        // Refresh the content display list after changing its viewport origin.
        pending.content.invalidate()
        pending.scroll.invalidate()
      }
    }
    return true
  }

  override fun willMountItems(uiManager: UIManager) = captureAnchor()
  override fun willDispatchViewUpdates(uiManager: UIManager) {
    runOnUiThread { captureAnchor() }
  }
  override fun didMountItems(uiManager: UIManager) = Unit
  override fun didDispatchMountItems(uiManager: UIManager) = Unit
  override fun didScheduleMountItems(uiManager: UIManager) = Unit
}

class CalendarPageHostManager : ViewGroupManager<CalendarPageHostView>() {
  override fun getName() = "CashDriverCalendarPageHost"
  override fun createViewInstance(context: ThemedReactContext) = CalendarPageHostView(context)
}
