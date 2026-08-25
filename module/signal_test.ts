// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { assertSpyCalls, stub } from '@std/testing/mock';
import { expect } from '@std/expect';

import type { WritableSignal } from './_api.ts';
import { signal } from './signal.ts';
import { effect } from './effect.ts';

type TestingUser = {
  name: string;
  age: number;
};

Deno.test('signal() should create a writable signal with the initial value', () => {
  const counter = signal(0);

  expect(counter()).toBe(0);
});

Deno.test('signal() should apply its configuration options', () => {
  const counter = signal(0, { name: 'counter', log: true });

  expect(counter()).toBe(0);
});

Deno.test('WritableSignal.set() should replace the current value', () => {
  const counter = signal(0);

  counter.set(1);

  expect(counter()).toBe(1);
});

Deno.test('WritableSignal.update() should derive a new value from the current value', () => {
  const counter = signal(0);

  counter.update((value) => value + 1);

  expect(counter()).toBe(1);
});

Deno.test('WritableSignal.mutate() should mutate the current value in place', () => {
  const user = signal<TestingUser>({ name: 'Alice', age: 42 });

  user.mutate((value) => {
    value.name = 'Bob';
  });

  expect(user().name).toBe('Bob');
});

Deno.test('WritableSignal.readonly() should create a readonly signal', () => {
  const value = signal(0).readonly();

  expect(value()).toBe(0);

  const signalFnKeys = Object.keys(value);
  const writableKeys = signalFnKeys.find((key) =>
    key === 'set' || key === 'update' || key === 'mutate'
  );

  expect(writableKeys).toBe(undefined);
});

Deno.test('WritableSignal.readonly() should stay synchronized with its source', () => {
  const privateCounter = signal(0);

  const counter = {
    mutable: privateCounter,
    readonly: privateCounter.readonly(),
  };

  expect(counter.readonly()).toBe(0);

  const signalFnKeys = Object.keys(counter.readonly);
  const writableKeys = signalFnKeys.find((key) =>
    key === 'set' || key === 'update' || key === 'mutate'
  );

  expect(writableKeys).toBe(undefined);

  privateCounter.set(1);
  expect(counter.readonly()).toBe(1);

  counter.mutable.set(2);
  expect(counter.readonly()).toBe(2);
});

Deno.test('signal() should call the subscribe hook after value changes', () => {
  const called = [] as number[];

  const counter = signal(0, {
    subscribe: (value) => called.push(value),
  });

  expect(called).toStrictEqual([]);

  counter.set(1);
  expect(called).toStrictEqual([1]);

  counter.set(23);
  expect(called).toStrictEqual([1, 23]);

  counter.set(23);
  expect(called).toStrictEqual([1, 23]);
});

Deno.test('signal() should support derived function values', () => {
  const counter = signal(0);
  const doubleCounter = () => counter() * 2;

  expect(doubleCounter()).toBe(0);

  counter.set(1);

  expect(doubleCounter()).toBe(2);
});

Deno.test('signal() should remain readable when passed as a function parameter', () => {
  const firstName = signal('Alice');
  const lastName = signal('Smith');

  type Signals = {
    firstName: WritableSignal<string>;
    lastName: WritableSignal<string>;
  };

  const buildDisplayName = ({ firstName, lastName }: Signals) => `${firstName()} ${lastName()}`;

  const displayName = () => buildDisplayName({ firstName, lastName });

  expect(displayName()).toBe('Alice Smith');

  firstName.set('Bob');

  expect(displayName()).toBe('Bob Smith');
});

Deno.test('WritableSignal.untracked() should not track dependencies', () => {
  const changes: number[] = [];

  const counter = signal(0);
  const readonlyCounter = counter.readonly();

  effect(() => {
    changes.push(counter.untracked());
    changes.push(readonlyCounter.untracked());
  });

  counter.set(1);

  expect(changes).toStrictEqual([]);

  counter.set(2);

  expect(changes).toStrictEqual([]);
});

Deno.test('signal() should update its value from configured events', () => {
  using counter = signal(0, { allowEvents: true });

  expect(counter()).toBe(0);

  dispatchEvent(new CustomEvent(counter.identifier, { detail: 1 }));

  expect(counter()).toBe(1);
});

Deno.test('WritableEventSignal[Symbol.dispose]() should remove its event listener', () => {
  const changes: number[] = [];

  {
    using counter = signal(0, {
      name: 'counter_test_2',
      allowEvents: true,
      subscribe: (value) => changes.push(value),
    });

    expect(changes).toStrictEqual([]);
    expect(counter()).toBe(0);

    dispatchEvent(new CustomEvent('counter_test_2', { detail: 1 }));

    expect(changes).toStrictEqual([1]);
    expect(counter()).toBe(1);
  }

  dispatchEvent(new CustomEvent('counter_test_2', { detail: 2 }));
  expect(changes).toStrictEqual([1]);
});

Deno.test('WritableSignal.readonly() should create a distinct identifier', () => {
  const counter = signal(0, { name: 'counter' });
  const readonlyCounter = counter.readonly();

  expect(counter.identifier).not.toBe(readonlyCounter.identifier);
});

Deno.test('signal() should log changes', () => {
  using consoleStub = stub(console, 'log', (_) => {});

  const hello = signal({ hello: 'world' }, { name: 'hello', log: true });

  hello.set({ hello: 'world set' });
  hello.mutate((value) => {
    value.hello = 'world mutate';
  });

  assertSpyCalls(consoleStub, 6); // 6 calls since each log is called 3 times.
});

Deno.test('WritableSignal.toString() should return its string representation', () => {
  const counter = signal(1);
  expect(counter + '').toBe('[Signal: 1]');
});
