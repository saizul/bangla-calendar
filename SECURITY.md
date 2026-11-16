# Security policy

## Supported versions

Only the latest release receives fixes.

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Use GitHub's
private vulnerability reporting ("Report a vulnerability" under the
repository's **Security** tab). You will get an answer within a week.

## Scope

bangla-calendar is a pure date library with no runtime dependencies, no
network access and no file system access. The issues that matter most are:

- **Denial of service.** Inputs to `parseBanglaDate()` or `formatBangla()`
  that take far longer than linear time. Please include the input length and
  timing.
- **Wrong dates in a way that can be abused**, for example two strings that
  parse to different dates although they look identical. Note that dates are
  not a security boundary: validate business rules (deadlines, ages) on the
  server with your own checks.
