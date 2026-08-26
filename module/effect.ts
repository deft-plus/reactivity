// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

/**
 * Contains the implementation for the {@link effect} function.
 *
 * A reactive effect is a function that runs when changes are detected in its dependencies. It is
 * used to create side effects in a reactive graph. When a reactive effect is created, it is
 * scheduled to run whenever its dependencies change.
 *
 * @example Usage
 * ```ts
 * const effectRef = effect(() => {
 *   console.log('Signal changed:', signal());
 * });
 *
 * effectRef.destroy();
 *
 * // Manually destroy all effects.
 * effect.resetEffects();
 * ```
 *
 * @example Usage with initial execution
 * ```ts
 * // Run the effect one initial time and then re-schedule it on changes.
 * const effectRef = effect.initial(() => {
 *   console.log('Signal changed and run first time:', signal());
 * });
 *
 * effectRef.destroy();
 * ```
 *
 * @example Usage with dispose
 * ```ts
 * {
 *   // Run the effect one initial time and then re-schedule it on changes.
 *   using effectRef = effect(() => {
 *     console.log('Signal changed and run first time:', signal());
 *
 *     return () => console.log('Effect disposed');
 *   });
 * } // Logs: "Effect disposed".
 * ```
 *
 * @module
 */

import { ReactiveNode } from './_reactive_node.ts';

/**
 * Default no-op cleanup function.
 */
const NOOP_CLEANUP: EffectCleanup = () => {};

/**
 * Creates a reactive effect that runs the given callback function when changes are detected in its
 * dependencies.
 *
 * It also provides a way to manually destroy all effects.
 *
 * @example Usage
 * ```ts
 * const effectRef = effect(() => {
 *   console.log('Signal changed:', signal());
 * });
 *
 * effectRef.destroy();
 *
 * // Manually destroy all effects.
 * effect.resetEffects();
 * ```
 *
 * @param callback - The callback function ({@link EffectCallback}) to execute when changes are
 * detected.
 * @returns A reference ({@link EffectRef}) to the effect that can be manually destroyed.
 */
export function effect(callback: EffectCallback): EffectRef {
  const watch = new EffectImpl(callback);
  return watch.effect();
}

/**
 *  Creates a reactive effect that runs the given callback function immediately and then
 * re-schedules it on changes in its dependencies.
 *
 * @example Usage
 * ```ts
 * // Run the effect one initial time and then re-schedule it on changes.
 * const effectRef = effect.initial(() => {
 *   console.log('Signal changed and run first time:', signal());
 * });
 *
 * effectRef.destroy();
 * ```
 *
 * @param callback - The callback function ({@link EffectCallback}) to execute when changes are
 * detected.
 * @returns A reference ({@link EffectRef}) to the effect that can be manually destroyed.
 */
effect.initial = function (callback: EffectCallback): EffectRef {
  const watch = new EffectImpl(callback);
  return watch.effect(true);
};

/** Stop all active effects. */
effect.resetEffects = (): void => EffectImpl.resetEffects();

/**
 * Watches a reactive expression and schedules it to re-run when dependencies change.
 * @internal
 */
class EffectImpl extends ReactiveNode {
  /** Callback executed by this effect. */
  readonly #callback: EffectCallback;

  constructor(callback: EffectCallback) {
    super();
    this.#callback = callback;
  }

  /** Set of all active effects. */
  static #activeEffects = new Set<EffectImpl>();

  /** Set of effects scheduled for execution. */
  static #executionQueue = new Set<EffectImpl>();

  /** Promise that resolves when the execution queue is empty. */
  static #pendingQueue: PromiseWithResolvers<void> | null = null;

  /** Property to track if this watch is dirty and needs to be re-scheduled. */
  #dirty = false;

  /** Property to track the current tracking version. */
  #cleanupFn = NOOP_CLEANUP;

  /** Whether this effect has already been destroyed. */
  #destroyed = false;

  /** Stop all active effects. */
  static resetEffects(): void {
    for (const effect of EffectImpl.#activeEffects) {
      effect.#destroy();
    }
  }

  /** Called when a dependency may have changed. */
  override onDependencyChange(): void {
    this.#notify();
  }

  /**
   * Get the effect reference.
   *
   * @returns A reference to the effect ({@link EffectRef}).
   */
  effect(initial = false): EffectRef {
    EffectImpl.#activeEffects.add(this);

    if (initial) {
      this.#run();
    } else {
      // Schedule the effect to run.
      this.#notify();
    }

    return {
      destroy: () => this.#destroy(),
      [Symbol.dispose]: () => {
        this.#destroy();
      },
    };
  }

  /** Destroy this effect and run its cleanup function once. */
  #destroy(): void {
    if (this.#destroyed) {
      return;
    }

    this.#destroyed = true;
    EffectImpl.#activeEffects.delete(this);
    EffectImpl.#executionQueue.delete(this);
    this.#cleanup();
  }

  /** Notify that this watch needs to be re-scheduled. */
  #notify(): void {
    if (!this.#dirty) {
      this.#schedule();
    }

    this.#dirty = true;
  }

  /**
   * Executes the reactive expression within the context of this `Watch` instance. Should be called
   * by the scheduling function when `Watch.notify()` is triggered.
   */
  #run(): void {
    this.#dirty = false;

    if (this.trackingVersion !== 0 && !this.haveDependenciesChanged()) {
      return;
    }

    const previousConsumer = ReactiveNode.setActiveConsumer(this);
    this.trackingVersion++;

    try {
      this.#cleanupFn();
      this.#cleanupFn = this.#callback() ?? NOOP_CLEANUP;
    } finally {
      ReactiveNode.setActiveConsumer(previousConsumer);
    }
  }

  /** Run the cleanup function. */
  #cleanup(): void {
    const cleanupFn = this.#cleanupFn;
    this.#cleanupFn = NOOP_CLEANUP;
    cleanupFn();
  }

  /** Queue an effect for execution. */
  #schedule(): void {
    if (EffectImpl.#executionQueue.has(this) || !EffectImpl.#activeEffects.has(this)) {
      return;
    }

    EffectImpl.#executionQueue.add(this);

    if (EffectImpl.#pendingQueue === null) {
      Promise.resolve().then(this.#executeQueue);
      EffectImpl.#pendingQueue = Promise.withResolvers();
    }
  }

  /** Execute all queued effects. */
  #executeQueue(): void {
    for (const watch of EffectImpl.#executionQueue) {
      EffectImpl.#executionQueue.delete(watch);
      watch.#run();
    }

    EffectImpl.#pendingQueue?.resolve();
    EffectImpl.#pendingQueue = null;
  }
}

/** Cleanup function for a watch. */
export type EffectCleanup = () => void;

/** Callback for the `effect()` function, called when changes are detected. */
export type EffectCallback = () => void | EffectCleanup;

/** Reference to the reactive effect created. */
export interface EffectRef {
  /** Stop the effect and remove it from execution. */
  destroy: () => void;
  /** Dispose of the effect and clean up all event listeners. */
  [Symbol.dispose]: () => void;
}

/**
 * Function that takes a callback and calls it when changes are detected in its dependencies. Then
 * returns a reference to a reactive effect that can be manually destroyed.
 */
export type EffectHandler = (callback: EffectCallback) => EffectRef;

/** A factory function for creating, stopping, and resetting effects. */
export interface EffectFactory extends EffectHandler {
  /** Stop all active effects. */
  resetEffects: () => void;
  /** Immediately run the effect and then re-schedule it on changes. */
  initial: EffectHandler;
}
