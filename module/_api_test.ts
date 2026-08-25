// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { expect } from '@std/expect';

import { defaultEquals, isSignal, markAsSignal } from './_api.ts';
import { signal } from './signal.ts';
import { memoSignal } from './memo.ts';

Deno.test('defaultEquals() should compare two values', () => {
  expect(defaultEquals(1, 1)).toBe(true);
  expect(defaultEquals(1, 2)).toBe(false);
});

Deno.test('defaultEquals() should treat objects as unequal by default', () => {
  const obj1 = { name: 'Alice', age: 42 };
  const obj2 = { name: 'Alice', age: 42 };

  expect(defaultEquals(obj1, obj2)).toBe(false);
});

Deno.test('isSignal() should identify signal values', () => {
  const notSignal = 42;
  const validSignal = signal(42);

  expect(isSignal(notSignal)).toBe(false);
  expect(isSignal(validSignal)).toBe(true);
});

Deno.test('isSignal() should return false for nullish values', () => {
  expect(isSignal(undefined)).toBe(false);
  expect(isSignal(null)).toBe(false);
  expect(isSignal.writable(undefined)).toBe(false);
  expect(isSignal.readonly(undefined)).toBe(false);
  expect(isSignal.memoized(undefined)).toBe(false);
});

Deno.test('isSignal() type guards should identify specific signal types', () => {
  const notSignal = 42;
  const validSignal = signal(42);
  const validReadonly = validSignal.readonly();
  const validMemo = memoSignal(() => validSignal());

  expect(isSignal(notSignal)).toBe(false);
  expect(isSignal(validSignal)).toBe(true);

  expect(isSignal.writable(validSignal)).toBe(true);
  expect(isSignal.writable(validReadonly)).toBe(false);

  expect(isSignal.readonly(validReadonly)).toBe(true);
  expect(isSignal.readonly(validMemo)).toBe(false);

  expect(isSignal.memoized(validMemo)).toBe(true);
  expect(isSignal.memoized(validSignal)).toBe(false);
});

Deno.test('markAsSignal() should mark a function as a signal', () => {
  const value = () => 42;
  const signalValue = markAsSignal('writable', value);

  expect(isSignal(signalValue)).toBe(true);
});
