import { BROWSER } from "esm-env";
import Bowser from "bowser";
import { nanoid } from "nanoid/non-secure";

export interface DeviceDetails {
    id: string;
    platformType: string | undefined;
    browserName: string | undefined;
    browserVersion: string | undefined;
}

export interface DeviceObject {
    isDesktop: () => boolean;
    isTablet: () => boolean;
    isMobile: () => boolean;
    isTv: () => boolean;
    doesSatisfy: () => boolean | undefined;
}

export function readDevice(
    prevDeviceId?: string,
): DeviceDetails & DeviceObject {
    const browser = Bowser.getParser(
        BROWSER ? window.navigator.userAgent : "gozelbot/0",
    );
    const deviceId =
        BROWSER && prevDeviceId ? prevDeviceId : createNewDeviceId();
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
        return platformType === "desktop";
    }

    function isTablet() {
        return platformType === "tablet";
    }

    function isMobile() {
        return platformType === "mobile";
    }

    function isTv() {
        return platformType === "tv";
    }

    function doesSatisfy(
        minimumRequirements: DeviceMinimumRequirements = defaultMinimumRequirements,
    ) {
        return browser.satisfies(minimumRequirements);
    }
}

export interface DeviceMinimumRequirements {
    chrome?: string;
    safari?: string;
    firefox?: string;
    opera?: string;
    android?: string;
    ie?: string;
    edge?: string;
}
