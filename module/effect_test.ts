// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { describe as group, test } from '@std/testing/bdd';
import { expect } from '@std/expect';

import { delay } from '@std/async';

import { effect } from './effect.ts';
import { signal } from './signal.ts';

group('reactive / effect()', () => {
  test('should listen for signal changes and trigger effects', async () => {
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

  test('should stop an effect when destroyed', async () => {
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

  test('should stop an effect when out of scope', async () => {
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

  test('should allow to use the `initial` method to run the effect immediately', async () => {
    const value = signal(0);
    const changes = [] as number[];

    const effectRef = effect.initial(() => {
      changes.push(value());
    });

    expect(changes).toEqual([0]);

    value.set(1);
    await delay(1);
    expect(changes).toEqual([0, 1]);

    value.set(2);
    await delay(1);
    expect(changes).toEqual([0, 1, 2]);

    effectRef.destroy();
  });

  test('should reset all active effects', async () => {
    const value = signal(0);
    const changes: number[] = [];

    effect(() => {
      changes.push(value());
    });

    expect(changes).toEqual([]);

    value.set(1);
    await delay(1);
    expect(changes).toEqual([1]);

    effect.resetEffects();

    value.set(2);
    await delay(1);
    expect(changes).toEqual([1]);
  });
});
