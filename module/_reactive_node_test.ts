// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { expect } from '@std/expect';
import { ReactiveNode } from './_reactive_node.ts';

class TestReactiveNode extends ReactiveNode {
  public dependencyChanges = 0;

  public get hasDependencies(): boolean {
    return this.hasProducers;
  }

  public read(): void {
    this.recordAccess();
  }

  public write(): void {
    this.valueVersion++;
    this.notifyConsumers();
  }

  public track(read: () => void): void {
    const previousConsumer = ReactiveNode.setActiveConsumer(this);
    this.trackingVersion++;
    try {
      read();
    } finally {
      ReactiveNode.setActiveConsumer(previousConsumer);
    }
  }

  public dependenciesChanged(): boolean {
    return this.haveDependenciesChanged();
  }

  public checkForProducerChanges(): void {
    this.onProducerMayChanged();
  }

  protected override onDependencyChange(): void {
    this.dependencyChanges++;
  }
}

class ReadingConsumerNode extends TestReactiveNode {
  public constructor(private producer: TestReactiveNode) {
    super();
  }

  protected override onDependencyChange(): void {
    this.producer.read();
  }
}

class DefaultReactiveNode extends ReactiveNode {
  public notifyDependencyChange(): void {
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
