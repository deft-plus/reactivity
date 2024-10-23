---
title: Signals
description: Reactive values that automatically notify consumers when their value changes, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/untracked-signals
---

# Untracked Signals

Use `signal.untrack()` to access a signal's value without registering it as a dependency in a reactive context.

Example:

```typescript
import { effect, signal } from '@deft-plus/reactivity';

const counter = signal(0);

effect(() => {
  // Access the signal without registering it as a dependency.
  const value = counter.untrack();
  console.log(value);
});
```
