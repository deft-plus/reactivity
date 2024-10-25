---
title: Reactivity Stores
description: State management with signals and actions, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/stores
---

# Stores

Stores provide a powerful way to manage collections of reactive values in a cohesive, encapsulated structure. They are especially useful for handling global or complex state by ensuring atomic updates, encapsulated logic, and immutability. Stores integrate seamlessly with signals, allowing state to update reactively while maintaining control over data flow and accessibility.

## Table of Contents

- [Why Use Stores?](#why-use-stores)
- [Creating a Store](#creating-a-store)
- [Working with Derived Values](#working-with-derived-values)
- [Accessing Store State](#accessing-store-state)
- [Further Reading](#further-reading)

## Why Use Stores?

Stores offer several advantages for managing state in a reactive application:

- **Encapsulation**: Organize state and related logic in a single, self-contained structure, making code modular and maintainable.
- **Atomic Updates**: Prevent unintended side effects by grouping related state updates.
- **Derived Values**: Compute values based on other reactive data, automatically updating whenever the underlying data changes.
- **Immutability**: Ensure state cannot be directly mutated, reducing bugs and enhancing predictability.

Stores are ideal for scenarios where state is shared across components or where complex state logic needs central management.

## Creating a Store

A store is essentially an object that holds signals, derived values, and actions. Using the `store` function, you can define a store that leverages signals internally to manage and update state reactively.

### Example

The following example demonstrates creating a store for managing a counter with actions to increment, decrement, and reset the count:

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

console.log(counterStore.count()); // Outputs: 0
counterStore.increment();
console.log(counterStore.count()); // Outputs: 1
```

In this example:

- The store `counterStore` encapsulates the counter’s state and logic.
- Actions like `increment`, `decrement`, and `reset` provide a controlled way to interact with the state.
- `count` is a signal that holds the current count, updating reactively as actions are called.

## Working with Derived Values

Stores can also define **derived values**, which are memoized values computed based on other signals. These derived values automatically update when their dependencies change, making it easy to create dynamic, computed data within your store.

### Example

The following example demonstrates a derived value that computes `double`, a value twice the count:

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
    // Additional options can be passed to the signal if needed...
  },
  increment: () => get().count.update((count) => count + 1),
}));

console.log(counterStore.double()); // Outputs: 0
counterStore.increment();
console.log(counterStore.double()); // Outputs: 2
```

Here:

- `double` is a derived value, recalculating whenever `count` changes.
- This pattern is useful for deriving computed state based on primary store values without direct manipulation.

## Accessing Store State

The `get` function provides access to the store's internal signals and actions. This function is essential for retrieving the current state or triggering updates.

> **Note:** While `get` is generally non-nullable for consistency, it will initially be `null` during the store’s initialization phase. Ensure that your store logic accounts for this initial state if accessing `get` early in the setup.

## Further Reading

For more information on working with signals, effects, and derived values, check out the following:

- [Writable Signals](/reactivity/writable-signals): Basics of reactive state with signals.
- [Effects](/reactivity/effects): Responding to changes in signal state with side effects.
- [Memoized Signals](/reactivity/memoized-signals): Optimizing computed values with memoization.
