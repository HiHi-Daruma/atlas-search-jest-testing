const { GenericContainer, Wait } = require("testcontainers");

module.exports = async () => {
  const container = await new GenericContainer(
    "mongodb/mongodb-atlas-local:latest",
  )
    .withExposedPorts(27017)
    .withWaitStrategy(Wait.forHealthCheck())
    .start();

  const port = container.getFirstMappedPort();
  const host = container.getHost();

  process.env.MONGODB_URL = `mongodb://${host}:${port}?directConnection=true`;

  global.__MONGO_CONTAINER__ = container;
};
