import { useEffect, useRef, useState } from 'react';
import { centsToInput } from '../../i18n/formatting';
import { parseMoneyInput, validateAmountCents } from '../../features/transactions/money';
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
  const [focused, setFocused] = useState<'fare' | 'received' | null>(null);
  const [changeAsTip, setChangeAsTip] = useState(
    initialValues?.changeAsTip ?? false,
  );
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
  const validFare =
    fareParsed.status === 'valid' &&
    validateAmountCents(fareParsed.cents, 'fare') === null;
  const payment =
    fareParsed.status === 'valid' && receivedParsed.status === 'valid'
      ? calculatePayment({
          fareAmountCents: fareParsed.cents,
          cashReceivedCents: receivedParsed.cents,
          changeAsTip,
        })
      : null;
  const canTip =
    payment?.status === 'valid' &&
    (payment.changeGivenCents > 0 || payment.tipCents > 0);
  function changeField(field: 'fare' | 'received', raw: string) {
    if (busy.current) {
      return;
    }
    dirty.current = true;
    committedDraft.current = false;
    (field === 'fare' ? setFare : setReceived)(raw);
    setChangeAsTip(false);
    setFailed(false);
    setSaved(null);
  }
  function blur(field: 'fare' | 'received') {
    // Native blur may arrive after commit with the previous render's raw value.
    if (renderedSaveCount !== completedSaves.current) {
      return;
    }
    setFocused(current => (current === field ? null : current));
    // Use the latest draft: an older native callback may follow a quick-value tap.
    (field === 'fare' ? setFare : setReceived)(raw => {
      const parsed = parseMoneyInput(raw, 'blurred');
      return parsed.status === 'valid' ? centsToInput(parsed.cents) : raw;
    });
  }
  function quick(cents?: number) {
    if (busy.current || !validFare || fareParsed.status !== 'valid') {
      return;
    }
    const amounts = {
      fareAmountCents: fareParsed.cents,
      cashReceivedCents:
        receivedParsed.status === 'valid' ? receivedParsed.cents : 0,
      changeAsTip,
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
      receivedParsed.status !== 'valid'
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
      changeAsTip,
    };
    try {
      const committed = await onSubmit(input);
      committedDraft.current = !clearAfterSave;
      completedSaves.current++;
      if (mounted.current) {
        setSaved(committed);
        setFare(clearAfterSave ? '' : centsToInput(committed.fareAmountCents));
        setReceived(
          clearAfterSave ? '' : centsToInput(committed.cashReceivedCents),
        );
        setChangeAsTip(!clearAfterSave && committed.tipCents > 0);
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
    fareParsed,
    receivedParsed,
    validFare,
    payment,
    canTip,
    changeAsTip,
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
    toggleTip: (enabled: boolean) => {
      if (!busy.current && canTip) {
        committedDraft.current = false;
        dirty.current = true;
        setChangeAsTip(enabled);
        setFailed(false);
        setSaved(null);
      }
    },
  };
}
