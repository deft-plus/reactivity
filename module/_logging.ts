// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

/**
 * Contains the logging resolver for the configuration.
 *
 * @module
 */

/** Name of the environment variable that enables signal logging globally. */
const SIGNAL_LOG_ENV = 'SIGNAL_LOG';

/**
 * Resolves whether logging is enabled for a signal.
 *
 * An explicit option takes precedence. Otherwise, the global environment setting is used only when
 * the runtime grants access to it. Runtimes without the Deno API and denied permissions safely
 * default to disabled logging.
 */
export function resolveSignalLog(log?: boolean): boolean {
  if (log !== undefined) {
    return log;
  }

  // deno-coverage-ignore-start -- Deno's test runner cannot execute without the Deno global.
  if (typeof Deno === 'undefined') {
    return false;
  }
  // deno-coverage-ignore-stop

  const permission = Deno.permissions.querySync({ name: 'env', variable: SIGNAL_LOG_ENV });

  return permission.state === 'granted' && Deno.env.get(SIGNAL_LOG_ENV) === 'true';
}
