// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { expect } from '@std/expect';
import { ReactiveNode } from './_reactive_node.ts';

class TestReactiveNode extends ReactiveNode {
  dependencyChanges = 0;

  get hasDependencies(): boolean {
    return this.hasProducers;
  }

  read(): void {
    this.recordAccess();
  }

  write(): void {
    this.valueVersion++;
    this.notifyConsumers();
  }

  track(read: () => void): void {
    const previousConsumer = ReactiveNode.setActiveConsumer(this);
    this.trackingVersion++;
    try {
      read();
    } finally {
      ReactiveNode.setActiveConsumer(previousConsumer);
    }
  }

  dependenciesChanged(): boolean {
    return this.haveDependenciesChanged();
  }

  checkForProducerChanges(): void {
    this.onProducerMayChanged();
  }

  override onDependencyChange(): void {
    this.dependencyChanges++;
  }
}

class ReadingConsumerNode extends TestReactiveNode {
  readonly #producer: TestReactiveNode;

  constructor(producer: TestReactiveNode) {
    super();
    this.#producer = producer;
  }

  override onDependencyChange(): void {
    this.#producer.read();
  }
}

class DefaultReactiveNode extends ReactiveNode {
  notifyDependencyChange(): void {
    this.onDependencyChange();
  }
}

Deno.test('ReactiveNode() should report tracked dependencies', () => {
  const producer = new TestReactiveNode();
  const consumer = new TestReactiveNode();

  expect(consumer.hasDependencies).toBe(false);
  consumer.track(() => producer.read());
  expect(consumer.hasDependencies).toBe(true);
});

Deno.test('ReactiveNode.haveDependenciesChanged() should remove stale dependencies', () => {
  const staleProducer = new TestReactiveNode();
  const activeProducer = new TestReactiveNode();
  const consumer = new TestReactiveNode();

  consumer.track(() => staleProducer.read());
  consumer.track(() => activeProducer.read());

  expect(consumer.dependenciesChanged()).toBe(false);

  staleProducer.write();
  expect(consumer.dependencyChanges).toBe(0);
  expect(consumer.hasDependencies).toBe(true);
});

Deno.test('ReactiveNode.recordAccess() should reject reads during notification', () => {
  const producer = new TestReactiveNode();
  const consumer = new ReadingConsumerNode(producer);
  consumer.track(() => producer.read());

  expect(() => producer.write()).toThrow('Cannot read signals during notification phase.');
});

Deno.test('ReactiveNode.onProducerMayChanged() should default to a no-op', () => {
  const node = new TestReactiveNode();

  expect(() => node.checkForProducerChanges()).not.toThrow();
});

Deno.test('ReactiveNode.onDependencyChange() should default to a no-op', () => {
  const node = new DefaultReactiveNode();

  expect(() => node.notifyDependencyChange()).not.toThrow();
});
