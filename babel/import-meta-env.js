module.exports = function () {
  return {
    name: 'transform-import-meta-env',
    visitor: {
      MetaProperty(path) {
        // Transform `import.meta` -> ({ env: process.env })
        const { node } = path;
        if (node.meta && node.meta.name === 'import' && node.property.name === 'meta') {
          path.replaceWithSourceString('({ env: process.env })');
        }
      },
    },
  };
}; 