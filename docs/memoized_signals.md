---
title: Reactivity Memoization
description: Optimize reactive state management with memoized signals that automatically update based on dependencies.
url: /reactivity/memoized-signals
---

# Memoized Signals

Memoized signals provide an efficient way to manage derived state in your application. By using `memoSignal()`, you can create signals that automatically update based on their dependencies while only re-running calculations when those dependencies change. Memoized signals help optimize performance by reducing unnecessary updates and reactivity overhead.

## Table of Contents

- [Creating a Memoized Signal](#creating-a-memoized-signal)
- [Equality Comparators](#equality-comparators)
- [Change Callbacks](#change-callbacks)
- [Example Use Case](#example-use-case)
- [Further Reading](#further-reading)

## Creating a Memoized Signal

To create a memoized signal, pass a function to `memoSignal()`. This function should depend on one or more reactive signals. The memoized signal will automatically re-compute whenever any of its dependencies change, only if the new value differs from the previous one.

```typescript
import { memoSignal, signal } from '@deft-plus/reactivity';

const counter = signal(0);

// Create a memoized signal that depends on `counter`
const isEven = memoSignal(() => counter() % 2 === 0);

console.log(isEven()); // Outputs: true or false depending on `counter`
```

In this example:

- `isEven` is a memoized signal that recalculates its value based on the current `counter` value.
- When `counter` changes, `isEven` will re-evaluate, but only if the new calculation produces a different result.

```typescript
counter.set(1); // `isEven` recalculates and returns false
counter.set(2); // `isEven` recalculates and returns true
```

## Equality Comparators

You can configure memoized signals with a custom **equality comparator** to prevent unnecessary updates. By default, memoized signals use strict equality (`===`). For more complex cases, such as comparing objects or arrays, you can pass a custom comparator function as an option.

```typescript
const isPositive = memoSignal(
  () => counter() > 0,
  {
    equals: (a, b) => a === b,
  },
);
```

In this example:

- The `equals` option ensures that `isPositive` only updates when the boolean result of `counter > 0` actually changes. This is useful if you want to prevent unnecessary reactivity updates and optimize performance.

## Subscribe hook

The `memoSignal` function allows you to attach an `subscribe` hook that triggers whenever the memoized signal’s value changes. This is particularly useful for logging, triggering side effects, or connecting reactive values to other parts of the application.

```typescript
const evenLogger = memoSignal(() => counter() % 2 === 0, {
  subscribe: (newValue, oldValue) => {
    console.log(`Value changed from ${oldValue} to ${newValue}`);
  },
});
```

In this example:

- The `subscribe` hook will log whenever the `evenLogger` signal changes its state, making it useful for debugging or triggering side effects based on changes.

## Example Use Case

Memoized signals are ideal for cases where derived state relies on multiple signals and you want to avoid redundant recalculations. For example, in a counter app:

```typescript
import { memoSignal, signal } from '@deft-plus/reactivity';

const counter = signal(0);
const isOdd = memoSignal(() => counter() % 2 !== 0);
const message = memoSignal(() => `The counter is ${isOdd() ? 'odd' : 'even'}.`);

console.log(message()); // Outputs: "The counter is even."

counter.set(1);
console.log(message()); // Outputs: "The counter is odd."
```

In this example:

- `message` depends on `isOdd`, which in turn depends on `counter`.
- The `message` memoized signal only updates when `isOdd` changes, improving efficiency by reducing the need for re-computation.

## Further Reading

For more on how memoized signals interact with other parts of the framework, refer to:

- [Writable Signals](/reactivity/writable-signals): Learn the basics of reactive signals.
- [Effects](/reactivity/effects): Automatically react to signal changes.
- [Untracked Signals](/reactivity/untracked-signals): Access signal values without triggering reactive updates.
