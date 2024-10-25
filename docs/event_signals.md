---
title: Reactivity Event Signals
description: Update signals with event listeners.
url: /reactivity/event-signals
---

# Event Signals

Event signals extend reactive state management by enabling signals to be updated through custom events. This feature provides greater flexibility when integrating signals with other parts of your application, allowing seamless updates from external event listeners.

## Table of Contents

- [Overview](#overview)
- [Creating Event Signals](#creating-event-signals)
- [Dispatching Events to Update Signals](#dispatching-events-to-update-signals)
- [Cleaning Up with the Dispose Pattern](#cleaning-up-with-the-dispose-pattern)
- [Examples](#examples)
- [Further Readings](#further-readings)

## Overview

### Purpose

Event signals allow:

- **Reactive Event Integration**: Update signal values by dispatching custom events.
- **Enhanced Modularity**: Integrate signals with other app components through event-driven updates.
- **Automatic Cleanup**: Dispose of event listeners when the signal is no longer needed.

### Key Features

- **Event-driven Updates**: Signal updates triggered via custom events.
- **Dispose Pattern**: Clean up event listeners on signal disposal.
- **Optional Cleanup Hooks**: Additional control with `onDispose` hook for custom cleanup code.

## Creating Event Signals

To enable event-based updates, set the `name` and `allowEvents` options in the signal configuration. The `name` property identifies the signal for event dispatching, while `allowEvents: true` enables event-based updating.

```typescript
import { signal } from '@deft-plus/reactivity';

using counter = signal(0, { name: 'counter', allowEvents: true });
```

## Dispatching Events to Update Signals

To update an event signal, dispatch a `CustomEvent` using the signal’s `name` and include the new value in the `detail` field. This updates the signal’s value reactively based on the event.

```typescript
dispatchEvent(new CustomEvent('counter', { detail: 1 }));

console.log(counter()); // Output: 1
```

## Cleaning Up with the Dispose Pattern

Event signals automatically clean up their listeners when they are disposed of, freeing up memory and preventing potential memory leaks. You can further customize the cleanup process with the `onDispose` option, which allows running specific code when the signal is disposed.

### Example of `onDispose` Hook

```typescript
import { signal } from '@deft-plus/reactivity';

{
  using counter = signal(0, {
    name: 'counter',
    allowEvents: true,
    onDispose: () => {
      console.log('Disposed');
    },
  });

  dispatchEvent(new CustomEvent('counter', { detail: 1 }));
  console.log(counter()); // Output: 1
} // Logs: "Disposed" upon exiting the scope
```

## Examples

### Basic Event Signal

```typescript
import { signal } from '@deft-plus/reactivity';

using status = signal('offline', { name: 'status', allowEvents: true });

dispatchEvent(new CustomEvent('status', { detail: 'online' }));
console.log(status()); // Output: 'online'
```

### Event Signal with Cleanup

```typescript
import { signal } from '@deft-plus/reactivity';

{
  using status = signal('idle', {
    name: 'status',
    allowEvents: true,
    onDispose: () => {
      console.log('Signal disposed and cleaned up.');
    },
  });

  dispatchEvent(new CustomEvent('status', { detail: 'busy' }));
  console.log(status()); // Output: 'busy'
} // Logs: "Signal disposed and cleaned up."
```

## Further Readings

To learn more about managing and using reactive state in various contexts:

- [Writable Signals](/reactivity/writable-signals): Basics of creating and managing writable signals.
- [Memoized Signals](/reactivity/memoized-signals): Efficiently compute derived state.
- [Read-only Signals](/reactivity/readonly-signals): Restricting signal mutation for controlled state access.
