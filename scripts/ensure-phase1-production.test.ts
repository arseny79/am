import { describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { ensureLongtextColumn } from "./ensure-phase1-production";

function createMockConnection(selectResult: Array<{ dataType: string }>) {
  const execute = vi.fn().mockResolvedValueOnce([selectResult]).mockResolvedValue([{}]);
  return { execute } as unknown as Connection;
}

describe("ensureLongtextColumn", () => {
  it("skips the ALTER when the column is already longtext", async () => {
    const connection = createMockConnection([{ dataType: "longtext" }]);

    await ensureLongtextColumn(connection, "siteSettings", "logoUrl");

    expect(connection.execute).toHaveBeenCalledTimes(1);
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT DATA_TYPE"),
      ["siteSettings", "logoUrl"],
    );
  });

  it("runs the MODIFY COLUMN ... LONGTEXT NULL ALTER when column is currently text", async () => {
    const connection = createMockConnection([{ dataType: "text" }]);

    await ensureLongtextColumn(connection, "siteSettings", "logoUrl");

    expect(connection.execute).toHaveBeenCalledTimes(2);
    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/ALTER TABLE `siteSettings` MODIFY COLUMN `logoUrl` LONGTEXT NULL/),
    );
  });

  it("does not run the ALTER when the column is missing/unknown", async () => {
    const connection = createMockConnection([]);

    await ensureLongtextColumn(connection, "siteSettings", "logoUrl");

    expect(connection.execute).toHaveBeenCalledTimes(1);
  });
});
