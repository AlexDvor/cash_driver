import { useEffect, useRef, useState } from 'react';
import { centsToInput } from '../../i18n/formatting';
import {
  MoneyParseResult,
  parseMoneyInput,
  validateAmountCents,
} from '../../features/transactions/money';
import {
  applyExactAmount,
  applyQuickAmount,
  calculatePayment,
  getQuickAmounts,
} from '../../features/transactions/payment';
import { CashTransaction, Platform } from '../../features/transactions/types';
import { TransactionInput } from '../../features/transactions/transactionService';

interface PaymentFormOptions {
  initialPlatform: Platform;
  initialValues?: TransactionInput;
  clearAfterSave?: boolean;
  onSubmit: (input: TransactionInput) => Promise<CashTransaction>;
  onPlatformChange?: (platform: Platform) => Promise<boolean>;
}

export function usePaymentForm({
  initialPlatform,
  initialValues,
  clearAfterSave = true,
  onSubmit,
  onPlatformChange,
}: PaymentFormOptions) {
  const [platform, setPlatform] = useState(
    initialValues?.platform ?? initialPlatform,
  );
  const [fare, setFare] = useState(
    initialValues ? centsToInput(initialValues.fareAmountCents) : '',
  );
  const [received, setReceived] = useState(
    initialValues ? centsToInput(initialValues.cashReceivedCents) : '',
  );
  const [focused, setFocused] = useState<'fare' | 'received' | 'tip' | null>(
    null,
  );
  const [tip, setTip] = useState(
    initialValues?.tipCents ? centsToInput(initialValues.tipCents) : '',
  );
  const [tipExpanded, setTipExpanded] = useState(
    (initialValues?.tipCents ?? 0) > 0,
  );
  const latestTip = useRef(tip);
  latestTip.current = tip;
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState<CashTransaction | null>(null);
  const busy = useRef(false);
  const committedDraft = useRef(false);
  const completedSaves = useRef(0);
  const renderedSaveCount = completedSaves.current;
  const choosing = useRef(false);
  const dirty = useRef(initialValues !== undefined);
  const mounted = useRef(false);
  const latestDefault = useRef(initialPlatform);
  latestDefault.current = initialPlatform;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!dirty.current) {
      setPlatform(initialPlatform);
    }
  }, [initialPlatform]);
  useEffect(() => {
    if (!saved) {
      return;
    }
    const timeout = setTimeout(() => setSaved(null), 4000);
    return () => clearTimeout(timeout);
  }, [saved]);
  const fareParsed = parseMoneyInput(
    fare,
    focused === 'fare' ? 'editing' : 'blurred',
  );
  const receivedParsed = parseMoneyInput(
    received,
    focused === 'received' ? 'editing' : 'blurred',
  );
  const tipParsed: MoneyParseResult =
    tip.trim() === ''
      ? { status: 'valid', cents: 0 }
      : parseMoneyInput(tip, focused === 'tip' ? 'editing' : 'blurred');
  const validFare =
    fareParsed.status === 'valid' &&
    validateAmountCents(fareParsed.cents, 'fare') === null;
  const basePayment =
    fareParsed.status === 'valid' && receivedParsed.status === 'valid'
      ? calculatePayment({
          fareAmountCents: fareParsed.cents,
          cashReceivedCents: receivedParsed.cents,
          tipCents: 0,
        })
      : null;
  const availableChangeCents =
    basePayment?.status === 'valid' ? basePayment.changeGivenCents : null;
  const latestAvailableChange = useRef(availableChangeCents);
  latestAvailableChange.current = availableChangeCents;
  // Preserve insufficient-cash feedback even when the optional tip is invalid.
  let payment = basePayment;
  if (basePayment?.status !== 'insufficient') {
    payment = null;
    if (
      fareParsed.status === 'valid' &&
      receivedParsed.status === 'valid' &&
      tipParsed.status === 'valid'
    ) {
      payment = calculatePayment({
        fareAmountCents: fareParsed.cents,
        cashReceivedCents: receivedParsed.cents,
        tipCents: tipParsed.cents,
      });
    }
  }
  const fieldSetters = { fare: setFare, received: setReceived, tip: setTip };
  function changeField(field: 'fare' | 'received' | 'tip', raw: string) {
    if (busy.current) {
      return;
    }
    dirty.current = true;
    committedDraft.current = false;
    fieldSetters[field](raw);
    if (field === 'tip') {
      latestTip.current = raw;
    }
    if (field !== 'tip') {
      latestTip.current = '';
      setTip('');
    }
    setFailed(false);
    setSaved(null);
  }
  function blur(field: 'fare' | 'received' | 'tip') {
    // Native blur may arrive after commit with the previous render's raw value.
    if (renderedSaveCount !== completedSaves.current) {
      return;
    }
    setFocused(current => (current === field ? null : current));
    // Use the latest draft: an older native callback may follow a quick-value tap.
    fieldSetters[field](raw => {
      const parsed = parseMoneyInput(raw, 'blurred');
      return parsed.status === 'valid' ? centsToInput(parsed.cents) : raw;
    });
  }
  function canChangeTipSection() {
    return (
      mounted.current &&
      !busy.current &&
      renderedSaveCount === completedSaves.current
    );
  }
  function expandTip() {
    if (canChangeTipSection()) {
      setTipExpanded(true);
    }
  }
  function collapseTip(): boolean {
    if (!canChangeTipSection()) {
      return false;
    }
    // Collapse finishes editing, but never silently accepts a malformed tip.
    // Check T separately: insufficient cash intentionally masks payment errors.
    const parsed: MoneyParseResult =
      latestTip.current.trim() === ''
        ? { status: 'valid', cents: 0 }
        : parseMoneyInput(latestTip.current, 'blurred');
    if (
      parsed.status !== 'valid' ||
      (latestAvailableChange.current !== null &&
        parsed.cents > latestAvailableChange.current)
    ) {
      return false;
    }
    blur('tip');
    setTipExpanded(false);
    return true;
  }
  function removeTip() {
    if (!canChangeTipSection()) {
      return;
    }
    changeField('tip', '');
    setFocused(current => (current === 'tip' ? null : current));
    setTipExpanded(false);
  }
  function quick(cents?: number) {
    if (busy.current || !validFare || fareParsed.status !== 'valid') {
      return;
    }
    const amounts = {
      fareAmountCents: fareParsed.cents,
      cashReceivedCents:
        receivedParsed.status === 'valid' ? receivedParsed.cents : 0,
      tipCents: tipParsed.status === 'valid' ? tipParsed.cents : 0,
    };
    const next =
      cents === undefined
        ? applyExactAmount(amounts)
        : applyQuickAmount(amounts, cents);
    if (next) {
      changeField('received', centsToInput(next.cashReceivedCents));
    }
  }
  async function choosePlatform(next: Platform) {
    if (busy.current || choosing.current) {
      return;
    }
    choosing.current = true;
    try {
      const success = onPlatformChange ? await onPlatformChange(next) : true;
      if (success && mounted.current) {
        committedDraft.current = false;
        dirty.current = true;
        setPlatform(next);
        setFailed(false);
        setSaved(null);
      }
    } finally {
      choosing.current = false;
    }
  }
  async function submit(): Promise<boolean> {
    if (
      busy.current ||
      (!clearAfterSave && committedDraft.current) ||
      choosing.current ||
      payment?.status !== 'valid' ||
      fareParsed.status !== 'valid' ||
      receivedParsed.status !== 'valid' ||
      tipParsed.status !== 'valid'
    ) {
      return false;
    }
    busy.current = true;
    setSaving(true);
    setFailed(false);
    setSaved(null);
    const input = {
      platform,
      fareAmountCents: fareParsed.cents,
      cashReceivedCents: receivedParsed.cents,
      tipCents: tipParsed.cents,
    };
    try {
      const committed = await onSubmit(input);
      committedDraft.current = !clearAfterSave;
      completedSaves.current++;
      if (mounted.current) {
        latestTip.current =
          clearAfterSave || committed.tipCents === 0
            ? ''
            : centsToInput(committed.tipCents);
        if (clearAfterSave) {
          setTipExpanded(false);
        }
        setSaved(committed);
        setFare(clearAfterSave ? '' : centsToInput(committed.fareAmountCents));
        setReceived(
          clearAfterSave ? '' : centsToInput(committed.cashReceivedCents),
        );
        setTip(
          clearAfterSave || committed.tipCents === 0
            ? ''
            : centsToInput(committed.tipCents),
        );
        setFocused(null);
        dirty.current = !clearAfterSave;
        setPlatform(
          clearAfterSave ? latestDefault.current : committed.platform,
        );
      }
      return true;
    } catch {
      if (mounted.current) {
        setFailed(true);
      }
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) {
        setSaving(false);
      }
    }
  }
  return {
    platform,
    fare,
    received,
    tip,
    tipExpanded,
    // UI can distinguish instant successful-create reset from user collapse.
    tipResetCount: clearAfterSave ? completedSaves.current : 0,
    fareParsed,
    receivedParsed,
    tipParsed,
    validFare,
    payment,
    availableChangeCents,
    saving,
    failed,
    saved,
    canConfirm:
      payment?.status === 'valid' && !saving && !committedDraft.current,
    quickAmounts:
      validFare && fareParsed.status === 'valid'
        ? getQuickAmounts(fareParsed.cents)
        : [],
    changeField,
    blur,
    focus: setFocused,
    quick,
    choosePlatform,
    submit,
    expandTip,
    collapseTip,
    removeTip,
    clearTip: () => changeField('tip', ''),
    allChangeAsTip: () => {
      if (availableChangeCents !== null && availableChangeCents > 0) {
        changeField('tip', centsToInput(availableChangeCents));
      }
    },
  };
}
