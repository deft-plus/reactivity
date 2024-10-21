// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

/**
 * Contains the implementation for the {@link store} function.
 *
 * A store is a reactive atomic piece of state that can be read through signals and written through
 * actions. This function creates a store that can be used to read and write the state.
 *
 * @example Usage
 * ```ts
 * const counterStore = store(({ get }) => ({
 *   counter: 0,
 *   increment: () => get().counter++,
 *   decrement: () => get().counter--,
 * }));
 *
 * const counterValues = counterStore();
 *
 * console.log(counterValues.counter()); // Logs: "0".
 *
 * counterValues.increment();
 *
 * console.log(counterValues.counter()); // Logs: "1".
 * ```
 *
 * @example Usage with selector
 * ```ts
 * const counterStore = store(({ get }) => ({
 *   counter: 0,
 *   increment: () => get().counter++,
 *   decrement: () => get().counter--,
 * }));
 *
 * const counter = counterStore('counter');
 * const increment = counterStore('increment');
 *
 * console.log(counter()); // Logs: "0".
 *
 * increment();
 *
 * console.log(counter()); // Logs: "1".
 * ```
 */

import {
  isSignal,
  type MemoizedSignalOptions,
  type ReadonlySignal,
  type SignalOptions,
  type WritableSignal,
} from './_api.ts';
import { memoSignal } from './memo.ts';
import { signal } from './signal.ts';

/**
 * Creates a reactive atomic piece of state ({@link store}) that can be read through signals and
 * written through actions.
 *
 * @example Usage
 * ```ts
 * const counterStore = store(({ get }) => ({
 *   counter: 0,
 *   increment: () => get().counter++,
 *   decrement: () => get().counter--,
 * }));
 *
 * const counterValues = counterStore();
 *
 * console.log(counterValues.counter()); // Logs: "0".
 *
 * counterValues.increment();
 *
 * console.log(counterValues.counter()); // Logs: "1".
 * ```
 *
 * @example Usage with selector
 * ```ts
 * const counterStore = store(({ get }) => ({
 *   counter: 0,
 *   increment: () => get().counter++,
 *   decrement: () => get().counter--,
 * }));
 *
 * const counter = counterStore('counter');
 * const increment = counterStore('increment');
 *
 * console.log(counter()); // Logs: "0".
 *
 * increment();
 *
 * console.log(counter()); // Logs: "1".
 * ```
 *
 * @template T - The type of the store.
 * @param initializeStoreValues - Function that initializes the store values.
 * @returns A store that can be used to read and write the state.
 */
export function store<T extends ValidStore>(initializeStoreValues: StoreValues<T>): Store<T> {
  const __id__ = `store_${Math.random().toString(36).slice(2)}`;

  const mutableState = { __id__ } as ReadonlyState<T>;
  const immutableState = { __id__ } as ReadonlyState<T>;
  const initialState = initializeStoreValues({ get: () => mutableState as WritableState<T> });

  const stateEntries = Object.entries(initialState);

  for (let index = 0; index < stateEntries.length; index++) {
    const [stateKey, stateValue] = stateEntries[index];

    // If the value is a function, it's an action / derived value.
    if (typeof stateValue === 'function') {
      Object.defineProperty(mutableState, stateKey, { value: stateValue, writable: false });
      Object.defineProperty(immutableState, stateKey, { value: stateValue, writable: false });
      continue;
    }

    // If the value is not a function, it's a signal.
    const isConfigured = isConfiguredValue(stateValue);
    const signalValue = (isConfigured ? stateValue.value : stateValue) as T | (() => T);
    const isComputed = typeof signalValue === 'function';

    const signalConfig = {
      ...(isConfigured && stateValue.id && { id: stateValue.id }),
      ...(isConfigured && stateValue.log && { log: stateValue.log }),
      ...(isConfigured && stateValue.equal && { equal: stateValue.equal }),
      ...(isConfigured && stateValue.onChange && { onChange: stateValue.onChange }),
    } as SignalOptions<T>;

    // Value assignment to a memoized or normal signal.
    const valueSignal = isComputed
      ? memoSignal(signalValue, signalConfig)
      : signal(signalValue, signalConfig);

    // Value assignment to the mutable and immutable state.
    Object.defineProperty(mutableState, stateKey, { value: valueSignal, writable: false });
    Object.defineProperty(immutableState, stateKey, {
      value: isSignal.writable(valueSignal) ? valueSignal.readonly() : valueSignal,
      writable: false,
    });
  }

  // Function to use the store.
  function useStore<U extends (keyof T)>(): ReadonlyState<T>[U];
  function useStore(): ReadonlyState<T>;
  function useStore<U extends (keyof T)>(selector?: U): ReadonlyState<T>[U] | ReadonlyState<T> {
    return selector ? immutableState[selector] : immutableState;
  }

  return useStore;
}

