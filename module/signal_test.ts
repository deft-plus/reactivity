// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { describe as group, test } from '@std/testing/bdd';
import { assertSpyCalls, stub } from '@std/testing/mock';
import { expect } from '@std/expect';

import type { WritableSignal } from './_api.ts';
import { signal } from './signal.ts';
import { effect } from './effect.ts';

type TestingUser = {
  name: string;
  age: number;
};

group('reactive / signal()', () => {
  test('should create a signal with the given initial value', () => {
    const counter = signal(0);

    expect(counter()).toBe(0);
  });

  test('should create a signal with the given options', () => {
    const counter = signal(0, { name: 'counter', log: true });

    expect(counter()).toBe(0);
  });

  test('should allow to set a new value to a signal', () => {
    const counter = signal(0);

    counter.set(1);

    expect(counter()).toBe(1);
  });

  test('should allow to update a signal value', () => {
    const counter = signal(0);

    counter.update((value) => value + 1);

    expect(counter()).toBe(1);
  });

  test('should allow to mutate a signal value', () => {
    const user = signal<TestingUser>({ name: 'Alice', age: 42 });

    user.mutate((value) => {
      value.name = 'Bob';
    });

    expect(user().name).toBe('Bob');
  });

  test('should create a readonly signal', () => {
    const value = signal(0).readonly();

    expect(value()).toBe(0);

    const signalFnKeys = Object.keys(value);
    const writableKeys = signalFnKeys.find((key) =>
      key === 'set' || key === 'update' || key === 'mutate'
    );

    expect(writableKeys).toBe(undefined);
  });

  test('should subscribe to readonly signals', () => {
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

  test('should allow to use `subscribe` hook', () => {
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

  test('should allow to use computed values', () => {
    const counter = signal(0);
    const doubleCounter = () => counter() * 2;

    expect(doubleCounter()).toBe(0);

    counter.set(1);

    expect(doubleCounter()).toBe(2);
  });

  test('should allow to pass signals as params and subscribe to changes', () => {
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

  test('should not track changes in untracked blocks', () => {
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

  test('should allow to update values using events', () => {
    using counter = signal(0, { allowEvents: true });

    expect(counter()).toBe(0);

    dispatchEvent(new CustomEvent(counter.identifier, { detail: 1 }));

    expect(counter()).toBe(1);
  });

  test('should clean up listener after signal is out of scope', () => {
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

  test('should create a new identifier for a readonly signal', () => {
    const counter = signal(0, { name: 'counter' });
    const readonlyCounter = counter.readonly();

    expect(counter.identifier).not.toBe(readonlyCounter.identifier);
  });

  test('should log changes', () => {
    using consoleStub = stub(console, 'log', (_) => {});

    const hello = signal({ hello: 'world' }, { name: 'hello', log: true });

    hello.set({ hello: 'world set' });
    hello.mutate((value) => {
      value.hello = 'world mutate';
    });

    assertSpyCalls(consoleStub, 6); // 6 calls since each log is called 3 times.
  });

  test('should have a toString implementation', () => {
    const counter = signal(1);
    expect(counter + '').toBe('[Signal: 1]');
  });
});
