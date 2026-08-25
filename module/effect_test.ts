// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { expect } from '@std/expect';

import { delay } from '@std/async';

import { effect } from './effect.ts';
import { memoSignal } from './memo.ts';
import { signal } from './signal.ts';

Deno.test('effect() should listen for signal changes and trigger effects', async () => {
  const value = signal(0);
  const changes: number[] = [];

  const effectRef = effect(() => {
    changes.push(value());
  });

  expect(changes).toEqual([]);

  value.set(1);
  await delay(1);
  expect(changes).toEqual([1]);

  value.set(2);
  await delay(1);
  expect(changes).toEqual([1, 2]);

  effectRef.destroy();
});

Deno.test('EffectRef.destroy() should stop the effect', async () => {
  const value = signal(0);
  const changes: number[] = [];

  const effectRef = effect(() => {
    changes.push(value());
  });

  expect(changes).toEqual([]);

  value.set(1);
  await delay(1);
  expect(changes).toEqual([1]);

  effectRef.destroy();

  value.set(2);
  await delay(1);
  expect(changes).toEqual([1]);
});

Deno.test('EffectRef.destroy() should be idempotent', () => {
  let cleanupCalls = 0;
  const effectRef = effect.initial(() => () => cleanupCalls++);

  effectRef.destroy();
  effectRef.destroy();
  effectRef[Symbol.dispose]();

  expect(cleanupCalls).toBe(1);
});

Deno.test('EffectRef[Symbol.dispose]() should stop the effect when it leaves scope', async () => {
  const value = signal(0);
  const changes: number[] = [];

  {
    using _effectRef = effect(() => {
      changes.push(value());
    });

    expect(changes).toEqual([]);

    value.set(1);
    await delay(1);
    expect(changes).toEqual([1]);
  }

  value.set(2);
  await delay(1);
  expect(changes).toEqual([1]);
});

Deno.test('effect.initial() should run the effect immediately', async () => {
  const value = signal(0);
  const changes = [] as number[];

  const effectRef = effect.initial(() => {
    changes.push(value());
  });

  expect(changes).toEqual([0]);
  await delay(1);
  expect(changes).toEqual([0]);

  value.set(1);
  await delay(1);
  expect(changes).toEqual([0, 1]);

  value.set(2);
  await delay(1);
  expect(changes).toEqual([0, 1, 2]);

  effectRef.destroy();
});

Deno.test('effect() should skip execution when dependency values do not change', async () => {
  const source = signal(1);
  const parity = memoSignal(() => source() % 2);
  const changes: number[] = [];
  const effectRef = effect(() => {
    changes.push(parity());
  });

  await delay(1);
  expect(changes).toEqual([1]);

  source.set(3);
  await delay(1);
  expect(changes).toEqual([1]);

  effectRef.destroy();
});

Deno.test('effect.resetEffects() should stop all active effects', async () => {
  const value = signal(0);
  const changes: number[] = [];
  let cleanupCalls = 0;

  const effectRef = effect(() => {
    changes.push(value());
    return () => cleanupCalls++;
  });

  expect(changes).toEqual([]);

  value.set(1);
  await delay(1);
  expect(changes).toEqual([1]);

  effect.resetEffects();
  expect(cleanupCalls).toBe(1);

  effectRef.destroy();
  expect(cleanupCalls).toBe(1);

  value.set(2);
  await delay(1);
  expect(changes).toEqual([1]);
});
