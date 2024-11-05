---
title: Reactivity Readonly Signals
description: Create read-only signals to expose state while preventing direct mutation, ensuring data integrity and immutability.
url: /reactivity/readonly-signals
---

# Read-Only Signals

Read-only signals are a specialized type of signal that restricts mutation, ensuring that their values can only be read and not directly modified. This is particularly useful for exposing state while safeguarding it from unintended changes.

## Table of Contents

- [Creating a Read-Only Signal](#creating-a-read-only-signal)
- [Why Use Read-Only Signals?](#why-use-read-only-signals)
- [Example Use Case](#example-use-case)
- [Further Reading](#further-reading)

## Creating a Read-Only Signal

To create a read-only signal, start with a writable signal and call the `.readonly()` method. This will return a signal that provides read access only, preventing any direct updates.

```typescript
import { signal } from '@deft-plus/reactivity';

const counter = signal(0);
const readonlyCounter = counter.readonly();

console.log(readonlyCounter()); // Access the value: 0

// Attempting to modify readonlyCounter directly will throw an error or have no effect:
readonlyCounter.set(5); // Error: `set` is not a function
```

In this example:

- `readonlyCounter` is derived from the writable `counter` signal but restricts mutation.
- `readonlyCounter` can be read using `readonlyCounter()`, yet `readonlyCounter.set()` or other mutative methods are disabled to enforce immutability.

## Why Use Read-Only Signals?

Read-only signals are valuable when you need to:

- Expose internal state publicly while maintaining control over its modification.
- Ensure that certain state dependencies cannot be accidentally or maliciously altered.
- Provide read access to computed or derived state without exposing the underlying writable signal.

For instance, a read-only signal is ideal for UI components that need to display data without directly modifying it.

## Example Use Case

Imagine a scenario where you have a writable signal for an internal counter but want external components to only view this value without changing it:

```typescript
import { signal } from '@deft-plus/reactivity';

// Internal writable signal
const counter = signal(0);

// Expose a read-only signal for external usage
const readonlyCounter = counter.readonly();

function incrementCounter() {
  counter.update((count) => count + 1);
}

console.log(readonlyCounter()); // Outputs: 0

incrementCounter();
console.log(readonlyCounter()); // Outputs: 1
```

In this example:

- `readonlyCounter` provides a safe way to access the `counter` value without allowing external modifications.
- Functions like `incrementCounter` manage `counter` updates internally, ensuring controlled access to state changes.

## Further Reading

For more on using signals effectively across applications, check out:

- [Writable Signals](/reactivity/writable-signals): Basics of creating and managing writable signals.
- [Memoized Signals](/reactivity/memoized-signals): Efficiently compute derived state.
- [Effects](/reactivity/effects): Register side effects that respond to signal changes.
- [Stores](/reactivity/stores): Manage complex state and logic in a structured manner.
