// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { expect } from '@std/expect';

import { untrackedSignal } from './untracked.ts';
import { signal } from './signal.ts';
import { effect } from './effect.ts';

Deno.test('untrackedSignal() should read without tracking dependencies', () => {
  const changes: number[] = [];

  const counter = signal(0);

  effect(() => {
    changes.push(untrackedSignal(() => counter()));
  });

  counter.set(1);

  expect(changes).toStrictEqual([]);

  counter.set(2);

  expect(changes).toStrictEqual([]);
});
