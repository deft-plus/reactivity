---
title: Reactivity Signal Conversion
description: Convert asynchronous values to signals, enabling reactive updates and status tracking.
url: /reactivity/to-signal
---

# Signal Conversion

The `toSignal()` function enables you to create signals representing asynchronous values. These signals handle promises, updating reactively as the promise resolves or rejects. Additionally, `toSignal()` provides a `status` property to track the state of the asynchronous operation, making it ideal for managing data that loads over time.

## Table of Contents

- [Overview](#overview)
- [Creating an Asynchronous Signal](#creating-an-asynchronous-signal)
- [Signal Status](#signal-status)
- [Examples](#examples)
- [Further Reading](#further-reading)

## Overview

`toSignal()` is useful when you want to:

- Represent asynchronous data (like a network request) as a signal.
- Track the state of a promise while it resolves, using the `status` property.
- Reactively update dependent code when the async operation completes or fails.

## Creating an Asynchronous Signal

You can create an asynchronous signal using `toSignal()` with either:

1. An async function, which will run immediately, or
2. A pre-existing promise, which will update the signal when it resolves or rejects.

### Basic Example

Here’s how to use `toSignal()` with an async function or a promise:

```typescript
import { toSignal } from '@deft-plus/reactivity';

// Using an async function as a parameter.
const data = toSignal(async () => {
  const response = await fetch('https://api.example.com/data');
  return response.json();
});

// Using a promise as a parameter.
const data = toSignal(
  fetch('https://api.example.com/data').then((response) => response.json()),
);
```

In these examples:

- `data` is a signal that resolves to the JSON data from the API response.
- Dependent code will reactively update when the async function or promise resolves.

## Signal Status

The `toSignal()` function also exposes a `status` property, which reflects the current state of the asynchronous operation:

- **"pending"**: The promise is in progress.
- **"fulfilled"**: The promise has resolved successfully.
- **"rejected"**: The promise encountered an error.

This status can be used to conditionally render loading, success, or error states in UI or handle errors in other reactive computations.

### Example with Status Check

```typescript
import { toSignal } from '@deft-plus/reactivity';

const data = toSignal(async () => {
  const response = await fetch('https://api.example.com/data');
  return response.json();
});

if (data.status === 'pending') {
  console.log('Loading...');
} else if (data.status === 'fulfilled') {
  console.log('Data:', data());
} else if (data.status === 'rejected') {
  console.error('Failed to load data');
}
```

In this example:

- The `status` property is checked to handle loading, successful data retrieval, and error states.

## Further Reading

For more on using signals effectively across applications, check out:

- [Writable Signals](/reactivity/writable-signals): Basics of creating and managing writable signals.
- [Memoized Signals](/reactivity/memoized-signals): Efficiently compute derived state.
