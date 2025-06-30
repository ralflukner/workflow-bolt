import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

export function render(ui: React.ReactElement, options?: RenderOptions) {
  return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options);
}

export * from '@testing-library/react'; 