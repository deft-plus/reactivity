# Reactivity contributor instructions

## Project overview

This repository contains `@deft-plus/reactivity`, a Deno 2.9+ TypeScript library published to JSR. It implements fine-grained reactive signals, lazy memoized signals, asynchronous effects, promise-backed signals, and stores. Keep the library small, runtime-dependency-free, permission-conscious, and usable without a build step.

The root `deno.jsonc` defines a workspace with two members:

- `module/`: the publishable `@deft-plus/reactivity` package, implementation, public entry point, tests, and package README.
- `docs/`: the long-form documentation pages and their front matter.

The root `README.md` is a symlink to `module/README.md`. Edit `module/README.md`; do not replace the symlink with a separate copy. Files under `.agents/` and `skills-lock.json` are agent-tooling metadata, not library source.

## Commands

Run commands from the repository root.

```bash
deno ci                 # reproduce dependencies from deno.lock
deno task fmt           # format source, configuration, and Markdown
deno task lint          # lint and verify formatting
deno task check         # type-check the public entry point and tests
deno task test          # run tests and generate coverage
deno task test:u        # run tests with the suite's update argument
deno task jsdoc:lint    # validate public API documentation
deno task jsdoc:generate
deno publish --dry-run --allow-dirty
```

Before completing a code change, run `deno task lint`, `deno task check`, and `deno task test`. Run `deno task jsdoc:lint` when changing exported or protected APIs, and use a publish dry run when changing exports, package metadata, or published files.

Do not grant `-A` to routine commands. Add the narrowest permission needed by the behavior under test.

## Source and API conventions

- `module/mod.ts` is the only public package entry point. Export intentional public APIs there; do not expose internal helpers accidentally.
- Prefix internal implementation files with `_`, as in `_api.ts`, `_logging.ts`, and `_reactive_node.ts`.
- Keep tests beside their implementation and name them `*_test.ts`.
- Use explicit `.ts` extensions for relative imports and use import-map aliases for JSR dependencies.
- Preserve strict TypeScript types. Avoid `any`, non-null assertions, unchecked casts, and broad `Function` types unless the mapping genuinely requires them and the lint suppression explains why.
- Use two-space indentation, single quotes, 100-column TypeScript formatting, and Deno's formatter. Markdown uses `proseWrap: never`.
- Add Apache-2.0 copyright headers to TypeScript source and test files.
- Document public APIs with JSDoc, including behavior, parameters, returns, and a realistic example. Keep public signatures free of private referenced types so `deno doc --lint` succeeds.

## Reactive implementation invariants

- Reading a signal inside an active consumer records a dependency; `untracked()` must restore the previous consumer in a `finally` block.
- Writable signals increment their value version and notify consumers only according to their equality/mutation contract.
- Memoized signals remain lazy, cache values and errors, detect computation cycles, and avoid recomputation when dependency values are equivalent.
- Effects are scheduled through the shared microtask queue and batch repeated notifications. Cleanup must run before re-execution and once on destruction.
- Keep dependency edges weak and remove stale producer/consumer links. When changing graph bookkeeping, add tests for conditional dependencies, nested computations, cycles, batching, and cleanup.
- A readonly wrapper must not expose mutation methods and must stay connected to the original writable signal.

## Logging and permissions

Logging precedence is part of the public contract:

1. An explicit `{ log: true | false }` option wins.
2. Otherwise, `SIGNAL_LOG=true` enables global logging only when the runtime grants access to that environment variable.
3. Denied permissions, unavailable environment APIs, and non-Deno runtimes must safely default to logging disabled.

Never introduce an unconditional `Deno.env.get()` in library initialization or normal signal creation. Logging tests should stub permission and environment APIs rather than granting environment permission to the entire test suite.

## Testing conventions

- Register every case as an independent top-level `Deno.test`. Do not use test steps or `@std/testing/bdd`.
- Use `@std/expect` for expectations and `@std/testing/mock` for spies and stubs.
- Name tests `<function-or-method>() <behavior>`, such as `signal() should create a writable signal` or `WritableSignal.set() should update the value`. Always include parentheses after the callable name.
- Declare tests with `Deno.test(name, fn)`. Use arrow functions for `fn`, including `async` arrow functions for asynchronous tests.
- Use `using` for disposable stubs and event signals so cleanup happens even when assertions fail.
- Cover both runtime behavior and public type expectations when changing an API contract.
- Effects run asynchronously unless the API explicitly promises immediate execution. Await a short delay or a microtask before asserting scheduled work.
- Tests must be deterministic and isolated: restore global stubs, destroy effects, dispose event listeners, and avoid depending on ambient environment variables.

## Documentation

Update documentation in the same change as user-visible behavior:

- `module/README.md` for installation, overview, and common examples.
- The matching page under `docs/` for detailed behavior.
- Source JSDoc for API-level contracts and generated reference documentation.

Docs pages use YAML front matter with `title`, `description`, and a `/reactivity/...` URL. Use `@deft-plus/reactivity` in consumer examples, keep method and option names identical to the source, and ensure examples reflect asynchronous effect timing and signal return shapes.

## Package and release rules

- Keep package metadata, imports, and exports in `module/deno.jsonc`.
- Commit `deno.lock` and keep it synchronized. CI uses `deno ci` and must fail on a stale lockfile.
- Publishing targets JSR through `deno publish`; the release workflow uses OIDC provenance.
- Do not edit generated `.coverage/` or `.deno-docs/` output.
- Avoid adding production dependencies for functionality the Deno runtime already provides.
