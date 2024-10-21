---
title: Stores
description: State management with signals and actions, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/stores
---

# Stores

Stores allow you to manage multiple reactive values in a cohesive, encapsulated structure. They are ideal for managing global or complex state, ensuring atomic updates and immutability.

## Why Use Stores?

- **Encapsulation**: Keep state and logic organized.
- **Atomic Updates**: Prevent unintended side effects.
- **Derived Values**: Easily compute values based on existing state.
- **Immutability**: Ensure state cannot be directly mutated, reducing bugs.

## Creating a Store

A store is an object containing signals and actions. It leverages signals internally to manage and update state reactively.

Example:

```typescript
import { store } from '@deft-plus/reactivity';

type CounterStore = {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
};

const counterStore = store<CounterStore>(({ get }) => ({
  count: 0,
  increment: () => get().count.update((count) => count + 1),
  decrement: () => get().count.update((count) => count - 1),
  reset: () => get().count.set(0),
}));

console.log(counterStore.count()); // 0
counterStore.increment();
console.log(counterStore.count()); // 1
```

## Working with Derived Values

Stores can include derived values that depend on other signals. These derived values are memoized and update automatically.

Example:

```typescript
import { store } from '@deft-plus/reactivity';

type CounterStore = {
  count: number;
  double: number;
  increment: () => void;
};

const counterStore = store<CounterStore>(({ get }) => ({
  count: 0,
  double: {
    value: () => get().count() * 2,
  },
  increment: () => get().count.update((count) => count + 1),
}));

console.log(counterStore.double()); // 0
counterStore.increment();
console.log(counterStore.double()); // 2
```

## Accessing Store State

The `get` function provides access to the store's internal signals and actions. Use it to retrieve the current state and trigger updates.

> **Note:** `get` is non-nullable to avoid constant null checks. However it will be null during the store initialization.
