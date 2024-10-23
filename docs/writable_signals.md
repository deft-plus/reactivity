---
title: Signals
description: Reactive values that automatically notify consumers when their value changes, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/writable-signals
---

# Writable Signals

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
