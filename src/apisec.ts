import axios from "axios";
import { is, boolean, object } from "superstruct";
import { type Logger, getLogger, type LogLevel } from "./logger";
import { type DeviceDetails } from "./device";

// registers visitor's device and adds auth scopes at certain points defined by a dev
// server implementation just checks if a device thats making a request has the neccessary auth scopes for that endpoint

export const apisec = (function initApiSecClient() {
    let logger: Logger | null = null;
    let opts: ApiSecOpts = {
        baseUrl: "",
        version: "",
        authScopes: {},
        deviceDetails: {
            id: "",
            platformType: undefined,
            browserName: undefined,
            browserVersion: undefined,
        },
    };
    const paths = {
        register: "/sec/token",
        addAuthScope: "/sec/scope",
    };
    let isRegistered = false;
    const authScopesAdded: string[] = [];
    const authScopesQueued: { name: string }[] = [];
    let queueTimer: ReturnType<typeof setTimeout> | null = null;

    const api = {
        configure(userOpts: ApiSecOpts) {
            opts = Object.assign({}, opts, userOpts);
            if (opts.logLevel) logger = getLogger(opts.logLevel as LogLevel);
            return this;
        },

        async register() {
            if (isRegistered) {
                if (logger)
                    logger.info("[apisec]: this device already registered");
                return;
            }

            const ApiSecRegisterResponseSchema = object({
                success: boolean(),
            });
            const data = {
                deviceId: opts.deviceDetails.id,
                platformType: opts.deviceDetails.platformType,
                browserName: opts.deviceDetails.browserName,
                browserVersion: opts.deviceDetails.browserVersion,
            };

            try {
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };
                // if (opts.version) headers['Accept-Version'] = opts.version
                const response = await axios({
                    method: "post",
                    baseURL: opts.baseUrl,
                    url:
                        (opts.version.startsWith("/")
                            ? opts.version
                            : "/" + opts.version) + paths.register,
                    headers: headers,
                    data,
                    validateStatus: _isSuccessfulHttpStatus,
                });

                if (
                    isObject(response.data) &&
                    Object.hasOwn(response.data, "error")
                ) {
                    if (logger)
                        logger.info("[apisec]: register failed", {
                            because: `Server sent an error object`,
                            error: response.data,
                        });
                    return { error: { code: "unexpected_error" } };
                }

                if (!is(response.data, ApiSecRegisterResponseSchema)) {
                    if (logger)
                        logger.info("[apisec]: register failed", {
                            because: `Server response and expected schema doesn't match`,
                            response: response.data,
                            schema: ApiSecRegisterResponseSchema,
                        });
                    return { error: { code: "unexpected_error" } };
                }

                isRegistered = true;

                if (logger)
                    logger.info("[apisec]: registered device", { data });

                return response.data;
            } catch (e) {
                if (logger)
                    logger.info("[apisec]: register failed", {
                        because: `Either server doesn't work or fetch error`,
                        error: e,
                    });
                return { error: { code: "unexpected_error" } };
            }
        },

        setTimer() {
            queueTimer = setTimeout(() => {
                if (authScopesQueued.length === 0) return;
                const authScope = authScopesQueued.shift()!;
                void this.addAuthScope(authScope.name);
                this.resetTimer();
                this.setTimer();
            }, 1000);
        },
        resetTimer() {
            if (queueTimer) clearTimeout(queueTimer);
            queueTimer = null;
        },

        addAuthScopeLazy(name: string) {
            const isDuplicate = authScopesQueued.some(
                (item) => item.name === name,
            );
            if (isDuplicate) return;

            authScopesQueued.push({ name });
            this.resetTimer();
            this.setTimer();
        },
        async addAuthScope(name: string) {
            if (authScopesAdded.includes(name)) {
                if (logger)
                    logger.info(
                        `[apisec]: the auth scope "${name}" added already`,
                    );
                return;
            }

            const ApiSecAddAuthResponseSchema = object({
                success: boolean(),
            });

            try {
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };
                // if (opts.version) headers['Accept-Version'] = opts.version
                const response = await axios({
                    method: "post",
                    baseURL: opts.baseUrl,
                    url:
                        (opts.version.startsWith("/")
                            ? opts.version
                            : "/" + opts.version) + paths.addAuthScope,
                    headers: headers,
                    data: {
                        deviceId: opts.deviceDetails.id,
                        scope: name,
                        dt: new Date().toString(),
                    },
                    validateStatus: _isSuccessfulHttpStatus,
                });

                if (
                    isObject(response.data) &&
                    Object.hasOwn(response.data, "error")
                ) {
                    return { error: { code: "unexpected_error" } };
                }

                if (!is(response.data, ApiSecAddAuthResponseSchema)) {
                    return { error: { code: "unexpected_error" } };
                }

                authScopesAdded.push(name);

                return response.data;
            } catch (e) {
                return { error: { code: "unexpected_error" } };
            }
        },
    };

    function _isSuccessfulHttpStatus(
        this: void,
        statusCode: number | undefined,
    ) {
        if (typeof statusCode !== "number") return false;
        if (statusCode >= 200 && statusCode < 500) return true;
        return false;
    }

    function isObject(v: unknown): v is object {
        return !!v && v.constructor === Object;
    }

    return api;
})();

export interface ApiSecOpts {
    baseUrl: string;
    version: string;
    authScopes: Record<string, string>;
    deviceDetails: DeviceDetails;
    logLevel?: string;
}