/**
 * Utility function to check if a value is a configured value.
 *
 * @param value - Value to check.
 * @returns `true` if the value is a configured value ({@link ConfiguredValue}), `false` otherwise.
 */
function isConfiguredValue(value: unknown): value is ConfiguredValue {
  return typeof value !== 'undefined' &&
    value !== null &&
    typeof value === 'object' &&
    'value' in value;
}

/** Utility type to check if a value is a valid store. */
export type ValidStore = Record<PropertyKey, unknown>;

/**
 * Configuration options for a signal.
 *
 * @template T - The type of the signal value.
 */
export interface ConfiguredSignal<T = unknown> extends SignalOptions<T> {
  /** Initial value of the signal.*/
  value: T;
}

/**
 * Configuration options for a memoized signal.
 *
 * @template T - The type of the signal value.
 */
export interface ConfiguredMemoSignal<T = unknown> extends MemoizedSignalOptions<T> {
  /**
   * Initial value of the signal.
   *
   * @returns The initial value of the signal.
   */
  value: () => T;
}

/**
 * Utility type to define a configured value.
 *
 * @template T - The type of the signal value.
 */
export type ConfiguredValue<T = unknown> = ConfiguredSignal<T> | ConfiguredMemoSignal<T>;

/**
 * Utility type to add the meta data property to the state.
 *
 * @template T - The type of the store.
 */
export type StateWithMeta<T extends ValidStore> = T & { __id__: string };

/**
 * Maps all the values of the object as signals and actions.
 *
 * @template T - The type of the store.
 */
export type WritableState<T extends ValidStore> = StateWithMeta<
  // Disabled since it's okay to use this type here to map the values of the state.
  // deno-lint-ignore ban-types
  { [K in keyof T]: T[K] extends Function ? T[K] : WritableSignal<T[K]> }
>;

/**
 * Maps all the values of the object as readonly signals and actions.
 *
 * @template T - The type of the store.
 */
export type ReadonlyState<T extends ValidStore> = StateWithMeta<
  // Disabled since it's okay to use this type here to map the values of the state.
  // deno-lint-ignore ban-types
  { [K in keyof T]: T[K] extends Function ? T[K] : ReadonlySignal<T[K]> }
>;

/**
 * Function to create the store with the initial values.
 *
 * @template T - The type of the store.
 */
export type StoreValues<T extends ValidStore> = (values: {
  /**
   * Returns the current state of the store.
   *
   * `WritableState<T>` cannot be nullable, However, it's initially undefined when the store is
   * created because the state isn't yet initialized. This ensures that the state is always
   * accessible without needing constant null checks.
   */
  get: () => WritableState<T>;
}) => {
  // Disabled since it's okay to use this type here to map the values of the state.
  // deno-lint-ignore ban-types
  [K in keyof T]: T[K] extends Function ? T[K] : T[K] | ConfiguredValue<T[K]>;
};

/**
 * A store is a function that returns an atomic and encapsulated state. It can be read through
 * signals and written through actions.
 *
 * @template T - The type of the store.
 */
export interface Store<T extends ValidStore> {
  /**
   * Function to use the store.
   *
   * @template U - Key of the store to select.
   * @param selector - Key of the store to select.
   * @returns The value of the selected store key.
   */
  <U extends keyof T>(selector: U): ReadonlyState<T>[U];
  /**
   * Function to use the store.
   *
   * @returns The state of the store.
   */
  (): ReadonlyState<T>;
}
