import { BROWSER } from "esm-env";
import { openDB, type DBSchema } from "idb";
import { logger } from "./logger";

export async function initIndexedDb() {
    if (!BROWSER || !hasIndexeddb()) {
        return;
    }

    const INDEXED_DB_NAME = "gozel";
    const INDEXED_DB_VER = 2;

    const db = await openDB<MyIndexedDbSchema & DBSchema>(
        INDEXED_DB_NAME,
        INDEXED_DB_VER,
        {
            upgrade(db, oldVersion) {
                switch (oldVersion) {
                    case 0:
                        db.createObjectStore("user_preferences");
                        return;
                    case 1:
                        db.createObjectStore("device");
                        return;
                }
            },
            async blocked(_currentVersion, _blockedVersion, event) {
                await (event.target as IDBRequest).result.close();
                // TODO alert user to close the other tabs with this site open
            },
            async blocking(_currentVersion, _blockingVersion, event) {
                await (event.target as IDBRequest).result.close();
                // TODO alert user to reload the page, because there is newer version
            },
        },
    );

    function hasIndexeddb() {
        return "indexedDB" in window;
    }

    async function getOne(store: keyof MyIndexedDbSchema, key: string) {
        logger.info(`Indexeddb get ${store}:${key}`);
        return await db.get(store, key);
    }

    async function setOne(
        store: keyof MyIndexedDbSchema,
        key: string,
        value: string,
    ) {
        logger.info(`Indexeddb set ${store}:${key}:${value}`);
        return await db.put(store, value, key);
    }

    return { db, getOne, setOne };
}

export interface MyIndexedDbSchema {
    user_preferences: {
        key: string;
        value: string;
    };
    device: {
        key: string;
        value: string;
    };
}

export type MyIndexedDbApi =
    | AsyncReturnType<ReturnType<typeof initIndexedDb>>
    | undefined;
type AsyncReturnType<T> = T extends Promise<infer U> ? U : T;
