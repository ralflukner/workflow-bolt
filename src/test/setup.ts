import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Jest's expect with the matchers from jest-dom
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
}); 