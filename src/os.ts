function initOs() {
    let business: OSBusiness;
    let languages: OSLanguage[];
    let websiteSettings: OSWebsiteSettings;
    let mediaManifest: OSMediaManifest;
    let pages: OSPage[];
    let staticMessages: OSStaticMessages;
    let geoRegions: GeoRegion[];

    function setBusiness(_business: OSBusiness) {
        business = _business;
    }

    function setLanguages(_languages: OSLanguage[]) {
        languages = _languages;
    }

    function setWebsiteSettings(_websiteSettings: OSWebsiteSettings) {
        websiteSettings = _websiteSettings;
    }

    function setMediaManifest(_mediaManifest: OSMediaManifest) {
        mediaManifest = _mediaManifest;
    }

    function setStaticMessages(_staticMessages: OSStaticMessages) {
        staticMessages = _staticMessages;
    }

    function setGeoRegions(_geoRegions: GeoRegion[]) {
        geoRegions = _geoRegions;
    }

    function setPages(_pages: OSPage[]) {
        pages = _pages;
    }

    function isUnderMaintenance() {
        return websiteSettings.maintenance_mode;
    }

    function getAvailableLanguages() {
        return languages;
    }

    function getBusiness() {
        return business;
    }

    function getBrandColor(name: string, degree: string | number) {
        if (typeof degree === "number") degree = degree.toString();

        const namePredicate = (o: { name: string }) => o.name === name;
        if (!business.brand_colors.some(namePredicate)) {
            throw new Error(`Couldn't find the color name:${name}`);
        }

        const variations =
            business.brand_colors.find(namePredicate)!.variations;
        const variationPredicate = (o: { degree: string }) =>
            o.degree === degree;
        if (!variations.some(variationPredicate)) {
            throw new Error(
                `Couldn't find the color:${name} with a degree:${degree}`,
            );
        }

        const variation = variations.find(variationPredicate)!;

        return variation.hex;
    }

    function getWebsiteSettings() {
        return websiteSettings;
    }

    function getPages() {
        return pages;
    }

    function getPage(path: string, locale?: string) {
        const page = pages.find((p) =>
            !locale
                ? Object.keys(p.paths).some(
                      (_locale) => p.paths[_locale as never] === path,
                  )
                : p.paths[locale as never] === path,
        );

        if (!page) {
            throw new Error(`Couldn't find page for the path:${path}`);
        }

        return page;
    }

    function getPageEmpty() {
        const sample = pages[0]!;
        return Object.keys(pages[0]!).reduce(
            (memo: OSPage | Record<string, unknown>, key) => {
                memo[key] =
                    typeof sample[key] === "string"
                        ? ""
                        : typeof sample[key] === "number"
                          ? 0
                          : isArray(sample[key])
                            ? []
                            : isObject(sample[key])
                              ? {}
                              : null;
                return memo;
            },
            {},
        ) as OSPage;
    }

    function hasPageById(id: number) {
        return pages.some((p) => p.id === id);
    }

    function getPageById(id: number) {
        const page = pages.find((p) => p.id === id);

        if (!page) {
            throw new Error(`Couldn't find page for the id:${id}`);
        }

        return page;
    }

    function getPageByRoutingId(id: string) {
        return pages.find((p) => p.routing_identifiers.includes(id));
    }

    function getPagesByRoutingId(id: string) {
        return pages.filter((p) => p.routing_identifiers.includes(id));
    }

    function getPageChildren(id: number) {
        return pages.filter((p) => p.navigation_parent === id);
    }

    function getPageLocal(page: OSPage, locale: string) {
        const _translation = page.translations.find((t) => t.locale === locale);

        if (!_translation) {
            throw new Error(
                `No translation found for the page:${page.id} and locale:${locale}`,
            );
        }

        return Object.assign({}, page, _translation, {
            path: page.paths[locale],
        });
    }

    function getPageLocalEmpty() {
        return Object.assign({}, getPageEmpty(), {
            title: "",
            excerpt: "",
            locale: "",
            path: "",
        });
    }

    function expandMedia(page: OSPage, fields: string[]) {
        return Object.assign(
            {},
            page,
            fields.reduce(
                (memo, field) =>
                    Object.assign({}, memo, {
                        [field]: getMedia(
                            page[field as keyof typeof page] as string,
                        ),
                    }),
                {},
            ),
        );
    }

    function getMedia(uuid: string) {
        if (!Object.hasOwn(mediaManifest, uuid)) {
            throw new Error(`No such asset:${uuid}`);
        }

        return mediaManifest[uuid as keyof typeof mediaManifest];
    }

    function getMediaPreset(uuid: string, preset: string) {
        const media = getMedia(uuid)!;

        if (!Object.hasOwn(media, preset)) {
            throw new Error(`No such preset:${preset} for the asset:${uuid}`);
        }

        return Object.assign(
            {},
            media["original"] ?? {},
            media[preset as keyof typeof media],
        );
    }

    function _(key: string, locale: string) {
        if (!Object.hasOwn(staticMessages, key)) {
            throw new Error(
                `Couldn't find the message for the key:${key} in the catalog.`,
            );
        }

        if (!Object.hasOwn(staticMessages[key as never]!, locale)) {
            throw new Error(
                `Couldn't find the message for the key:${key} with locale:${locale} in the catalog.`,
            );
        }

        return staticMessages[key as never]![locale];
    }

    function getGeoRegions() {
        return geoRegions;
    }

    function isArray(v: unknown): v is never[] {
        return !!v && v.constructor === Array;
    }

    function isObject(v: unknown): v is object {
        return !!v && v.constructor === Object;
    }

    return {
        setBusiness,
        setLanguages,
        setWebsiteSettings,
        setMediaManifest,
        setStaticMessages,
        setGeoRegions,
        setPages,
        isUnderMaintenance,
        getAvailableLanguages,
        getBusiness,
        getBrandColor,
        getWebsiteSettings,
        getPages,
        getPage,
        getPageEmpty,
        hasPageById,
        getPageById,
        getPageByRoutingId,
        getPagesByRoutingId,
        getPageChildren,
        getPageLocal,
        getPageLocalEmpty,
        expandMedia,
        getMedia,
        getMediaPreset,
        _,
        getGeoRegions,
    };
}

