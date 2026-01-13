import { Collection, Document, OptionalUnlessRequiredId } from "mongodb";
import {
  SearchIndexDefinition,
  SearchIndexStatus,
  SearchMetaCountResult,
} from "./search-index.types";

const POLLING_INTERVAL_MS = 200;
const DEFAULT_TIMEOUT_MS = 30000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const insertManyInAtlasSearch = async <T extends Document>(
  collection: Collection<T>,
  documents: OptionalUnlessRequiredId<T>[],
  searchIndexSpec: SearchIndexDefinition,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<void> => {
  const startTime = Date.now();

  await collection.insertMany(documents);

  await createSearchIndexAndWait(collection, searchIndexSpec, timeoutMs);

  const elapsedTime = Date.now() - startTime;
  const remainingTime = Math.max(0, timeoutMs - elapsedTime);

  await waitForDocumentsInIndex(
    collection,
    searchIndexSpec,
    documents.length,
    remainingTime,
  );
};

const createSearchIndexAndWait = async <T extends Document>(
  collection: Collection<T>,
  searchIndexSpec: SearchIndexDefinition,
  timeoutMs: number,
): Promise<void> => {
  try {
    await collection.createSearchIndex(searchIndexSpec);
    await waitForSearchIndexReady(collection, searchIndexSpec.name, timeoutMs);
  } catch (error) {
    throw new Error(
      `Error creating search index ${searchIndexSpec.name}: ${error instanceof Error ? error.message : error}`,
    );
  }
};

const waitForSearchIndexReady = async <T extends Document>(
  collection: Collection<T>,
  indexName: string,
  timeoutMs: number,
): Promise<void> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const indexes = (await collection
      .listSearchIndexes()
      .toArray()) as SearchIndexStatus[];
    const targetIndex = indexes.find((index) => index.name === indexName);

    if (targetIndex?.status === "READY") {
      return;
    }

    await delay(POLLING_INTERVAL_MS);
  }

  throw new Error(
    `Timeout: Search index ${indexName} was not ready in ${timeoutMs}ms`,
  );
};

const waitForDocumentsInIndex = async <T extends Document>(
  collection: Collection<T>,
  searchIndexSpec: SearchIndexDefinition,
  expectedDocumentCount: number,
  timeoutMs: number,
): Promise<void> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const [results] = await collection
      .aggregate<SearchMetaCountResult>([
        {
          $searchMeta: {
            index: searchIndexSpec.name,
            count: { type: "total" },
            exists: { path: "_id" },
          },
        },
      ])
      .toArray();

    if (results.count.total >= expectedDocumentCount) {
      return;
    }

    await delay(POLLING_INTERVAL_MS);
  }

  throw new Error(`Timeout: Documents were not inserted in ${timeoutMs}ms`);
};
