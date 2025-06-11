const consoleLogger = {
  info: (m, d) => console.log(m, d || ''),
  warn: (m, d) => console.warn(m, d || ''),
  error: (m, d) => console.error(m, d || ''),
};

module.exports = { consoleLogger };