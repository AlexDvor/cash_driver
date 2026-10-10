import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { usePaymentForm } from '../src/hooks/transactions/usePaymentForm';
import { useCreatePayment } from '../src/hooks/transactions/useCreatePayment';
import { TransactionInput } from '../src/features/transactions/transactionService';
import { CashTransaction } from '../src/features/transactions/types';
import { openTestDatabase, testPersistence } from './sqliteTestDatabase';

const partial: TransactionInput = {
  platform: 'uber',
  fareAmountCents: 2000,
  cashReceivedCents: 5000,
  tipCents: 500,
};
function committed(input: TransactionInput): CashTransaction {
  return {
    ...input,
    id: 'test-operation',
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: null,
    changeGivenCents:
      input.cashReceivedCents - input.fareAmountCents - input.tipCents,
    netCashCents: input.fareAmountCents + input.tipCents,
  };
}
type Options = Parameters<typeof usePaymentForm>[0];
async function mount(options: Partial<Options> = {}) {
  let current: ReturnType<typeof usePaymentForm> | undefined;
  function form() {
    if (!current) {
      throw new Error('Form not mounted');
    }
    return current;
  }
  function Probe() {
    current = usePaymentForm({
      initialPlatform: 'uber',
      onSubmit: async input => committed(input),
      ...options,
    });
    return null;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<Probe />);
  });
  return {
    form,
    unmount: async () => {
      await act(async () => renderer.unmount());
    },
  };
}
async function draft(form: () => ReturnType<typeof usePaymentForm>, tip = '5') {
  await act(async () => {
    form().changeField('fare', '20');
    form().changeField('received', '50');
  });
  await act(async () => {
    form().expandTip();
    form().changeField('tip', tip);
  });
}

test.each([undefined, 0, 500])(
  'tip visibility initializes from the stored amount %s',
  async amount => {
    const probe = await mount(
      amount === undefined
        ? {}
        : {
            initialValues: { ...partial, tipCents: amount },
            clearAfterSave: false,
          },
    );
    try {
      expect(probe.form().tipExpanded).toBe(amount !== undefined && amount > 0);
    } finally {
      await probe.unmount();
    }
  },
);

test('collapse blurs a trailing separator, preserves exact amounts and optional zero', async () => {
  const probe = await mount();
  try {
    await draft(probe.form, '5,');
    await act(async () => probe.form().focus('tip'));
    expect(probe.form().canConfirm).toBe(false);
    await act(async () => {
      expect(probe.form().collapseTip()).toBe(true);
    });
    expect(probe.form().tip).toBe('5,00');
    expect(probe.form().tipExpanded).toBe(false);
    expect(probe.form().payment).toMatchObject({
      tipCents: 500,
      changeGivenCents: 2500,
    });
    expect(probe.form().canConfirm).toBe(true);
    await act(async () => {
      probe.form().expandTip();
      probe.form().changeField('tip', '');
    });
    await act(async () => {
      expect(probe.form().collapseTip()).toBe(true);
    });
    expect(probe.form().tip).toBe('');
    expect(probe.form().payment).toMatchObject({
      tipCents: 0,
      changeGivenCents: 3000,
    });
  } finally {
    await probe.unmount();
  }
});

test.each(['abc', '-1', '31', '999999999999'])(
  'collapse cannot conceal invalid or excessive tip %s',
  async raw => {
    const probe = await mount();
    try {
      await draft(probe.form, raw);
      await act(async () => {
        expect(probe.form().collapseTip()).toBe(false);
      });
      expect(probe.form().tipExpanded).toBe(true);
      expect(probe.form().tip).toBe(raw);
      expect(probe.form().canConfirm).toBe(false);
    } finally {
      await probe.unmount();
    }
  },
);

test('underpayment cannot mask a malformed tip during collapse, but unknown change is not itself an error', async () => {
  const probe = await mount();
  try {
    await draft(probe.form);
    await act(async () => probe.form().changeField('received', '19'));
    await act(async () => probe.form().changeField('tip', 'bad'));
    expect(probe.form().payment?.status).toBe('insufficient');
    await act(async () => {
      expect(probe.form().collapseTip()).toBe(false);
    });
    await act(async () => probe.form().changeField('tip', '5'));
    await act(async () => {
      expect(probe.form().collapseTip()).toBe(true);
    });
    expect(probe.form().canConfirm).toBe(false);
    expect(probe.form().tip).toBe('5,00');
  } finally {
    await probe.unmount();
  }
});

test('remove clears invalid or focused drafts and delayed blur cannot resurrect them', async () => {
  const probe = await mount();
  try {
    await draft(probe.form, '5,');
    await act(async () => probe.form().focus('tip'));
    const oldBlur = probe.form().blur;
    await act(async () => probe.form().removeTip());
    await act(async () => oldBlur('tip'));
    expect(probe.form().tip).toBe('');
    expect(probe.form().tipExpanded).toBe(false);
    expect(probe.form().payment).toMatchObject({
      tipCents: 0,
      changeGivenCents: 3000,
    });
    await act(async () => {
      probe.form().expandTip();
      probe.form().changeField('tip', 'bad');
    });
    await act(async () => probe.form().removeTip());
    expect(probe.form().tip).toBe('');
    expect(probe.form().tipExpanded).toBe(false);
  } finally {
    await probe.unmount();
  }
});

