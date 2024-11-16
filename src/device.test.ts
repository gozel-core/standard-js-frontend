import { test, expect } from "vitest";
import { readDevice } from "./device";

test("device id", () => {
    const d = readDevice();
    expect(d.id.length).toBeGreaterThan(1);
});
