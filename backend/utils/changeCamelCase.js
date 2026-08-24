const toCamelCase = (str) => {
  return str
    ?.toLowerCase()
    ?.replace(/([-_\s][a-z])/g, (match) => {
      return match
        .toUpperCase()
        .replace("-", "")
        .replace("_", "")
        .replace(" ", "");
    })
    ?.replace(/^[a-z]/, (match) => match.toLowerCase());
};

module.exports = { toCamelCase };
