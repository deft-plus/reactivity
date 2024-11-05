---
title: Reactivity Untracked Signals
description: Access signal values without creating reactive dependencies.
url: /reactivity/untracked-signals
---

# Untracked Signals

In certain scenarios, you may want to access the value of a signal without creating a reactive dependency. The `signal.untracked()` method allows you to do this by retrieving the signal’s value without registering it as a dependency within a reactive context, such as an `effect`. This is useful when you want to prevent updates in a reactive function or computation that would normally respond to the signal’s changes.

## Table of Contents

- [Overview](#overview)
- [When to Use Untracked Signals](#when-to-use-untracked-signals)
- [Using `signal.untracked()`](#using-signaluntrack)
- [Examples](#examples)
- [Further Readings](#further-readings)

## Overview

### Purpose

Untracked signals allow you to:

- Access the current state of a signal without subscribing to its updates.
- Prevent unwanted reactivity, especially when only an initial or temporary value is needed.

### Use Case Scenarios

- **One-time Access**: When you only need to check a signal’s value once, such as for logging or initial configuration.
- **Temporary Checks in Effects**: In reactive functions where you want to perform a one-time check but avoid reactivity tied to that signal.

## When to Use Untracked Signals

Use `signal.untracked()` in cases where:

1. **Reactivity is Unnecessary**: Accessing a signal within an `effect` should not cause the `effect` to re-run when the signal’s value changes.
2. **One-time Evaluations**: You need a signal’s value temporarily, without triggering dependency tracking.

## Using `signal.untracked()`

Simply call `untracked()` on a signal to retrieve its value without registering it as a dependency.

### Example

```typescript
import { effect, signal } from '@deft-plus/reactivity';

const counter = signal(0);

effect(() => {
  // Access the signal without registering it as a dependency.
  const value = counter.untracked();
  console.log('Current counter:', value);
});
```

In this example:

- `counter.untracked()` retrieves the value of `counter` without setting up a reactive dependency.
- The `effect` will not re-run when `counter` changes, because `untracked()` prevents dependency tracking.

## Further Readings

For more advanced usage and best practices with signals and reactivity:

- [Writable Signals](/reactivity/writable-signals): Basics of creating and managing writable signals.
- [Memoized Signals](/reactivity/memoized-signals): Efficiently compute derived state.
- [Read-only Signals](/reactivity/readonly-signals): Restricting signal mutation for controlled state access.
