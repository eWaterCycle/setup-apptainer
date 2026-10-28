# Agent guidance

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, bundling, and release
instructions.

- Review source changes rather than generated files in `dist/`; CI checks that
  the bundle matches the source.
- Use `@actions/core` for action logging rather than `console`.
- Keep changes focused and follow existing code and error-handling patterns.
  Avoid unnecessary complexity and comments that merely restate the code.
- Test both successful behavior and relevant edge cases. Run the unit tests
  after refactoring.
- PR descriptions should explain the changes, call out dependency changes, and
  link relevant issues.
