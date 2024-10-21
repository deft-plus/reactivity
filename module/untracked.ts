// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

/**
 * Contains the implementation for the {@link untrackedSignal} function.
 *
 * A signal is a reactive value that can be read and watched for changes. However, sometimes you
 * need to read a signal without creating a dependency. This function allows you to read the value
 * of a signal without creating a dependency.
 *
 * @module
 */

import { ReactiveNode } from './_reactive_node.ts';

/**
 * Reads the value of a signal without creating a dependency.
 *
 * @template T - The type of the signal value.
 * @param readFn - The function to read the signal value.
 * @returns The value of the signal.
 */
export function untrackedSignal<T>(readFn: () => T): T {
  const previousConsumer = ReactiveNode.setActiveConsumer(null);

  // We are not trying to catch any particular errors here, just making sure that the consumers
  // stack is restored in case of errors.
  try {
    return readFn();
  } finally {
    ReactiveNode.setActiveConsumer(previousConsumer);
  }
}
