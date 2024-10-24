---
title: Signals
description: Reactive values that automatically notify consumers when their value changes, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/readonly-signals
---

# Read-Only Signals

Create a read-only signal with `signal(value).readonly()`. It restricts mutation and only allows access to the value.

Example:

```typescript
const readonlyCounter = signal(0).readonly();
```
