const throwIf = (condition, errorInstance) => {
  if (condition) {
    throw errorInstance;
  }
};

export { throwIf };
