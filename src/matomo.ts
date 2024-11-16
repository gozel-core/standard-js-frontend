import { metapatcher } from "metapatcher";

export const matomo = (function () {
    if (typeof window === "undefined") {
        return {
            configure: (_siteId: string) => {},
            push: (_arg: (string | number)[]) => {},
        };
    }

    const u = "https://analytics.gozel.com.tr/";

    window._paq = window._paq || [];

    window._paq.push(["enableHeartBeatTimer"]);
    window._paq.push(["enableLinkTracking"]);
    window._paq.push(["setTrackerUrl", u + "matomo.php"]);

    // this is an async function but we dont care
    // as it will handle earlier pushes to _paq
    void metapatcher.setScript(
        {
            id: "matomo",
            type: "text/javascript",
            src: u + "matomo.js",
            async: true,
        },
        { location: "headEnd" },
    );

    return {
        configure: function (siteId: string) {
            window._paq.push(["setSiteId", siteId]);
        },
        push: function (arg: (string | number)[]) {
            window._paq.push(arg);
        },
    };
})();

declare global {
    interface ImportMetaEnv {
        readonly VITE_MATOMO_SITE_ID: string;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }

    interface Window {
        _paq: Array<Array<string | number | (() => unknown)>>;
    }
}
