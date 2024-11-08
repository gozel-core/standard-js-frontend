import { test, expect } from "vitest";
import { device } from "./device";

test("device id", () => {
    expect(device.id.length).toBeGreaterThan(1);
});
