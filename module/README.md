# 🎯 Reactivity

[![JSR](https://jsr.io/badges/@deft-plus/reactivity)](https://jsr.io/@deft-plus/reactivity) [![JSR Score](https://jsr.io/badges/@deft-plus/reactivity/score)](https://jsr.io/@deft-plus/reactivity)

The `@deft-plus/reactivity` module combines the power of reactive signals and stores to manage both individual reactive values and global state in your application. With this module, you can create reactive values (signals), manage derived values, and encapsulate state in stores, all with minimal boilerplate and a functional programming style.

## Installation

Install the `@deft-plus/reactivity` package using deno:

```bash
deno add @deft-plus/reactivity
```

Or using npm:

```bash
npx jsr add @deft-plus/reactivity
```

## Signals

Signals provide a way to create reactive values that automatically notify consumers when their value changes. They allow for fine-grained reactivity and lazy evaluation, making them ideal for performance-sensitive applications.

### Basics

A signal is a function (`() => T`) that returns its current value. It doesn't trigger side effects but may recompute values lazily.

**Reactive Contexts:** When a signal is accessed in a reactive context, it registers as a dependency. The context updates when any signal it depends on changes.

### Writable Signals

Use `signal()` to create a `WritableSignal`. Writable signals allow updating their value using:

- `.set(value)`: Update the signal's value.
- `.update(func)`: Update using a function.
- `.mutate(func)`: Modify the current value directly.

Example:

```typescript
import { signal } from '@deft-plus/reactivity';

const counter = signal(0);

counter.set(2);
counter.update((count) => count + 1);
counter.mutate((list) => list.push({ title: 'New Task' }));
```

**Equality Comparator:** Optionally, provide a function to compare new and old values to prevent unnecessary updates.

### Read-Only Signals

Create a read-only signal with `signal(value).readonly()`. It restricts mutation and only allows access to the value.

Example:

```typescript
const readonlyCounter = signal(0).readonly();
```

### Memoized Signals

Use `memoSignal()` to create memoized signals that automatically update based on dependencies.

Example:

```typescript
import { memoSignal } from '@deft-plus/reactivity';

const isEven = memoSignal(() => counter() % 2 === 0);
```

Memoized signals can be configured with an equality comparator to prevent unnecessary updates and an `onChange` callback to run when the value changes.

### Promised Signals

`signalFromPromise()` creates signals that represent asynchronous values. The signal resolves to a promise and exposes a `status` property.

Example:

```typescript
import { signalFromPromise } from '@deft-plus/reactivity';

// Function parameter.
const data = signalFromPromise(async () => {
  const response = await fetch('https://api.example.com/data');
  return response.json();
});

// Promise parameter.
const data = signalFromPromise(
  fetch('https://api.example.com/data')
    .then((response) => response.json()),
);
```

### Effects

`effect()` registers side effects that run whenever the signals they depend on change. Effects can be cleaned up by returning a cleanup function.

Example:

```typescript
import { effect, signal } from '@deft-plus/reactivity';

const counter = signal(0);

effect(() => {
  console.log('Counter:', counter());
  return () => console.log('Cleanup');
});

// Run effect immediately.
effect.initial(() => {
  console.log('Counter:', counter());
});
```

### Untracked Signals

Use `signal.untrack()` to access a signal's value without registering it as a dependency in a reactive context.

---

## Stores

Stores allow you to manage multiple reactive values in a cohesive, encapsulated structure. They are ideal for managing global or complex state, ensuring atomic updates and immutability.

### Why Use Stores?

- **Encapsulation**: Keep state and logic organized.
- **Atomic Updates**: Prevent unintended side effects.
- **Derived Values**: Easily compute values based on existing state.
- **Immutability**: Ensure state cannot be directly mutated, reducing bugs.

### Creating a Store

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

### Working with Derived Values

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

### Accessing Store State

The `get` function provides access to the store's internal signals and actions. Use it to retrieve the current state and trigger updates.

> **Note:** `get` ensures non-nullable access to the store's state, avoiding constant null checks.

---

## Summary

`@deft-plus/reactivity` unifies signals and stores, providing a flexible, efficient way to manage both individual reactive values and global state. With signals, you get fine-grained reactivity and lazy evaluation. With stores, you encapsulate state and logic, making it easy to maintain complex state while ensuring immutability and performance.
