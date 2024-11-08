/// <reference types="vite/client" />

import pino from "pino";

export const logger = pino({
    level: "info",
    browser: {
        serialize: true,
    },
});
