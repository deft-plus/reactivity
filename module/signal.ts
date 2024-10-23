// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

/**
 * Contains the implementation for the {@link signal} function.
 *
 * A signal is a reactive value that can be read and watched for changes. This function creates a
 * signal that can be set or updated directly.
 *
 * @example Usage
 * ```ts
 * const counter = signal(0);
 *
 * console.log(counter()); // Logs: "0".
 *
 * counter.set(1);
 *
 * console.log(counter()); // Logs: "1".
 *
 * counter.update((value) => value + 1);
 *
 * console.log(counter()); // Logs: "2".
 *
 * counter.mutate((value) => value++);
 *
 * console.log(counter()); // Logs: "3".
 * ```
 *
 * @example Usage with options
 * ```ts
 * const counter = signal(0, {
 *   id: 'counter',
 *   log: true,
 *   equal: (a, b) => a === b,
 *   onChange: (value) => console.log(`Counter changed to: ${value}`),
 * });
 *
 * console.log(counter()); // Logs: "0".
 *
 * counter.set(1); // Logs: "Counter changed to: 1".
 *
 * console.log(counter()); // Logs: "1".
 *
 * counter.set(1); // No log.
 * ```
 *
 * @example Usage with events
 * ```ts
 * {
 *   using counter = signal(0, {
 *     allowEvents: true,
 *     onDispose: () => console.log('Cleanup logic'), // Cleanup logic.
 *   });
 *
 *   console.log(counter()); // Logs: "0".
 *
 *   counter.set(1);
 *
 *   console.log(counter()); // Logs: "1".
 *
 *   dispatchEvent(new CustomEvent(counter.identifier, { detail: 2 }));
 *
 *   console.log(counter()); // Logs: "2".
 * } // Logs: "Cleanup logic".
 * ```
 *
 * @module
 */

import type { WritableEventSignal } from './_api.ts';
import {
  defaultEquals,
  markAsSignal,
  type ReadonlySignal,
  type SignalEventOptions,
  type SignalOptions,
  type WritableSignal,
} from './_api.ts';
import { ReactiveNode } from './_reactive_node.ts';
import { untrackedSignal } from './untracked.ts';

/**
 * Create a signal that can be set or updated directly.
 *
 * @example Usage
 * ```ts
 * const counter = signal(0);
 *
 * console.log(counter()); // Logs: "0".
 *
 * counter.set(1);
 *
 * console.log(counter()); // Logs: "1".
 *
 * counter.update((value) => value + 1);
 *
 * console.log(counter()); // Logs: "2".
 *
 * counter.mutate((value) => value++);
 *
 * console.log(counter()); // Logs: "3".
 * ```
 *
 * @example Usage with options
 * ```ts
 * const counter = signal(0, {
 *   id: 'counter',
 *   log: true,
 *   equal: (a, b) => a === b,
 *   onChange: (value) => console.log(`Counter changed to: ${value}`),
 * });
 *
 * console.log(counter()); // Logs: "0".
 *
 * counter.set(1); // Logs: "Counter changed to: 1".
 *
 * console.log(counter()); // Logs: "1".
 *
 * counter.set(1); // No log.
 * ```
 *
 * @template T - The type of the signal value.
 * @param initialValue - The initial value of the signal.
 * @param options - The options for the signal.
 * @returns A writable signal.
 */
export function signal<T>(
  initialValue: T,
  options?: SignalOptions<T>,
): WritableSignal<T>;

/**
 * Create a signal that can be set or updated directly and that receives events.
 *
 * @example Usage
 * ```ts
 * {
 *   using counter = signal(0, {
 *     allowEvents: true,
 *     onDispose: () => console.log('Cleanup logic'), // Cleanup logic.
 *   });
 *
 *   console.log(counter()); // Logs: "0".
 *
 *   counter.set(1);
 *
 *   console.log(counter()); // Logs: "1".
 *
 *   dispatchEvent(new CustomEvent(counter.identifier, { detail: 2 }));
 *
 *   console.log(counter()); // Logs: "2".
 * } // Logs: "Cleanup logic".
 * ```
 *
 * @template T - The type of the signal value.
 * @param initialValue - The initial value of the signal.
 * @param options - The options for the signal.
 * @returns A writable signal.
 */
export function signal<T>(
  initialValue: T,
  options?: SignalEventOptions<T>,
): WritableEventSignal<T>;

