/**
 * Contract tests against the real Claude CLI.
 *
 * Every other test mocks `cross-spawn`, which is what let a flag bug ship: the package passed a
 * file path to `--append-system-prompt`, a flag that takes literal text, so the system prompt
 * was replaced by a path string and never reached the model. A mocked spawn asserts the
 * argv the package builds; it cannot assert that the CLI means what the package assumes.
 *
 * These tests cost no model call and need no authentication. Claude Code validates flags and
 * resolves the prompt file before it contacts anything, so an invalid path is enough to prove
 * both that the flag exists and that it is read as a path.
 *
 * They skip when `claude` is not on PATH, so they are inert in an environment without the CLI.
 */

import spawn from "cross-spawn";
import { describe, expect, it } from "vitest";

/**
 * Runs the CLI and returns its combined output, whether it exits zero or not.
 *
 * cross-spawn rather than node:child_process for the same reason spawnClaude uses it: on
 * Windows `claude` is a .cmd shim, which Node will not execute directly.
 */
function runClaude(args: string[]): string {
  const result = spawn.sync("claude", args, {
    encoding: "utf-8",
    timeout: 20000,
  });
  if (result.error) return String(result.error.message ?? result.error);
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

function claudeIsAvailable(): boolean {
  const result = spawn.sync("claude", ["--version"], {
    encoding: "utf-8",
    timeout: 10000,
  });
  return !result.error && result.status === 0;
}

const MISSING = "/pi-claude-cli-does-not-exist-9f3a2b.txt";

describe.skipIf(!claudeIsAvailable())("Claude CLI flag contract", () => {
  it("rejects a flag it does not know, which is how the other assertions have teeth", () => {
    const output = runClaude([
      "--append-system-prompt-does-not-exist",
      MISSING,
      "-p",
      "",
    ]);

    expect(output).toMatch(/unknown option/i);
  });

  it("accepts --append-system-prompt-file and reads it as a path", () => {
    const output = runClaude([
      "--append-system-prompt-file",
      MISSING,
      "-p",
      "",
    ]);

    // Not an unknown option: the flag the package depends on exists.
    expect(output).not.toMatch(/unknown option/i);
    // And it resolved the argument as a file rather than appending it as text, which is the
    // whole reason this flag is the correct one.
    expect(output).toContain(MISSING);
    expect(output).toMatch(/not found/i);
  });

  it("treats --append-system-prompt as literal text, never as a path", () => {
    const output = runClaude(["--append-system-prompt", MISSING, "-p", ""]);

    expect(output).not.toMatch(/unknown option/i);
    // A missing file is not an error here, because the path was appended as prose. If this
    // ever starts reporting a missing file, the two flags have converged and the temp-file
    // indirection in spawnClaude could be reconsidered.
    expect(output).not.toMatch(/not found/i);
  });
});
