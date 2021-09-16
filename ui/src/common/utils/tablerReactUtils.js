function asTablerInputError(meta) {
  return meta.touched && meta.error
    ? {
        feedback: meta.error,
        invalid: true,
      }
    : {};
}

module.exports = {
  asTablerInputError,
};
