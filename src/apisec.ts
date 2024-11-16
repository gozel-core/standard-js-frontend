import axios from "axios";
import { is, boolean, object } from "superstruct";
import { type Logger } from "./logger";
import { type DeviceDetails } from "./device";

/*
    Registers device to the api endpoint and adds auth scopes defined by the dev.
    Server checks if the device that makes the request has the necessary auth scopes.
 */
export class ApiSecClient {
    logger: Logger;
    apiBaseUrl = "";
    apiVersion = "";
    apiPaths = {
        register: "/sec/auth/token",
        addAuthScope: "/sec/auth/scope",
    };
    authScopes: Record<string, string> = {};
    deviceDetails: DeviceDetails = {
        id: "",
        platformType: undefined,
        browserName: undefined,
        browserVersion: undefined,
    };

    isRegistered = false;
    authScopesAdded: string[] = [];
    authScopesQueued: { name: string }[] = [];
    queueTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        logger: Logger,
        apiBaseUrl: string,
        apiVersion: string,
        authScopes: Record<string, string>,
        deviceDetails: DeviceDetails,
    ) {
        this.logger = logger;
        this.apiBaseUrl = apiBaseUrl;
        this.apiVersion = apiVersion;
        this.authScopes = authScopes;
        this.deviceDetails = deviceDetails;
    }

    async register() {
        if (this.isRegistered) {
            this.logger.info("[apisec]: this device already registered");
            return;
        }

        const ApiSecRegisterResponseSchema = object({
            success: boolean(),
        });
        const data = {
            id: this.deviceDetails.id,
            platformType: this.deviceDetails.platformType,
            browserName: this.deviceDetails.browserName,
            browserVersion: this.deviceDetails.browserVersion,
        };

        try {
            const response = await axios({
                method: "post",
                baseURL: this.apiBaseUrl,
                url: this.apiPaths.register,
                headers: {
                    "Content-Type": "application/json",
                    "Accept-Version": this.apiVersion,
                },
                data,
                validateStatus: this._isSuccessfulHttpStatus,
            });

            if (
                this.isObject(response.data) &&
                Object.hasOwn(response.data, "error")
            ) {
                this.logger.info("[apisec]: register failed", {
                    because: `Server sent an error object`,
                    error: response.data,
                });
                return { error: { code: "unexpected_error" } };
            }

            if (!is(response.data, ApiSecRegisterResponseSchema)) {
                this.logger.info("[apisec]: register failed", {
                    because: `Server response and expected schema doesn't match`,
                    response: response.data,
                    schema: ApiSecRegisterResponseSchema,
                });
                return { error: { code: "unexpected_error" } };
            }

            this.isRegistered = true;

            this.logger.info("[apisec]: registered device", { data });

            return response.data;
        } catch (e) {
            this.logger.info("[apisec]: register failed", {
                because: `Either server doesn't work or fetch error`,
                error: e,
            });
            return { error: { code: "unexpected_error" } };
        }
    }

    addAuthScopeLazy(name: string) {
        const isDuplicate = this.authScopesQueued.some(
            (item) => item.name === name,
        );
        if (isDuplicate) return;

        this.authScopesQueued.push({ name });
        this.resetTimer();
        this.setTimer();
    }

    setTimer() {
        this.queueTimer = setTimeout(() => {
            if (this.authScopesQueued.length === 0) return;
            const authScope = this.authScopesQueued.shift()!;
            void this.addAuthScope(authScope.name);
            this.resetTimer();
            this.setTimer();
        }, 1000);
    }

    resetTimer() {
        if (this.queueTimer) clearTimeout(this.queueTimer);
        this.queueTimer = null;
    }

    async addAuthScope(name: string) {
        if (this.authScopesAdded.includes(name)) {
            this.logger.info(
                `[apisec]: the auth scope "${name}" added already`,
            );
            return;
        }

        const ApiSecAddAuthResponseSchema = object({
            success: boolean(),
        });

        try {
            const response = await axios({
                method: "post",
                baseURL: this.apiBaseUrl,
                url: this.apiPaths.addAuthScope,
                headers: {
                    "Content-Type": "application/json",
                    "Accept-Version": this.apiVersion,
                },
                data: {
                    deviceId: this.deviceDetails.id,
                    scope: name,
                    timestamp: new Date().toString(),
                },
                validateStatus: this._isSuccessfulHttpStatus,
            });

            if (
                this.isObject(response.data) &&
                Object.hasOwn(response.data, "error")
            ) {
                return { error: { code: "unexpected_error" } };
            }

            if (!is(response.data, ApiSecAddAuthResponseSchema)) {
                return { error: { code: "unexpected_error" } };
            }

            this.authScopesAdded.push(name);

            return response.data;
        } catch (e) {
            return { error: { code: "unexpected_error" } };
        }
    }

    _isSuccessfulHttpStatus(this: void, statusCode: number | undefined) {
        if (typeof statusCode !== "number") return false;
        if (statusCode >= 200 && statusCode < 500) return true;
        return false;
    }

    isObject(v: unknown): v is object {
        return !!v && v.constructor === Object;
    }
}
