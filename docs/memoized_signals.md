---
title: Signals
description: Reactive values that automatically notify consumers when their value changes, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/memoized-signals
---

# Memoized Signals

Use `memoSignal()` to create memoized signals that automatically update based on dependencies.

Example:

```typescript
import { memoSignal } from '@deft-plus/reactivity';

const isEven = memoSignal(() => counter() % 2 === 0);
```

Memoized signals can be configured with an equality comparator to prevent unnecessary updates and an `onChange` callback to run when the value changes.
