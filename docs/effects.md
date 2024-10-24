---
title: Effects
description: Side-effect management for signals, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/effects
---

# Effects

`effect()` registers side effects that run whenever the signals they depend on change. Effects can be cleaned up by returning a cleanup function.

Example:

```typescript
import { effect, signal } from '@deft-plus/reactivity';

const counter = signal(0);

effect(() => {
  console.log('Counter:', counter());
  return () => console.log('Cleanup');
});

// Run effect immediately.
effect.initial(() => {
  console.log('Counter:', counter());
});
```
