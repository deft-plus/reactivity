---
title: Signals
description: Reactive values that automatically notify consumers when their value changes, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/to-signal
---

# Signal Conversion

`toSignal()` creates signals that represent asynchronous values. The signal resolves to a promise and exposes a `status` property.

Example:

```typescript
import { toSignal } from '@deft-plus/reactivity';

// Function parameter.
const data = toSignal(async () => {
  const response = await fetch('https://api.example.com/data');
  return response.json();
});

// Promise parameter.
const data = toSignal(
  fetch('https://api.example.com/data')
    .then((response) => response.json()),
);
```
