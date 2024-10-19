// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

/**
 * Contains the {@link ReactiveNode} class, which represents a node in the reactive graph and
 * provides the core functionality for reactivity.
 *
 * @module
 */

/**
 * Represents a node in the reactive graph. Nodes can act as producers, consumers, or both.
 */
export abstract class ReactiveNode {
  /** Counter for generating unique IDs for producers and consumers. */
  private static nextId = 0;

  /** The currently active reactive consumer, or `null` if none. */
  private static activeConsumer: ReactiveNode | null = null;

  /** Whether change notifications are currently being propagated. */
  private static notifying = false;

  /** Unique identifier for this node. */
  private readonly id = ReactiveNode.nextId++;

  /** Weak reference to this node, used in dependencies. */
  private readonly ref = new WeakRef(this);

  /** Dependencies of this node as a producer. */
  private readonly producers = new Map<number, Dependency>();

  /** Dependencies of this node as a consumer. */
  private readonly consumers = new Map<number, Dependency>();

  /** Version of the consumer's dependencies. */
  protected trackingVersion = 0;

  /** Version of the producer's value. */
  protected valueVersion = 0;

  /** Whether this consumer has any producers. */
  protected get hasProducers(): boolean {
    return this.producers.size > 0;
  }

  /**
   * Sets the active reactive consumer and returns the previous one.
   *
   * @param consumer - The new reactive consumer ({@link ReactiveNode}) or `null`.
   * @returns The previous reactive consumer ({@link ReactiveNode}) or `null` if none.
   * @internal
   */
  public static setActiveConsumer(consumer: ReactiveNode | null): ReactiveNode | null {
    const previous = ReactiveNode.activeConsumer;
    ReactiveNode.activeConsumer = consumer;
    return previous;
  }

  /** Called when a dependency may have changed. */
  protected abstract onDependencyChange(): void;

  /** Called when a consumer checks if the producer's value has changed. */
  protected abstract onProducerMayChanged(): void;

  /**
   * Checks if any of this node's dependencies have actually changed.
   *
   * @returns `true` if any dependencies have changed, `false` otherwise.
   */
  protected haveDependenciesChanged(): boolean {
    for (const [producerId, dependency] of this.producers) {
      const producer = dependency.producerRef.deref();

      if (producer === undefined || dependency.consumerVersion !== this.trackingVersion) {
        // Dependency is stale; remove it.
        this.producers.delete(producerId);
        producer?.consumers.delete(this.id);
        continue;
      }

      if (producer.haveValueChanged(dependency.producerVersion)) {
        return true;
      }
    }

    return false;
  }

  /** Notifies consumers that this producer's value may have changed. */
  protected notifyConsumers(): void {
    const wasNotifying = ReactiveNode.notifying;
    ReactiveNode.notifying = true;
    try {
      for (const [consumerId, dependency] of this.consumers) {
        const consumer = dependency.consumerRef.deref();
        if (consumer === undefined || consumer.trackingVersion !== dependency.consumerVersion) {
          this.consumers.delete(consumerId);
          consumer?.producers.delete(this.id);
          continue;
        }

        consumer.onDependencyChange();
      }
    } finally {
      ReactiveNode.notifying = wasNotifying;
    }
  }

  /** Records that this producer node was accessed in the current context. */
  protected recordAccess(): void {
    if (ReactiveNode.notifying) {
      throw new Error('Cannot read signals during notification phase.');
    }

    if (ReactiveNode.activeConsumer === null) {
      return;
    }

    let dependency = ReactiveNode.activeConsumer.producers.get(this.id);
    if (dependency === undefined) {
      dependency = {
        consumerRef: ReactiveNode.activeConsumer.ref,
        producerRef: this.ref,
        producerVersion: this.valueVersion,
        consumerVersion: ReactiveNode.activeConsumer.trackingVersion,
      };
      ReactiveNode.activeConsumer.producers.set(this.id, dependency);
      this.consumers.set(ReactiveNode.activeConsumer.id, dependency);
    } else {
      dependency.producerVersion = this.valueVersion;
      dependency.consumerVersion = ReactiveNode.activeConsumer.trackingVersion;
    }
  }

  /**
   * Checks if the producer's value has changed compared to the last recorded version.
   *
   * @param lastSeenVersion - The last version of the value seen by the consumer.
   * @returns `true` if the value has changed, `false` otherwise.
   */
  private haveValueChanged(lastSeenVersion: number): boolean {
    if (this.valueVersion !== lastSeenVersion) {
      return true;
    }

    this.onProducerMayChanged();
    return this.valueVersion !== lastSeenVersion;
  }
}

/** Representation of a dependency between a producer and a consumer. */
type Dependency = {
  /** Reference to the producer node. */
  readonly producerRef: WeakRef<ReactiveNode>;
  /** Reference to the consumer node. */
  readonly consumerRef: WeakRef<ReactiveNode>;
  /** Version of the consumer when this dependency was last observed. */
  consumerVersion: number;
  /** Version of the producer's value when this dependency was last accessed. */
  producerVersion: number;
};
