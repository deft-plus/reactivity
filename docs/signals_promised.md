---
title: Signals
description: Reactive values that automatically notify consumers when their value changes, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/signals/promised
---

# Promised Signals

`signalFromPromise()` creates signals that represent asynchronous values. The signal resolves to a promise and exposes a `status` property.

Example:

```typescript
import { signalFromPromise } from '@deft-plus/reactivity';

// Function parameter.
const data = signalFromPromise(async () => {
  const response = await fetch('https://api.example.com/data');
  return response.json();
});

// Promise parameter.
const data = signalFromPromise(
  fetch('https://api.example.com/data')
    .then((response) => response.json()),
);
```
