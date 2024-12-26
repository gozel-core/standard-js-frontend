import { BROWSER } from "esm-env";
import { openDB, deleteDB, type DBSchema, type IDBPDatabase } from "idb";

export function getIdbObject<UserSchema>(
    name: string,
    version: number,
): Idb<UserSchema> {
    return {
        isSupported: BROWSER && "indexedDB" in window,
        name: name,
        version: version,
        db: null,

        onUpgrade: () => {},
        onBlocked: () => {},
        onBlocking: () => {},

        deleteDB,

        async init() {
            if (!BROWSER) {
                console.warn(
                    `not initiating indexeddb as we are not in browser environment.`,
                );
                return;
            }

            if (!this.isSupported) {
                console.warn(
                    `indexeddb isn't supported, won't use features that rely on it.`,
                );
                return;
            }

            if (!this.name || !this.version) {
                throw new Error(
                    `Please specify name and version for the indexeddb.`,
                );
            }

            const onBlocked = this.onBlocked;
            const onBlocking = this.onBlocking;
            const onUpgrade = this.onUpgrade;

            this.db = await openDB<DBSchema & UserSchema>(
                this.name,
                this.version,
                {
                    upgrade(db, oldVersion) {
                        return onUpgrade(db, oldVersion);
                    },
                    async blocked(_currentVersion, _blockedVersion, event) {
                        // called if there are older versions of the database open on the origin, so this version cannot open.
                        await (event.target as IDBRequest).result.close();

                        // alert user to close the other tabs with this site open
                        return onBlocked();
                    },
                    async blocking(_currentVersion, _blockingVersion, event) {
                        // called if this connection is blocking a future version of the database from opening
                        await (event.target as IDBRequest).result.close();

                        // alert user to reload the page, because there is newer version
                        return onBlocking();
                    },
                },
            );
        },
    };
}

export interface Idb<UserSchema> {
    isSupported: boolean;
    name: string;
    version: number;
    deleteDB: (name: string) => Promise<void>;
    db: IDBPDatabase<DBSchema & UserSchema> | null;
    onBlocked: () => void;
    onBlocking: () => void;
    onUpgrade: (
        db: IDBPDatabase<DBSchema & UserSchema>,
        oldVersion: number,
    ) => void;
    init: () => Promise<void>;
}
