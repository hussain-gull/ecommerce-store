import { v7 } from "uuid";

/** UUIDv7 (time-ordered, B-tree friendly). */
export const uuidv7 = (): string => v7();
