import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

it("runs every test file in an isolated worker", () => {
  const probe = `
    import { resolveConfig } from "vitest/node";
    const config = await resolveConfig({ root: process.cwd() });
    process.stdout.write(String(config.test.isolate));
  `;
  const isolated = execFileSync(process.execPath, ["--input-type=module", "--eval", probe], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  expect(isolated).toBe("true");
});
