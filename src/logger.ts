export function getLogger(minLevel: LogLevel): Logger {
    const levels: Record<LogLevel, number> = {
        error: 10,
        warn: 9,
        info: 8,
        debug: 7,
    };

    if (!Object.hasOwn(levels, minLevel)) {
        throw new Error(`Invalid log level.`);
    }

    return {
        level: minLevel,
        error: function error() {
            return levels.error >= levels[this.level]
                ? console.error(...arguments)
                : undefined;
        },
        warn: function warn() {
            return levels.warn >= levels[this.level]
                ? console.warn(...arguments)
                : undefined;
        },
        log: function log() {
            return levels.info >= levels[this.level]
                ? console.log(...arguments)
                : undefined;
        },
        info: function info() {
            return levels.info >= levels[this.level]
                ? console.info(...arguments)
                : undefined;
        },
        debug: function debug() {
            return levels.debug >= levels[this.level]
                ? console.debug(...arguments)
                : undefined;
        },
    };
}

export interface Logger {
    level: LogLevel;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    log: (...args: any[]) => void;
    info: (...args: any[]) => void;
    debug: (...args: any[]) => void;
}

export type LogLevel = "error" | "warn" | "info" | "debug";
