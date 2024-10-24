// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

/**
 * Contains the implementation for the {@link memoSignal} function.
 *
 * A memoized signal is a signal that computes the value based on dependencies. The value is cached
 * until dependencies change.
 *
 * @example Usage
 * ```ts
 * const counter = signal(1);
 * const doubleCounter = memoSignal(() => counter() * 2);
 *
 * console.log(doubleCounter()); // Logs: "2".
 *
 * // The value is cached until dependencies change.
 * counter.set(2);
 *
 * console.log(doubleCounter()); // Logs: "4".
 * ```
 *
 * @module
 */

import {
  defaultEquals,
  markAsSignal,
  type MemoizedSignal,
  type MemoizedSignalOptions,
} from './_api.ts';
import { ReactiveNode } from './_reactive_node.ts';
import { untrackedSignal } from './untracked.ts';

/**
 * Symbol for a memoized value that hasn't been computed yet.
 * @internal
 */
const UNSET = Symbol('UNSET');

/**
 * Symbol indicating a computation is in progress. Used to detect cycles.
 * @internal
 */
const COMPUTING = Symbol('COMPUTING');

/**
 * Symbol indicating a computation failed. The error is cached until the value is recomputed.
 * @internal
 */
const ERRORED = Symbol('ERRORED');

/**
 * Creates a memoized signal that computes the value and caches it until dependencies change.
 *
 * @example Usage
 * ```ts
 * const counter = signal(1);
 * const doubleCounter = memoSignal(() => counter() * 2);
 *
 * console.log(doubleCounter()); // Logs: "2".
 *
 * // The value is cached until dependencies change.
 * counter.set(2);
 *
 * console.log(doubleCounter()); // Logs: "4".
 * ```
 *
 * @template T - The type of the value returned by the signal.
 * @param compute - Computation function to derive the value.
 * @param options - Options for the memoized signal ({@link MemoizedSignalOptions}).
 * @returns A memoized signal ({@link MemoizedSignal}) that computes the value on demand.
 */
export function memoSignal<T>(
  compute: () => T,
  options?: MemoizedSignalOptions<T>,
): MemoizedSignal<T> {
  const {
    name = `memo_signal_${Math.random().toString(36).slice(2)}`,
    log = Deno.env.get('SIGNAL_LOG') === 'true',
    equal = defaultEquals,
    subscribe = () => {},
  } = options ?? {};

  const node = new MemoizedSignalImp(compute, { name, log, equal, subscribe });

  return markAsSignal('memoized', node.signal.bind(node), {
    untracked: node.untracked.bind(node),
    toString: node.toString.bind(node),
  });
}

/**
 * A computation node that derives a value from a reactive expression.
 * @internal
 */
class MemoizedSignalImp<T> extends ReactiveNode {
  constructor(
    private compute: () => T,
    private options: Required<MemoizedSignalOptions<T>>,
  ) {
    super();
  }

  /** Current value of the computation or one of the special symbols. */
  private value: MemoizedValue<T> = UNSET;

  /** Error from the last computation if it failed. */
  private error: unknown = null;

  /** Flag indicating if the value is stale. */
  private stale = true;

  /** Called when a dependency may have changed. */
  protected override onDependencyChange(): void {
    if (this.stale) {
      return; // If already stale, no need to reprocess. This also allow batching changes.
    }

    this.stale = true; // Mark the value as stale.
    this.notifyConsumers(); // Notify consumers about potential change.
  }

  /** Called when a consumer checks if the producer's value has changed. */
  protected override onProducerMayChanged(): void {
    if (!this.stale) {
      return; // If not stale, no update needed.
    }

    // If dependencies haven't changed, resolve stale.
    if (
      this.value !== UNSET &&
      this.value !== COMPUTING &&
      !this.haveDependenciesChanged()
    ) {
      this.stale = false;
      return;
    }

    // Recompute the value as it is stale.
    this.recomputeValue();
  }

  /**
   * Get the current value of the signal without creating a dependency.
   *
   * @returns The current value of the signal without creating a dependency.
   */
  public untracked(): T {
    return untrackedSignal(() => this.signal()); // Use untracked utility to access value.
  }

  /**
   * Get the current value of the signal.
   *
   * @returns The current value of the signal.
   */
  public signal(): T {
    this.onProducerMayChanged();
    this.recordAccess();

    if (this.value === ERRORED) {
      throw this.error;
    }

    return this.value as T;
  }

  /** Recomputes the value if needed. */
  private recomputeValue(): void {
    if (this.value === COMPUTING) {
      throw new Error('Cycle detected in computations.'); // Prevent infinite loops.
    }

    const previousValue = this.value;
    this.value = COMPUTING;

    this.trackingVersion++;
    const previousConsumer = ReactiveNode.setActiveConsumer(this);
    let newValue: MemoizedValue<T>;

    try {
      newValue = this.compute();
    } catch (err) {
      newValue = ERRORED;
      this.error = err;
    } finally {
      ReactiveNode.setActiveConsumer(previousConsumer);
    }

    this.stale = false;

    // Update value if there is a change.
    if (
      previousValue !== UNSET &&
      previousValue !== ERRORED &&
      newValue !== ERRORED &&
      this.options.equal(previousValue, newValue)
    ) {
      this.value = previousValue; // Keep old value if new value is equivalent.
      return;
    }

    const oldValue = this.value;
    this.value = newValue;
    this.valueVersion++;

    if (this.options.log) {
      super.log({
        type: 'MemoSignal',
        name: this.options.name,
        newValue: this.value,
        oldValue,
      });
    }

    this.options.subscribe(this.value as T, oldValue as T);
  }

  /**
   * Used to show the signal in console logs easily.
   *
   * @returns A string representation of the signal.
   */
  public override toString(): string {
    return `[MemoSignal: ${JSON.stringify(this.signal())}]`;
  }
}

/**
 * Possible values for a memoized signal.
 *
 * @template T - The type of the value returned by the signal.
 */
type MemoizedValue<T> = T | typeof UNSET | typeof COMPUTING | typeof ERRORED;
