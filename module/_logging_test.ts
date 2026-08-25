// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { assertSpyCalls, stub } from '@std/testing/mock';
import { expect } from '@std/expect';

import { resolveSignalLog } from './_logging.ts';
import { memoSignal } from './memo.ts';
import { signal } from './signal.ts';
import { store } from './store.ts';

const permissionStatus = (state: Deno.PermissionState): Deno.PermissionStatus =>
  ({ state, partial: false, onchange: null }) as Deno.PermissionStatus;

Deno.test('resolveSignalLog() should prioritize an explicit logging option', () => {
  using permissionStub = stub(
    Deno.permissions,
    'querySync',
    () => permissionStatus('granted'),
  );

  expect(resolveSignalLog(true)).toBe(true);
  expect(resolveSignalLog(false)).toBe(false);
  assertSpyCalls(permissionStub, 0);
});

Deno.test('resolveSignalLog() should disable global logging when environment access is denied', () => {
  using permissionStub = stub(
    Deno.permissions,
    'querySync',
    () => permissionStatus('denied'),
  );
  using envStub = stub(Deno.env, 'get', () => 'true');

  expect(resolveSignalLog()).toBe(false);
  assertSpyCalls(permissionStub, 1);
  assertSpyCalls(envStub, 0);
});

Deno.test('resolveSignalLog() should enable global logging when the environment setting is accessible', () => {
  using permissionStub = stub(
    Deno.permissions,
    'querySync',
    () => permissionStatus('granted'),
  );
  using envStub = stub(Deno.env, 'get', () => 'true');
  using consoleStub = stub(console, 'log', () => {});

  const counter = signal(0);
  const doubleCounter = memoSignal(() => counter() * 2);

  counter.set(1);
  expect(doubleCounter()).toBe(2);

  assertSpyCalls(permissionStub, 2);
  assertSpyCalls(envStub, 2);
  assertSpyCalls(consoleStub, 6);
});

Deno.test('resolveSignalLog() should let local options disable global logging', () => {
  using permissionStub = stub(
    Deno.permissions,
    'querySync',
    () => permissionStatus('granted'),
  );
  using envStub = stub(Deno.env, 'get', () => 'true');
  using consoleStub = stub(console, 'log', () => {});

  const counter = signal(0, { log: false });
  const doubleCounter = memoSignal(() => counter() * 2, { log: false });
  const counterStore = store<{ count: number; increment: () => void }>(({ get }) => ({
    count: { value: 0, log: false },
    increment: () => get().count.update((value) => value + 1),
  }));

  counter.set(1);
  expect(doubleCounter()).toBe(2);
  counterStore().increment();
  expect(counterStore().count()).toBe(1);

  assertSpyCalls(permissionStub, 0);
  assertSpyCalls(envStub, 0);
  assertSpyCalls(consoleStub, 0);
});
