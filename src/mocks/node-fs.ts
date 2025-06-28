export const statSync = () => {
  throw new Error('statSync is not available in browser environment');
};

export const createReadStream = () => {
  throw new Error('createReadStream is not available in browser environment');
};

export const promises = {
  readFile: async () => {
    throw new Error('fs.promises.readFile is not available in browser environment');
  },
  writeFile: async () => {
    throw new Error('fs.promises.writeFile is not available in browser environment');
  },
  stat: async () => {
    throw new Error('fs.promises.stat is not available in browser environment');
  }
};

export default {
  statSync,
  createReadStream,
  promises
};