/**
 * Create a signal that can be set or updated directly.
 *
 * @template T - The type of the signal value.
 * @param initialValue - The initial value of the signal.
 * @param options - The options for the signal.
 * @returns A writable signal.
 */
export function signal<T>(
  initialValue: T,
  options?: SignalEventOptions<T> | SignalOptions<T>,
): WritableSignal<T> | WritableEventSignal<T> {
  const {
    name = `signal_${Math.random().toString(36).slice(2)}`,
    log = false,
    equal = defaultEquals,
    subscribe = () => {},
    allowEvents = false as true,
    onDispose = () => {},
  } = (options ?? {}) as SignalEventOptions<T>;

  const node = new WritableSignalImpl(initialValue, {
    name,
    log,
    equal,
    subscribe,
    allowEvents,
    onDispose,
  });

  return markAsSignal('writable', node.signal.bind(node), {
    identifier: name,
    set: node.set.bind(node),
    update: node.update.bind(node),
    mutate: node.mutate.bind(node),
    readonly: node.readonly.bind(node),
    untracked: node.untracked.bind(node),
    toString: node.toString.bind(node),
    [Symbol.dispose]: node.dispose.bind(node),
  });
}

/**
 * A signal that can be set or updated directly.
 * @internal
 */
class WritableSignalImpl<T> extends ReactiveNode {
  constructor(
    private value: T,
    private options: Required<SignalEventOptions<T>>,
  ) {
    super();
    if (this.options.allowEvents) {
      this.listener = (event) => this.set((event as CustomEvent).detail);

      addEventListener(options.name, this.listener);
    }
  }

  /** Listener for events if allowed. */
  private listener: ((event: Event) => void) | null = null;

  /** The current value of the signal as read-only. */
  private readonlySignal?: ReadonlySignal<T>;

  /** Called when a dependency may have changed. */
  protected override onDependencyChange(): void {
    // Writable signals are not consumers, so this doesn't apply.
  }

  /** Called when a consumer checks if the producer's value has changed. */
  protected override onProducerMayChanged(): void {
    // Value versions are always up-to-date for writable signals.
  }

  /**
   * Set a new value for the signal and notify consumers if changed.
   *
   * @param newValue - The new value to set.
   */
  public set(newValue: T): void {
    if (!this.options.equal(this.value, newValue)) {
      const oldValue = this.value;
      this.value = newValue;
      this.valueVersion++;
      this.notifyConsumers();
      this.options.subscribe?.(this.value, oldValue);
    }
  }

  /**
   * Update the signal's value using the provided function.
   *
   * @param updater - The function to update the value.
   */
  public update(updater: (value: T) => T): void {
    this.set(updater(this.value));
  }

  /**
   * Apply a function to mutate the signal's value in-place.
   *
   * @param mutator - The function to mutate the value.
   */
  public mutate(mutator: (value: T) => void): void {
    const oldValue = this.value;
    mutator(this.value);
    this.valueVersion++;
    this.notifyConsumers();
    this.options.subscribe?.(this.value, oldValue);
  }

  /**
   * Returns a read-only signal derived from this signal.
   *
   * @returns A read-only signal.
   */
  public readonly(): ReadonlySignal<T> {
    if (!this.readonlySignal) {
      this.readonlySignal = markAsSignal<ReadonlySignal<T>>(
        'readonly',
        () => this.signal(),
        {
          untracked: () => this.untracked(),
        },
      );
    }

    return this.readonlySignal;
  }

  /**
   * Returns an untracked signal derived from this signal.
   *
   * @returns An untracked signal.
   */
  public untracked(): T {
    return untrackedSignal(() => this.signal());
  }

  /**
   * Returns the current value of the signal.
   *
   * @returns The current value of the signal.
   */
  public signal(): T {
    this.recordAccess();
    return this.value;
  }

  /**
   * Used to show the signal in console logs easily.
   *
   * @returns A string representation of the signal.
   */
  public override toString(): string {
    return `[Signal: ${JSON.stringify(this.signal())}]`;
  }

  /** Dispose of the signal and remove any event listeners. */
  public dispose(): void {
    if (this.options.allowEvents && this.listener) {
      this.options.onDispose?.();

      removeEventListener(this.options.name, this.listener);
    }
  }
}
