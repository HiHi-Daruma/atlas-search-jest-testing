module.exports = async () => {
  if (global.__MONGO_CONTAINER__) {
    await global.__MONGO_CONTAINER__.stop();
  }
};
