---
title: Reactivity Writable Signals
description: Manage mutable, reactive state with writable signals.
url: /reactivity/writable-signals
---

# Writable Signals

Writable signals are core to managing mutable, reactive state in a controlled way. Created using `signal()`, writable signals provide flexible methods to set, update, and mutate their value. Additionally, you can supply a custom equality comparator to optimize updates by preventing redundant reactivity when the value hasn’t actually changed.

## Table of Contents

- [Overview](#overview)
- [Creating a Writable Signal](#creating-a-writable-signal)
- [Updating Writable Signals](#updating-writable-signals)
- [Using an Equality Comparator](#using-an-equality-comparator)
- [Examples](#examples)
- [Further Readings](#further-readings)

## Overview

### Purpose

Writable signals allow:

- **Direct Updates**: Easily modify state reactively.
- **Flexible Mutations**: Update or mutate state using functions for greater flexibility.
- **Fine-grained Reactivity Control**: Control when and how signals update with an optional equality comparator.

### Key Features

- **Immutability Options**: Choose between directly setting, updating with functions, or mutating the current state.
- **Optional Equality Comparison**: Prevent unnecessary updates by providing a custom comparator function.

## Creating a Writable Signal

To create a writable signal, use `signal(initialValue)`, where `initialValue` is the starting state of the signal.

```typescript
import { signal } from '@deft-plus/reactivity';

const counter = signal(0);
```

## Updating Writable Signals

Writable signals offer three primary methods for updating their state:

### `.set(value)`

Directly set the signal to a new value.

```typescript
counter.set(2); // Sets counter to 2
```

### `.update(func)`

Update the signal by passing a function that receives the current value and returns the updated value.

```typescript
counter.update((count) => count + 1); // Increments counter by 1
```

### `.mutate(func)`

For objects or arrays, `mutate` allows you to modify the current value directly without replacing it, which is useful for collections or deeply nested data structures.

```typescript
const tasks = signal([{ title: 'Initial Task' }]);
tasks.mutate((list) => list.push({ title: 'New Task' }));
```

> **Note:** `mutate` is best used when direct modification is necessary; otherwise, prefer `update` or `set` for immutable updates.

## Using an Equality Comparator

Writable signals support an optional equality comparator, allowing you to control updates by comparing the new and old values. If the comparator returns `true`, the update will be skipped.

### Example with Equality Comparator

```typescript
const counter = signal(0, {
  equals: (newValue, oldValue) => newValue === oldValue,
});

counter.set(0); // No reactivity triggered, as value hasn't changed.
```

## Examples

```typescript
import { signal } from '@deft-plus/reactivity';

// Create a writable signal with an initial value.
const counter = signal(0);

// Setting a new value.
counter.set(2);

// Incrementing the current value.
counter.update((count) => count + 1);

// Mutating an array within a signal.
const tasks = signal([{ title: 'Initial Task' }]);
tasks.mutate((list) => list.push({ title: 'New Task' }));

// Equality comparator to prevent unnecessary updates.
const score = signal(0, {
  equals: (newValue, oldValue) => newValue === oldValue,
});

score.set(0); // Will not trigger reactivity due to equality comparator.
```

## Further Readings

For additional details on handling state and reactivity with signals:

- [Memoized Signals](/reactivity/memoized-signals): Optimize derived values with memoization.
- [Untracked Signals](/reactivity/untracked-signals): Access signal values without triggering reactive updates.
- [Stores](/reactivity/stores): Learn how to encapsulate state and logic in stores.
