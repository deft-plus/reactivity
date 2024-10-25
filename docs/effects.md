---
title: Reactivity Effects
description: Side-effect management for signals, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/effects
---

# Effects

`effect()` is a core function in the `@deft-plus/reactivity` module. It registers **side effects** that automatically run whenever the **signals** they depend on change. This makes effects a crucial part of your reactive application, where you want to react to changes in state (e.g., triggering DOM updates, fetching data, or performing other side effects).

## Table of Contents

- [Creating an Effect](#creating-an-effect)
- [Effect Cleanup](#effect-cleanup)
- [Immediate Effects](#immediate-effects)
- [Effect Context](#effect-context)
- [Further Reading](#further-reading)

## Creating an Effect

To create an effect, simply call `effect()` with a function that depends on one or more signals. The effect function will be re-executed every time the signal(s) it depends on change.

```typescript
import { effect, signal } from '@deft-plus/reactivity';

const counter = signal(0);

effect(() => {
  console.log('Counter:', counter());
});
```

In the example above, `effect()` is registered to the `counter` signal. Every time the value of `counter` changes, the effect will run and log the updated value.

```typescript
counter.set(1); // Outputs: "Counter: 1"
counter.set(2); // Outputs: "Counter: 2"
```

## Effect Cleanup

When working with effects, sometimes you need to perform **cleanup** operations to avoid memory leaks or other unwanted side effects, especially when working with timers, subscriptions, or external resources. You can return a cleanup function from an effect, which will run before the next effect execution.

```typescript
const effectRef = effect(() => {
  console.log('Counter:', counter());

  return () => {
    console.log('Cleanup');
  };
});

effectRef.destroy(); // Outputs: "Counter: 0"
```

In this example:

- Each time the `counter` value changes, the effect runs and logs the new value.
- The cleanup function (`return () => {}`) runs before the next effect, allowing you to clean up any side effects (e.g., clear a timeout, remove event listeners).

```typescript
counter.set(1); // Logs "Counter: 1", followed by "Cleanup"
counter.set(2); // Logs "Counter: 2", followed by "Cleanup"
```

## Immediate Effects

By default, an effect runs lazily, meaning it won't execute immediately when first registered. To force the effect to run immediately, you can use `effect.initial()`. This ensures the effect runs as soon as it's created, without waiting for any signal change.

```typescript
effect.initial(() => {
  console.log('Counter:', counter());
});
```

In this case, the effect will immediately log the current value of `counter` and will continue to run whenever the signal changes.

```typescript
counter.set(3); // Outputs: "Counter: 3"
```

### Combining Immediate Effects with Cleanup

You can also combine immediate execution with cleanup functionality:

```typescript
const effectRef = effect.initial(() => {
  console.log('Counter (initial):', counter());

  return () => {
    console.log('Initial Cleanup');
  };
});
// Outputs: "Counter (initial): 0" (immediately)
effectRef.destroy(); // Outputs: "Initial Cleanup"
```

This will ensure that the effect runs immediately upon registration, and cleanup is triggered as expected whenever the effect re-runs due to changes in dependencies.

## Effect Context

Effects are only triggered when their dependencies (i.e., signals) change. However, they won't track dependencies that are accessed in **untracked** contexts. You can control reactivity by deciding whether or not certain signals should trigger updates in the effect.

For more information on **untracked signals**, refer to the [Untracked Signals Documentation](/reactivity/untracked-signals).

## Further Reading

To explore more about how effects work in combination with signals and reactivity, check out these related sections:

- [Writable Signals](/reactivity/writable-signals): Learn about reactive values and how to create signals.
- [Memoized Signals](/reactivity/memoized-signals): Optimize derived values with memoization.
- [Untracked Signals](/reactivity/untracked-signals): Access signal values without triggering reactive updates.
- [Stores](/reactivity/stores): Learn how to encapsulate state and logic in stores.