export const os = initOs();

export interface OSBusiness {
    legal_name: string;
    address: string;
    coordinates: {
        coordinates: number[];
        type: string;
    };
    phone_num: string;
    email: string;
    social_media_profiles: OSBusinessSocialMediaProfile[];
    brand_colors: OSBusinessBrandColor[];
    [index: string]: unknown;
}

export interface OSBusinessSocialMediaProfile {
    title: string;
    url: string;
}

export interface OSBusinessBrandColor {
    name: string;
    variations: OSBusinessBrandColorVariation[];
}

export interface OSBusinessBrandColorVariation {
    degree: string;
    hex: string;
}

export interface OSLanguage {
    code: string;
    sort: number | null;
    name: string;
    direction: "ltr" | "rtl";
    is_default: boolean;
    [index: string]: unknown;
}

export interface OSWebsiteSettings {
    maintenance_mode: boolean;
    [index: string]: unknown;
}

export interface OSMediaManifest {
    [index: string]: {
        [index: string]: {
            preset: string;
            path: string;
            width: number;
            height: number;
            size: number;
            title?: string;
            description?: string;
            tags?: string[];
        };
    };
}

export interface OSStaticMessages {
    [index: string]: {
        [index: string]: string;
    };
}

export interface OSPage {
    id: number;
    sort: number | null;
    head_image: string | null;
    navigation_parent: number;
    navigation_children: number[];
    seo_robots_directive: string;
    seo_canonical_url: string | null;
    svelte_component: string;
    routing_identifier: string | null;
    routing_identifiers: string[];
    translations: OSPageTranslation[];
    components: OSPageComponent[];
    paths: {
        [index: string]: string;
    };
    breadcrumb: number[];
    [index: string]: unknown;
}

