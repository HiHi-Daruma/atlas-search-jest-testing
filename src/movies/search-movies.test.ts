import { Collection, Db, MongoClient } from "mongodb";
import { StartedTestContainer } from "testcontainers";
import { Movie } from "./movie.types";
import { searchMovies } from "./search-movies";
import { insertManyInAtlasSearch } from "../test-utils/insert-many-in-atlas-search";

describe("searchMovies", () => {
  let container: StartedTestContainer;
  let client: MongoClient;
  let db: Db;
  let collection: Collection<Movie>;

  const testMovies: Movie[] = [
    {
      _id: "1",
      title: "Inception",
      genres: ["Action", "Sci-Fi"],
      plot: "A thief who steals corporate secrets through the use of dream-sharing technology.",
    },
    {
      _id: "2",
      title: "The Dark Knight",
      genres: ["Action", "Crime"],
      plot: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must fight injustice.",
    },
    {
      _id: "3",
      title: "Interstellar",
      genres: ["Adventure", "Sci-Fi"],
      plot: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    },
    {
      _id: "4",
      title: "The Matrix",
      genres: ["Action", "Sci-Fi"],
      plot: "A computer hacker learns about the true nature of his reality and his role in the war against its controllers.",
    },
  ];

  const searchIndexSpec = {
    name: "movies_search",
    definition: {
      mappings: {
        dynamic: true,
        fields: {},
      },
    },
  };

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URL);
    await client.connect();

    db = client.db("test");
    collection = db.collection<Movie>("movies");

    await insertManyInAtlasSearch(collection, testMovies, searchIndexSpec);
  });

  afterAll(async () => {
    await client?.close();
    await container?.stop();
  });

  it("should find movies by title", async () => {
    const results = await searchMovies(collection, "Inception");
    expect(results).toEqual([testMovies[0]]);
  });

  it("should find movies by genre", async () => {
    const results = await searchMovies(collection, "Sci-Fi");
    expect(results).toEqual([testMovies[0], testMovies[2], testMovies[3]]);
  });

  it("should find movies by plot", async () => {
    const results = await searchMovies(collection, "Joker");
    expect(results).toEqual([testMovies[1]]);
  });

  it("should return empty array when no results found", async () => {
    const results = await searchMovies(collection, "NonExistentMovie");
    expect(results).toEqual([]);
  });
});
