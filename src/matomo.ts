import { BROWSER } from "esm-env";
import { metapatcher } from "metapatcher";

export function getMatomoClient(
    siteId: string,
    baseUrl: string = "https://analytics.gozel.com.tr/",
    features: string[] = ["enableHeartBeatTimer", "enableLinkTracking"],
) {
    if (!BROWSER) return;

    if (!baseUrl.endsWith("/")) baseUrl = baseUrl + "/";

    window._paq = window._paq || [];
    window._paq.push(["setTrackerUrl", baseUrl + "matomo.php"]);
    window._paq.push(["setSiteId", siteId]);

    if (features.includes("enableHeartBeatTimer"))
        window._paq.push(["enableHeartBeatTimer"]);
    if (features.includes("enableLinkTracking"))
        window._paq.push(["enableLinkTracking"]);

    // loading async is ok because it will collect the previous entries once its ready
    void metapatcher.setScript(
        {
            id: "matomo",
            type: "text/javascript",
            src: baseUrl + "matomo.js",
            async: true,
        },
        { location: "headEnd" },
    );

    return {
        push: function (
            arg: (string | number | (() => void) | Record<string, unknown>)[],
        ) {
            window._paq.push(arg);
        },
    };
}

declare global {
    interface Window {
        _paq: Array<
            Array<string | number | (() => void) | Record<string, unknown>>
        >;
    }
}
