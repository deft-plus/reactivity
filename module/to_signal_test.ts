// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { expect } from '@std/expect';

import { delay } from '@std/async';

import { toSignal } from './to_signal.ts';

Deno.test('toSignal() should create signals from promises and promise functions', async () => {
  const promise1 = toSignal(() => delay(10).then(() => 'Hello, World!'));
  const promise2 = toSignal(delay(10).then(() => 'Hello, World!'));

  expect(promise1()).toStrictEqual({ status: 'pending' });
  expect(promise2()).toStrictEqual({ status: 'pending' });

  await delay(20);

  expect(promise1()).toStrictEqual({ status: 'fulfilled', value: 'Hello, World!' });
  expect(promise2()).toStrictEqual({ status: 'fulfilled', value: 'Hello, World!' });
});

Deno.test('toSignal() should expose rejected promise errors', async () => {
  const promise = toSignal(() => delay(10).then(() => Promise.reject('Error!')));

  expect(promise()).toStrictEqual({ status: 'pending' });

  await delay(20);

  expect(promise()).toStrictEqual({ status: 'rejected', error: 'Error!' });
});
