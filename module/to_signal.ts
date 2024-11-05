// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

/**
 * Contains the implementation for the {@link toSignal} function.
 *
 * A promise signal is a signal that resolves a promise and updates its value based on the promise's
 * status.
 *
 * @example Usage
 * ```ts
 * const promiseSignal = toSignal(() => fetch('https://api.example.com/data'));
 *
 * console.log(promiseSignal()); // Logs: "{ status: 'pending' }".
 *
 * // The value is updated when the promise resolves.
 * await delay(1000);
 * console.log(promiseSignal()); // Logs: "{ status: 'fulfilled', value: 'Hello, World!' }".
 *
 * // Or if the promise rejects.
 * console.log(promiseSignal()); // Logs: "{ status: 'rejected', error: 'Error!' }".
 * ```
 *
 * @module
 */

import type { ReadonlySignal } from './_api.ts';
import { signal } from './signal.ts';

/**
 * Creates a signal from a promise.
 *
 * @example Usage
 * ```ts
 * // Create a signal from a promise using async/await.
 * const promiseSignal = toSignal(async () => {
 *   const response = await fetch('https://api.example.com/data');
 *   return await response.json();
 * });
 *
 * // Or using a promise directly.
 * const promiseSignal = toSignal(
 *   fetch('https://api.example.com/data').then((response) => response.json())
 * );
 *
 * // The signal is initially pending.
 * console.log(promiseSignal()); // Logs: "{ status: 'pending' }".
 *
 * // The value is updated when the promise resolves.
 * await delay(1000);
 * console.log(promiseSignal()); // Logs: "{ status: 'fulfilled', value: 'Hello, World!' }".

 * // Or if the promise rejects.
 * console.log(promiseSignal()); // Logs: "{ status: 'rejected', error: 'Error!' }".
 * ```
 *
 * @template T - The type of the promise value.
 * @param value - Promise function or promise to create the signal from.
 * @returns A read-only signal ({@link ReadonlySignal}) that resolves the promise and updates its
 * value based on the promise's status.
 */
export function toSignal<T>(
  value: (() => Promise<T>) | Promise<T>,
): ReadonlySignal<PromiseValue<T>> {
  const signalValue = signal<PromiseValue<T>>({ status: 'pending' });

  const promise = value instanceof Promise ? value : value();

  promise
    .then((response) => signalValue.set({ status: 'fulfilled', value: response }))
    .catch((error) => signalValue.set({ status: 'rejected', error }));

  return signalValue.readonly();
}

/**
 * The value of a promise.
 * @template T - The type for the promise value.
 */
export type PromiseValue<T> =
  | { status: 'pending' }
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; error: unknown };
