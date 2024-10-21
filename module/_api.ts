// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

/**
 * Contains APIs for creating and working with signals.
 *
 * A signal is a function that returns a value. Signals can be read-only or writable. Writable
 * signals are created with the `signal` function, while read-only signals are created by calling
 * the `readonly` method on a writable signal.
 *
 * Signals are used to create reactive graphs. When a signal's value changes, all dependent signals
 * are notified and re-evaluated.
 *
 * @module
 */

/**
 * Symbol to identify signal functions.
 * @internal
 */
const SIGNAL = Symbol('signal');

/**
 * List of signal types.
 * @internal
 */
const SIGNAL_TYPES: SignalType[] = ['writable', 'readonly', 'memoized'];

/**
 * Gets the type of signal, of a signal.
 *
 * @template T - The type of the signal value.
 * @param signal - Signal to get the type of.
 * @returns The signal type.
 */
export function getSignalType<T>(signal: Signal<T>): SignalType {
  return (signal as ReadonlySignal<T>)[SIGNAL];
}

/**
 * Utility to check if a value is a signal.
 *
 * @example Usage
 * ```ts
 * if (isSignal(value)) {
 *   console.log('Value is a signal:', value());
 * }
 *
 * // Or use the type guard.
 * if (isSignal<string>(value)) {
 *   console.log('Value is a signal with string typings:', value());
 * }
 *
 * // Or use the type guards for specific signal types.
 * if (isSignal.writable(value)) {
 *   console.log('Value is a writable signal:', value());
 * }
 *
 * if (isSignal.readonly(value)) {
 *   console.log('Value is a read-only signal:', value());
 * }
 *
 * if (isSignal.memoized(value)) {
 *   console.log('Value is a memoized signal:', value());
 * }
 * ```
 *
 * @template T - The type of the signal value if the value is a signal.
 * @param value - Value to check.
 * @returns `true` if the value is a signal ({@link Signal}), `false` otherwise.
 */
export function isSignal<T = unknown>(value: unknown): value is Signal<T> {
  return value !== null && SIGNAL_TYPES.includes((value as ReadonlySignal<T>)[SIGNAL]);
}

/**
 * Type guard to check if a value is a writable signal.
 *
 * @template T - The type of the signal value if the value is a writable signal.
 * @param value - Value to check.
 * @returns `true` if the value is a writable signal ({@link WritableSignal}), `false` otherwise.
 */
isSignal.writable = <T = unknown>(value: unknown): value is WritableSignal<T> =>
  isSignal(value) && getSignalType(value) === 'writable';

/**
 * Type guard to check if a value is a read-only signal.
 *
 * @template T - The type of the signal value if the value is a read-only signal.
 * @param value - Value to check.
 * @returns `true` if the value is a read-only signal ({@link ReadonlySignal}), `false` otherwise.
 */
isSignal.readonly = <T = unknown>(value: unknown): value is ReadonlySignal<T> =>
  isSignal(value) && getSignalType(value) === 'readonly';

/**
 * Type guard to check if a value is a memoized signal.
 *
 * @template T - The type of the signal value if the value is a memoized signal.
 * @param value - Value to check.
 * @returns `true` if the value is a memoized signal ({@link MemoizedSignal}), `false` otherwise.
 */
isSignal.memoized = <T = unknown>(value: unknown): value is MemoizedSignal<T> =>
  isSignal(value) && getSignalType(value) === 'memoized';

/**
 * Marks a function as a signal function.
 *
 * @template T - Generic to cast the function as either a read-only or writable signal.
 * @param fn - Function to mark as a signal.
 * @param extraApi - Extra API to add to the signal.
 * @returns The marked signal function ({@link Signal}).
 * @internal
 */
export function markAsSignal<T extends Signal>(
  type: SignalType,
  fn: () => unknown,
  extraApi?: Record<string, unknown>,
): T {
  (fn as WithSignalSymbol<() => T>)[SIGNAL] = type;

  // Copy properties from `extraApi` to `fn` to complete the desired API of the `Signal`.
  return Object.assign(fn, extraApi) as T;
}

