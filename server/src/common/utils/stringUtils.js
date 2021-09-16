function removeLine(data, regex) {
  return data
    .split("\n")
    .filter((val) => !regex.test(val))
    .join("\n");
}

module.exports = { removeLine };
