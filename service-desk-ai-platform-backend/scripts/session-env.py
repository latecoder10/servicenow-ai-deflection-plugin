"""
Emits shell export statements for the values in .env.local.

Nothing in this repository reads .env.local at runtime: there is no dotenv
dependency and no spring.config.import. The variables have to reach the JVM as
real environment variables, which is what this produces.

    eval "$(python scripts/session-env.py)"     # loads into the current shell only

Values are quoted with shlex, because the ServiceNow client secret contains
backticks and ampersands that a naive `source .env.local` would execute.

The output is written to stdout and never to a file, so no plaintext copy of a
credential is created. Redirecting it into one defeats the point.
"""
import shlex
import sys
from pathlib import Path

ENV = Path(__file__).resolve().parent.parent / ".env.local"

if not ENV.exists():
    sys.exit(f"# {ENV} not found")

emitted = 0
for line in ENV.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue

    key, value = line.split("=", 1)
    key = key.strip()
    value = value.strip()

    # Strip a surrounding quote pair if the file used one; the value itself may
    # still contain characters the shell would otherwise interpret.
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]

    print(f"export {key}={shlex.quote(value)}")
    emitted += 1

print(f"# {emitted} variables exported from .env.local", file=sys.stderr)
