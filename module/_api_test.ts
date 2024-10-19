// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { describe as group, test } from '@std/testing/bdd';
import { expect } from '@std/expect';

import { defaultEquals, isSignal, markAsSignal } from './_api.ts';
import { signal } from './signal.ts';
import { memoSignal } from './memo.ts';

group('reactive / api', () => {
  group('defaultEquals()', () => {
    test('should compare two values', () => {
      expect(defaultEquals(1, 1)).toBe(true);
      expect(defaultEquals(1, 2)).toBe(false);
    });

    test('should compare two objects', () => {
      const obj1 = { name: 'Alice', age: 42 };
      const obj2 = { name: 'Alice', age: 42 };

      expect(defaultEquals(obj1, obj2)).toBe(false);
    });
  });

  group('isSignal()', () => {
    test('should check if a value is a signal', () => {
      const notSignal = 42;
      const validSignal = signal(42);

      expect(isSignal(notSignal)).toBe(false);
      expect(isSignal(validSignal)).toBe(true);
    });

    test('should check very specific signal types', () => {
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
  });

  test('markAsSignal() - should mark a functions as a signal', () => {
    const value = () => 42;
    const signalValue = markAsSignal('writable', value);

    expect(isSignal(signalValue)).toBe(true);
  });
});
