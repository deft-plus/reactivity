---
title: Reactivity Basics
description: Learn the basics of reactivity, including creating writable, read-only, and memoized signals.
url: /reactivity/basics
---

# Reactivity

This module provide a mechanism to create **reactive values** that automatically notify consumers when their value changes. They enable **fine-grained reactivity** and **lazy evaluation**, making them perfect for applications where performance and responsiveness are critical.

## Table of Contents

- [Installation](#installation)
- [Basics](#basics)
  - [Creating a Writable Signal](#creating-a-writable-signal)
  - [Signal Example](#signal-example)
  - [Read-Only Signals](#read-only-signals)
  - [Memoized Signals](#memoized-signals)
  - [Untracked Signals](#untracked-signals)
- [Further Reading](#further-reading)

## Installation

To use the reactivity features, first, install the `@deft-plus/reactivity` package.

**Using Deno:**

```bash
deno add @deft-plus/reactivity
```

**Using npm:**

```bash
npx jsr add @deft-plus/reactivity
```

## Basics

A **signal** is a function (`() => T`) that holds a reactive value and returns its current state. Signals don't produce side effects when read but will automatically recompute their value **lazily** when they are used in **reactive contexts**.

### Creating a Writable Signal

To create a writable signal, use the `signal()` function. A writable signal allows the value to be updated and automatically triggers dependent consumers when its value changes.

```typescript
import { signal } from '@deft-plus/reactivity';

const counter = signal(0);
```

This creates a signal that starts with a value of `0`. You can read the current value of the signal by calling the signal function:

```typescript
console.log(counter()); // Outputs: 0
```

### Signal Example

Writable signals allow you to modify their value using:

- **`set(value)`**: Sets the signal to a specific value.
- **`update(func)`**: Updates the signal by applying a function to its current value.
- **`mutate(func)`**: Directly modifies the value for mutable structures (like arrays or objects).

```typescript
counter.set(2);
counter.update((count) => count + 1);
counter.mutate((tasks) => tasks.push({ title: 'New Task' }));

console.log(counter()); // Outputs: 3
```

In the example above:

- `set(2)` sets the counter to `2`.
- `update` adds `1` to the current value.
- `mutate` can be used for more complex updates when the signal stores objects or arrays.

To learn more about creating writable signals, check the [Writable Signals Documentation](/reactivity/writable-signals).

For more complex state management, consider using a `store`, which allows encapsulating signals and state logic into a cohesive structure. Check the [Stores Documentation](/reactivity/stores) for more details.

### Read-Only Signals

Use the `readonly()` method to create a **read-only** signal. This ensures that consumers can access the value but cannot modify it.

```typescript
const readonlyCounter = signal(0).readonly();

console.log(readonlyCounter()); // Outputs: 0
readonlyCounter.set(2); // Error: set is not allowed on a readonly signal
```

For more information, check the [Read-Only Signals Documentation](/reactivity/readonly-signals).

### Memoized Signals

Sometimes you need signals that derive their values from other reactive sources. In such cases, you can use `memoSignal()` to create memoized signals that depend on other signals or values.

A memoized signal will automatically recompute its value when its dependencies change, but only when it is accessed, promoting lazy evaluation.

```typescript
import { memoSignal } from '@deft-plus/reactivity';

const count = signal(0);
const isEven = memoSignal(() => count() % 2 === 0);

console.log(isEven()); // true
count.set(1);
console.log(isEven()); // false
```

To dive deeper, check out the full documentation on [Memoized Signals](/reactivity/memoized-signals).

### Untracked Signals

Sometimes you want to access a signal's value without triggering any reactivity in the context. This is where **untracked signals** come into play. Use `signal().untrack()` to access the value without registering it as a dependency.

```typescript
const untrackedValue = signal(10).untracked();

console.log(untrackedValue()); // Outputs: 10
```

See more details on untracked signals check the [Untracked Signals Documentation](/reactivity/untracked-signals).

### Event Signals

You can also use events to trigger signal updates. Just dispatch an event with the signal's name and the new value.

Example:

```typescript
import { signal } from '@deft-plus/reactivity';

using counter = signal(0, { name: 'counter', allowEvents: true });

dispatchEvent(new CustomEvent('counter', { detail: 1 }));

console.log(counter()); // 1
```

This allows you to update signals from event listeners, making it easy to integrate with other parts of your application. It also uses the Dispose pattern to clean up event listeners when the signal is disposed. You can also use the `onDispose` hook to run cleanup code when the signal is disposed.

Example:

```typescript
import { signal } from '@deft-plus/reactivity';
{
  using counter = signal(0, {
    name: 'counter',
    allowEvents: true,
    onDispose: () => {
      console.log('Disposed');
    },
  });

  dispatchEvent(new CustomEvent('counter', { detail: 1 }));

  console.log(counter()); // 1
} // Logs: "Disposed"
```

## Further Reading

Explore the other functionalities and features of signals and reactivity in the following sections:

- [Effects](/reactivity/effects): Register side effects that respond to signal changes.
- [Stores](/reactivity/stores): Manage state using stores that encapsulate multiple reactive signals.
- [toSignal()](/reactivity/to-signal): Convert promises or asynchronous values into signals that represent their resolved state.