test('money resets preserve visibility and platform changes preserve the raw tip draft', async () => {
  const probe = await mount();
  try {
    await draft(probe.form, '5,');
    await act(async () => {
      await probe.form().choosePlatform('bolt');
    });
    expect(probe.form().tip).toBe('5,');
    expect(probe.form().tipExpanded).toBe(true);
    for (const reset of [
      () => probe.form().quick(5000),
      () => probe.form().quick(),
      () => probe.form().changeField('fare', '21'),
      () => probe.form().changeField('received', '50'),
    ]) {
      await act(async () => probe.form().changeField('tip', '5'));
      await act(async () => reset());
      expect(probe.form().tip).toBe('');
      expect(probe.form().tipExpanded).toBe(true);
    }
  } finally {
    await probe.unmount();
  }
});

test('successful create collapses immediately and rejects queued precommit visibility callbacks', async () => {
  const probe = await mount();
  try {
    await draft(probe.form);
    const stale = probe.form();
    await act(async () => {
      expect(await probe.form().submit()).toBe(true);
    });
    expect(probe.form().tipExpanded).toBe(false);
    expect(probe.form().tip).toBe('');
    expect(probe.form().tipResetCount).toBe(1);
    await act(async () => {
      stale.expandTip();
      stale.removeTip();
      stale.collapseTip();
      stale.blur('tip');
    });
    expect(probe.form().tipExpanded).toBe(false);
    expect(probe.form().tip).toBe('');
    await act(async () => probe.form().expandTip());
    expect(probe.form().tipExpanded).toBe(true);
  } finally {
    await probe.unmount();
  }
});

test('pending save guards controls and failure preserves the complete draft and visibility', async () => {
  let reject: (error: Error) => void = () => {};
  const gate = new Promise<CashTransaction>((_, fail) => {
    reject = fail;
  });
  const probe = await mount({ onSubmit: () => gate });
  try {
    await draft(probe.form);
    const before = probe.form();
    let saving: Promise<boolean>;
    await act(async () => {
      saving = probe.form().submit();
    });
    await act(async () => {
      before.removeTip();
      before.expandTip();
      expect(before.collapseTip()).toBe(false);
    });
    expect(probe.form().tipExpanded).toBe(true);
    expect(probe.form().tip).toBe('5');
    await act(async () => {
      reject(new Error('Write failed'));
      expect(await saving).toBe(false);
    });
    expect(probe.form().failed).toBe(true);
    expect(probe.form().tipResetCount).toBe(0);
    await act(async () => {
      expect(probe.form().collapseTip()).toBe(true);
      probe.form().expandTip();
    });
    expect(probe.form().failed).toBe(true);
    expect(probe.form().tipExpanded).toBe(true);
  } finally {
    await probe.unmount();
  }
});

test('visibility alone preserves failed-retry UUID and exact SQLite amounts', async () => {
  const db = openTestDatabase();
  const services = await testPersistence(db);
  const save = jest
    .spyOn(services.transactions, 'save')
    .mockRejectedValueOnce(new Error('Write failed'));
  let current: ReturnType<typeof usePaymentForm> | undefined;
  function form() {
    if (!current) {
      throw new Error('Form not mounted');
    }
    return current;
  }
  function Probe() {
    const create = useCreatePayment(services, false);
    current = usePaymentForm({ initialPlatform: 'uber', onSubmit: create });
    return null;
  }
  let renderer: ReactTestRenderer.ReactTestRenderer;
  try {
    await act(async () => {
      renderer = ReactTestRenderer.create(<Probe />);
    });
    await draft(form);
    await act(async () => {
      expect(await form().submit()).toBe(false);
    });
    const pendingID = save.mock.calls[0][0].id;
    await act(async () => {
      expect(form().collapseTip()).toBe(true);
    });
    await act(async () => form().expandTip());
    expect(form().failed).toBe(true);
    await act(async () => {
      expect(form().collapseTip()).toBe(true);
    });
    await act(async () => {
      expect(await form().submit()).toBe(true);
    });
    expect(save.mock.calls[1][0].id).toBe(pendingID);
    expect(await services.transactions.list()).toEqual([
      expect.objectContaining({
        id: pendingID,
        tipCents: 500,
        changeGivenCents: 2500,
      }),
    ]);
    expect(form().tipExpanded).toBe(false);
  } finally {
    await act(async () => renderer?.unmount());
    save.mockRestore();
    db.close();
  }
});

test('edit commit keeps its visibility and toggling cannot reenable duplicate confirmation', async () => {
  const submit = jest.fn(async (input: TransactionInput) => committed(input));
  const probe = await mount({
    initialValues: partial,
    clearAfterSave: false,
    onSubmit: submit,
  });
  try {
    await act(async () => {
      expect(probe.form().collapseTip()).toBe(true);
    });
    await act(async () => {
      expect(await probe.form().submit()).toBe(true);
    });
    expect(probe.form().tipExpanded).toBe(false);
    expect(probe.form().tip).toBe('5,00');
    expect(probe.form().tipResetCount).toBe(0);
    await act(async () => probe.form().expandTip());
    await act(async () => {
      expect(await probe.form().submit()).toBe(false);
    });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(probe.form().canConfirm).toBe(false);
    await act(async () => probe.form().removeTip());
    expect(probe.form().canConfirm).toBe(true);
    expect(probe.form().tipExpanded).toBe(false);
  } finally {
    await probe.unmount();
  }
});
