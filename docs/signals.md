---
title: Signals
description: Reactive values that automatically notify consumers when their value changes, enabling fine-grained reactivity and lazy evaluation.
url: /reactivity/signals
---

# Signals

Signals provide a way to create reactive values that automatically notify consumers when their value changes. They allow for fine-grained reactivity and lazy evaluation, making them ideal for performance-sensitive applications.

## Basics

A signal is a function (`() => T`) that returns its current value. It doesn't trigger side effects but may recompute values lazily.

**Reactive Contexts:** When a signal is accessed in a reactive context, it registers as a dependency. The context updates when any signal it depends on changes.
