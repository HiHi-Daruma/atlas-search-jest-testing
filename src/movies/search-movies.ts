import { Collection } from "mongodb";
import { Movie } from "./movie.types";

export const searchMovies = async (
  collection: Collection<Movie>,
  query: string,
): Promise<Movie[]> => {
  return collection
    .aggregate<Movie>([
      {
        $search: {
          index: "movies_search",
          text: {
            query: query,
            path: {
              wildcard: "*",
            },
          },
        },
      },
    ])
    .toArray();
};
