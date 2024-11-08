import { BROWSER } from "esm-env";
import Bowser from "bowser";
import { nanoid } from "nanoid/non-secure";

function createDevice() {
    const browser = Bowser.getParser(
        BROWSER ? window.navigator.userAgent : "gozelbot/0",
    );
    const deviceId = BROWSER ? getDeviceId() : createNewDeviceId();
    const platformType = getPlatformType();
    const browserName = getBrowserName();
    const browserVersion = getBrowserVersion();
    const defaultMinimumRequirements: DeviceMinimumRequirements = {
        chrome: ">=1",
        safari: ">=1",
        firefox: ">=1",
        opera: ">=1",
        android: ">=1",
        ie: ">11", // no ie support
        // edge
    };

    return {
        id: deviceId,
        platformType,
        browserName,
        browserVersion,
        isDesktop,
        isTablet,
        isMobile,
        isTv,
        doesSatisfy,
    };

    function getDeviceId() {
        const did = window.localStorage.getItem("device_id");
        return typeof did === "string" && did.length > 0
            ? did
            : createNewDeviceId();
    }

    function createNewDeviceId() {
        return nanoid(24);
    }

    function getPlatformType() {
        try {
            const _type = browser.getPlatformType(true);
            return typeof _type === "string" ? _type.toLowerCase() : undefined;
        } catch (e) {
            return undefined;
        }
    }

    function getBrowserName() {
        try {
            return browser.getBrowserName(true);
        } catch (e) {
            return undefined;
        }
    }

    function getBrowserVersion() {
        try {
            return browser.getBrowserVersion();
        } catch (e) {
            return undefined;
        }
    }

    function isDesktop() {
        return platformType && platformType === "desktop";
    }

    function isTablet() {
        return platformType && platformType === "tablet";
    }

    function isMobile() {
        return platformType && platformType === "mobile";
    }

    function isTv() {
        return platformType && platformType === "tv";
    }

    function doesSatisfy(
        minimumRequirements: DeviceMinimumRequirements = defaultMinimumRequirements,
    ) {
        return browser.satisfies(minimumRequirements);
    }
}

export const device = createDevice();

export interface DeviceMinimumRequirements {
    chrome?: string;
    safari?: string;
    firefox?: string;
    opera?: string;
    android?: string;
    ie?: string;
    edge?: string;
}
