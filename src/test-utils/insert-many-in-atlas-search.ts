import { Collection, Document, OptionalUnlessRequiredId } from "mongodb";
import { SearchIndexDefinition, SearchIndexStatus } from "./types/search-index";

export const insertManyInAtlasSearch = async <T extends Document>(
  collection: Collection<T>,
  documents: OptionalUnlessRequiredId<T>[],
  searchIndexSpec: SearchIndexDefinition,
  timeoutMs = 60000,
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
    throw new Error(`Error creating search index ${searchIndexSpec.name}`);
  }
};

const waitForSearchIndexReady = async <T extends Document>(
  collection: Collection<T>,
  indexName: string,
  timeoutMs: number,
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const indexes = (await collection
        .listSearchIndexes()
        .toArray()) as SearchIndexStatus[];
      const targetIndex = indexes.find((index) => index.name === indexName);

      if (targetIndex?.status === "READY") {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new Error(
    `Timeout: Search ${indexName} was not ready in ${timeoutMs}ms`,
  );
};

const waitForDocumentsInIndex = async <T extends Document>(
  collection: Collection<T>,
  searchIndexSpec: SearchIndexDefinition,
  expectedDocumentCount: number,
  timeoutMs: number,
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const results = await collection
        .aggregate([
          {
            $searchMeta: {
              index: searchIndexSpec.name,
              count: { type: "total" },
              exists: { path: "_id" },
            },
          },
        ])
        .toArray();

      const actualCount = results[0]?.count?.total ?? 0;

      if (actualCount >= expectedDocumentCount) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new Error(
    `Timeout: Only ${await getIndexedDocumentCount(
      collection,
      searchIndexSpec,
    )} documents have been inserted in ${timeoutMs}ms instead of ${expectedDocumentCount}`,
  );
};

const getIndexedDocumentCount = async <T extends Document>(
  collection: Collection<T>,
  searchIndexSpec: SearchIndexDefinition,
): Promise<number> => {
  try {
    const indexedDocuments = await collection
      .aggregate([
        {
          $search: {
            index: searchIndexSpec.name,
            compound: {
              must: [{ exists: { path: "_id" } }],
            },
          },
        },
        { $project: { _id: 1 } },
      ])
      .toArray();
    return indexedDocuments.length;
  } catch {
    return 0;
  }
};
