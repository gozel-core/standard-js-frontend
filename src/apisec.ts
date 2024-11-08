import axios from "axios";
import { is, boolean, object } from "superstruct";
import { logger } from "./logger";

/*
    Registers device to the api endpoint and adds auth scopes defined by the dev.
    Server checks if the device that makes the request has the necessary auth scopes.
 */
class ApiSecClient {
    apiBaseUrl = "";
    apiVersion = "";
    apiPaths = {
        register: "/sec/auth/token",
        addAuthScope: "/sec/auth/scope",
    };
    authScopes: Record<string, string> = {};
    deviceDetails: ApiSecDeviceDetails = {
        deviceId: "",
        platformType: undefined,
        browserName: undefined,
        browserVersion: undefined,
    };

    isRegistered = false;
    authScopesAdded: string[] = [];
    authScopesQueued: { name: string }[] = [];
    queueTimer: ReturnType<typeof setTimeout> | null = null;

    async configure(
        apiBaseUrl: string,
        apiVersion: string,
        authScopes: Record<string, string>,
        deviceDetails: ApiSecDeviceDetails,
    ) {
        logger.info("[apisec]: init client");

        this.apiBaseUrl = apiBaseUrl;
        this.apiVersion = apiVersion;
        this.authScopes = authScopes;
        this.deviceDetails = deviceDetails;

        return await this.register();
    }

    async register() {
        if (this.isRegistered) {
            logger.info("[apisec]: this device already registered");
            return;
        }

        const ApiSecRegisterResponseSchema = object({
            success: boolean(),
        });
        const data = {
            deviceId: this.deviceDetails.deviceId,
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
                logger.info("[apisec]: register failed", {
                    because: `Server sent an error object`,
                    error: response.data,
                });
                return { error: { code: "unexpected_error" } };
            }

            if (!is(response.data, ApiSecRegisterResponseSchema)) {
                logger.info("[apisec]: register failed", {
                    because: `Server response and expected schema doesn't match`,
                    response: response.data,
                    schema: ApiSecRegisterResponseSchema,
                });
                return { error: { code: "unexpected_error" } };
            }

            this.isRegistered = true;

            logger.info("[apisec]: registered device", { data });

            return response.data;
        } catch (e) {
            logger.info("[apisec]: register failed", {
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
            logger.info(`[apisec]: the auth scope "${name}" added already`);
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
                    deviceId: this.deviceDetails.deviceId,
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

export const apisec = new ApiSecClient();

export interface ApiSecDeviceDetails {
    deviceId: string;
    platformType: string | undefined;
    browserName: string | undefined;
    browserVersion: string | undefined;
}