export interface OSPageTranslation {
    title: string;
    slug: string;
    excerpt: string;
    locale: string;
    [index: string]: unknown;
}

export interface GeoRegion {
    id: number;
    type: "country" | "territory" | "world";
    code: string;
    english_name: string;
    native_name: string;
    parent: number | null;
}

export type OSPageComponent =
    | OSPageComponentSingleText
    | OSPageComponentLink
    | OSPageComponentDualText
    | OSPageComponentImageText
    | OSPageComponentNewsArticle
    | OSPageComponentEvent
    | OSPageComponentDownloads
    | OSPageComponentPhotoGallery
    | OSPageComponentYoutubeVideo
    | OSPageComponentQa
    | OSPageComponentListing
    | OSPageComponentCta;

export interface OSPageComponentSingleText {
    _component: "SingleText";
    translations: OSPageComponentSingleTextTranslation[];
}

interface OSPageComponentSingleTextTranslation {
    text_html: string;
    locale: string;
    [index: string]: unknown;
}

export interface OSPageComponentDualText {
    _component: "DualText";
    translations: OSPageComponentDualTextTranslation[];
}

interface OSPageComponentDualTextTranslation {
    left_html: string;
    right_html: string;
    locale: string;
    [index: string]: unknown;
}

export interface OSPageComponentImageText {
    _component: "ImageText";
    media: string;
    translations: OSPageComponentImageTextTranslation[];
}

interface OSPageComponentImageTextTranslation {
    text_html: string;
    locale: string;
    [index: string]: unknown;
}

export interface OSPageComponentNewsArticle {
    _component: "NewsArticle";
    date: string;
    translations: OSPageComponentNewsArticleTranslation[];
}

interface OSPageComponentNewsArticleTranslation {
    text_html: string;
    locale: string;
    [index: string]: unknown;
}

export interface OSPageComponentEvent {
    _component: "Event";
    start_date: string;
    end_date: string;
    translations: OSPageComponentEventTranslation[];
}

interface OSPageComponentEventTranslation {
    text_html: string;
    locale: string;
    [index: string]: unknown;
}

export interface OSPageComponentDownloads {
    _component: "Downloads";
    files: string[];
}

export interface OSPageComponentPhotoGallery {
    _component: "PhotoGallery";
    photos: string[];
}

export interface OSPageComponentYoutubeVideo {
    _component: "YoutubeVideo";
    url: string | OSPageComponentYoutubeVideoUrlResolved;
    background_video: boolean;
    [index: string]: unknown;
}

export interface OSPageComponentYoutubeVideoUrlResolved {
    url: string;
    id: string;
    title: string;
    aspectRatio: number;
    thumbnail: {
        url: string;
        width: number;
        height: number;
    };
}

export interface OSPageComponentQa {
    _component: "Qa";
    translations: OSPageComponentQaTranslation[];
}

interface OSPageComponentQaTranslation {
    items: { question: string; answer: string }[];
    locale: string;
}

export interface OSPageComponentLink {
    _component: "Link";
    icon: string;
    link: string;
    translations: OSPageComponentLinkTranslation[];
}

interface OSPageComponentLinkTranslation {
    title: string;
    description: string;
    locale: string;
}

export interface OSPageComponentListing {
    _component: "Listing";
    parent: number;
    limit: number;
    style: string;
}

export interface OSPageComponentCta {
    _component: "Cta";
    link_internal: number;
    link_external: string;
    image: string;
    translations: OSPageComponentCtaTranslation[];
}

interface OSPageComponentCtaTranslation {
    title: string;
    excerpt: string;
    locale: string;
}
