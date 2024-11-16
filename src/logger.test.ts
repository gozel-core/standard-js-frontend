import { expect, test, vi } from "vitest";
import { getLogger } from "./logger";

test("logger", () => {
    const consoleWarnMock = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
    const consoleErrorMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
    const consoleInfoMock = vi
        .spyOn(console, "info")
        .mockImplementation(() => undefined);

    // @ts-ignore
    expect(() => getLogger("invalid")).toThrow();

    const warner = getLogger("warn");
    expect(warner.level).toBe("warn");

    warner.warn("test warning");
    expect(consoleWarnMock).toHaveBeenCalledOnce();

    warner.error("test error");
    expect(consoleErrorMock).toHaveBeenCalledOnce();

    warner.info("test info");
    expect(consoleInfoMock).not.toHaveBeenCalled();
});
