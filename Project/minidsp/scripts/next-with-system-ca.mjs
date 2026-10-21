import { spawn } from "node:child_process";
import { createRequire } from "node:module";

// This machine terminates TLS with a locally trusted proxy CA, which Node's bundled
// CA list rejects; --use-system-ca makes Node trust the same store the browser uses.
const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");

const child = spawn(process.execPath, ["--use-system-ca", nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