/**
 * Default equality check for signals. Compares objects and arrays as always unequal, and uses
 * strict equality for primitives.
 *
 * @template T - The type of the values to compare.
 * @param a - First value to compare.
 * @param b - Second value to compare.
 * @returns `true` if the values are equal, `false` otherwise.
 */
export function defaultEquals<T>(a: T, b: T): boolean {
  return (a === null || typeof a !== 'object') && Object.is(a, b);
}

/**
 * Represents a base signal function. Which in essence is a function that returns a value.
 *
 * @template T - The type of the value returned by the signal.
 */
export type BaseSignal<T = unknown> = () => T;

/** Different types of signals. */
export type SignalType = 'writable' | 'readonly' | 'memoized';

/**
 * Adds the signal symbol to the given type.
 *
 * @template T - The type to add the signal symbol to.
 */
export interface WithSignalSymbol<T> extends BaseSignal<T> {
  /**
   * Symbol to identify signal type ({@link SignalType}).
   * @internal
   */
  [SIGNAL]: SignalType;
}

/**
 * A signal that can be read but not updated.
 *
 * @template T - The type of the value returned by the signal.
 */
export interface ReadonlySignal<T = unknown> extends WithSignalSymbol<T> {
  /**
   * Get the value without creating a dependency.
   *
   * @returns The current value without creating a dependency.
   */
  untracked(): T;
}

/**
 * A signal that can be changed.
 *
 * @template T - The type of the value returned by the signal.
 */
export interface WritableSignal<T = unknown> extends ReadonlySignal<T> {
  /**
   * Set a new value and notify dependents.
   *
   * @param value - New value to set.
   */
  set(value: T): void;
  /**
   * Update the value based on the current value and notify dependents.
   *
   * @param updateFn - Function to update the value.
   */
  update(updateFn: (value: T) => T): void;
  /**
   * Modify the current value in-place and notify dependents.
   *
   * @param mutatorFn - Function to mutate the value.
   */
  mutate(mutatorFn: (value: T) => void): void;
  /**
   * Get a read-only version of this signal.
   *
   * @returns A read-only signal {@linkcode ReadonlySignal}.
   */
  readonly(): ReadonlySignal<T>;
}

/**
 * A memoized signal that computes the value based on dependencies.
 *
 * @template T - The type of the value returned by the signal.
 */
export interface MemoizedSignal<T = unknown> extends ReadonlySignal<T> {}

/**
 * Union with both the read-only ({@link ReadonlySignal}) and writable signal
 * ({@link WritableSignal}).
 *
 * @template T - The type of the value returned by the signal.
 */
export type Signal<T = unknown> = ReadonlySignal<T> | WritableSignal<T> | MemoizedSignal<T>;

/**
 * Options for creating a signal of the given type.
 *
 * @template T - The type of the value returned by the signal.
 */
export interface SignalOptions<T> {
  /**
   * Identifier for the signal. Useful for debugging and testing.
   */
  id?: string;
  /**
   * Whether to log the signal's changes. Defaults to `false`.
   */
  log?: boolean;
  /**
   * Function to check if two signal values are equal. Defaults to the built-in equality check
   * ({@link defaultEquals}).
   *
   * @param a - First value to compare.
   * @param b - Second value to compare.
   * @returns `true` if the values are equal, `false` otherwise.
   */
  equal?: (a: T, b: T) => boolean;
  /**
   * Function to call after the signal value changes.
   *
   * @param newValue - New value of the signal.
   */
  onChange?: (newValue: T) => void;
}

/**
 * Options for creating a memoized signal.
 *
 * @template T - The type of the value returned by the signal.
 */
export interface MemoizedSignalOptions<T> extends SignalOptions<T> {
  // Empty for now but could be extended in the future.
}
