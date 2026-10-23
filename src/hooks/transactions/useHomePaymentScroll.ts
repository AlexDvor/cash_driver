import { paymentTiming } from '../../constants/timing';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  AccessibilityInfo,
  AppState,
  Keyboard,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { spacing } from '../../constants/theme/tokens';

type Field = 'fare' | 'received' | 'tip';

export function useHomePaymentScroll({
  fare,
  validFare,
  received,
  validReceived,
  saving,
  automaticEntry = true,
}: {
  fare: string;
  validFare: boolean;
  received: string;
  validReceived: boolean;
  saving: boolean;
  automaticEntry?: boolean;
}) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const contentRef = useRef<ComponentRef<typeof View>>(null);
  const fareRef = useRef<ComponentRef<typeof View>>(null);
  const receivedRef = useRef<ComponentRef<typeof View>>(null);
  const tipRef = useRef<ComponentRef<typeof View>>(null);
  const receivedInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const focused = useRef<Field | null>(null);
  const requested = useRef<Field | null>(null);
  const tipFrame = useRef<number | null>(null);
  const visible = useRef(Keyboard.isVisible());
  const active = useRef(AppState.currentState === 'active');
  const onScreen = useRef(false);
  const reduced = useRef(true);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [edit, setEdit] = useState(0);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const needsLayoutScroll = useRef(false);
  const endAfterHide = useRef(false);
  const quickEntry = useRef(false);
  const pendingEndScroll = useRef(false);
  const endFrame = useRef<number | null>(null);
  const latest = useRef({ validFare, validReceived, received, saving });
  latest.current = { validFare, validReceived, received, saving };

  const cancel = useCallback(() => {
    requested.current = null;
    if (tipFrame.current !== null) cancelAnimationFrame(tipFrame.current);
    tipFrame.current = null;
    quickEntry.current = false;
    endAfterHide.current = false;
    pendingEndScroll.current = false;
    if (endFrame.current !== null) cancelAnimationFrame(endFrame.current);
    endFrame.current = null;
    needsLayoutScroll.current = false;
    generation.current += 1;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const finishEndScroll = useCallback(() => {
    if (
      !pendingEndScroll.current ||
      !onScreen.current ||
      !active.current ||
      visible.current
    )
      return;
    pendingEndScroll.current = false;
    scrollRef.current?.scrollToEnd({ animated: !reduced.current });
  }, []);

  const scrollToField = useCallback((field: Field) => {
    const group =
      field === 'fare'
        ? fareRef.current
        : field === 'received'
        ? receivedRef.current
        : tipRef.current;
    const content = contentRef.current;
    if (!group || !content || !onScreen.current || !active.current) return;
    const request = ++generation.current;
    group.measureLayout(
      content,
      (_x, y) => {
        if (
          request !== generation.current ||
          !onScreen.current ||
          !active.current ||
          (focused.current !== field && requested.current !== field)
        )
          return;
        // ScreenContainer has xl top padding; keep the field label lg below its viewport.
        scrollRef.current?.scrollTo({
          y: Math.max(0, y + spacing.xl - spacing.lg),
          animated: !reduced.current,
        });
      },
      () => {},
    );
  }, []);

  const positionSection = useCallback(() => {
    const field = requested.current;
    if (field === 'tip' || field === 'received') scrollToField(field);
  }, [scrollToField]);

  const openTip = useCallback(() => {
    cancel();
    setEdit(0);
    requested.current = 'tip';
    tipFrame.current = requestAnimationFrame(() => {
      tipFrame.current = null;
      positionSection();
    });
  }, [cancel, positionSection]);

  const closedTip = useCallback(
    (returnToReceived = true) => {
      cancel();
      if (!returnToReceived) {
        return;
      }
      requested.current = 'received';
      tipFrame.current = requestAnimationFrame(() => {
        tipFrame.current = null;
        positionSection();
      });
    },
    [cancel, positionSection],
  );

  useFocusEffect(
    useCallback(() => {
      onScreen.current = true;
      return () => {
        onScreen.current = false;
        focused.current = null;
        cancel();
      };
    }, [cancel]),
  );

  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        preferenceChanged = true;
        reduced.current = enabled;
      },
    );
    AccessibilityInfo.isReduceMotionEnabled().then(
      enabled => {
        if (mounted && !preferenceChanged) reduced.current = enabled;
      },
      () => {},
    );
    const show = Keyboard.addListener('keyboardDidShow', event => {
      visible.current = true;
      if (focused.current) scrollToField(focused.current);
      const request = generation.current;
      scrollRef.current?.measureInWindow?.((_x, y, _width, height) => {
        if (
          !mounted ||
          !visible.current ||
          !onScreen.current ||
          !active.current
        )
          return;
        // Android edge-to-edge may overlay rather than resize this viewport.
        const overlap = Math.max(0, y + height - event.endCoordinates.screenY);
        setKeyboardInset(overlap);
        if (request === generation.current && focused.current) {
          needsLayoutScroll.current = overlap > 0;
          scrollToField(focused.current);
        }
      });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      const finish = endAfterHide.current;
      visible.current = false;
      setKeyboardInset(0);
      cancel();
      if (finish && onScreen.current && active.current) {
        pendingEndScroll.current = true;
        endFrame.current = requestAnimationFrame(() => {
          endFrame.current = null;
          finishEndScroll();
        });
      }
    });
    const app = AppState.addEventListener('change', state => {
      active.current = state === 'active';
      if (!active.current) cancel();
    });
    return () => {
      mounted = false;
      cancel();
      motion.remove();
      show.remove();
      hide.remove();
      app.remove();
    };
  }, [cancel, scrollToField, finishEndScroll]);

  useEffect(() => {
    if (
      !automaticEntry ||
      !edit ||
      saving ||
      !onScreen.current ||
      !active.current
    )
      return;
    const fromQuick = quickEntry.current;
    const field = fromQuick ? 'received' : focused.current;
    if (
      field === 'fare'
        ? !validFare || received !== ''
        : field !== 'received' || !validReceived
    )
      return;
    const timeout = setTimeout(
      () => {
        timer.current = null;
        if (
          !onScreen.current ||
          !active.current ||
          (fromQuick ? !quickEntry.current : focused.current !== field) ||
          latest.current.saving
        )
          return;
        if (field === 'fare') {
          if (
            visible.current &&
            latest.current.validFare &&
            latest.current.received === ''
          )
            receivedInputRef.current?.focus();
        } else if (latest.current.validReceived) {
          if (visible.current) {
            endAfterHide.current = true;
            Keyboard.dismiss();
          } else {
            pendingEndScroll.current = true;
            finishEndScroll();
          }
        }
      },
      field === 'fare'
        ? paymentTiming.fareAdvanceDelayMs
        : paymentTiming.receivedDismissDelayMs,
    );
    timer.current = timeout;
    return () => {
      clearTimeout(timeout);
      if (timer.current === timeout) timer.current = null;
    };
  }, [
    automaticEntry,
    fare,
    edit,
    validFare,
    received,
    validReceived,
    saving,
    finishEndScroll,
  ]);

  function focus(field: Field) {
    cancel();
    focused.current = field;
    needsLayoutScroll.current = true;
    setEdit(0);
    scrollToField(field);
  }
  function blur(field: Field) {
    if (focused.current !== field) return;
    focused.current = null;
    // Keyboard.dismiss blurs the field before its keyboardDidHide event arrives.
    if (quickEntry.current || endAfterHide.current || pendingEndScroll.current)
      return;
    cancel();
  }
  function changedFare() {
    cancel();
    setEdit(count => count + 1);
  }
  function changedReceived() {
    cancel();
    setEdit(count => count + 1);
  }
  function quickReceived() {
    cancel();
    quickEntry.current = true;
    setEdit(count => count + 1);
  }
  function contentResized() {
    finishEndScroll();
    if (requested.current === 'tip' || requested.current === 'received') {
      positionSection();
      return;
    }
    if (needsLayoutScroll.current && visible.current && focused.current) {
      needsLayoutScroll.current = false;
      scrollToField(focused.current);
    }
  }

  return {
    scrollRef,
    contentRef,
    fareRef,
    receivedRef,
    tipRef,
    receivedInputRef,
    focus,
    blur,
    changedFare,
    changedReceived,
    quickReceived,
    cancel,
    keyboardInset,
    openTip,
    closedTip,
    contentResized,
  };
}
