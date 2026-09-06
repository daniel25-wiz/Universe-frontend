import { StrictMode, useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

/**
 * Removes the static HTML boot skeleton in the same commit React paints its
 * first tree (layout effect runs before paint), so there's no flash: the boot
 * skeleton is replaced by the route's Suspense skeleton instantly.
 */
const BootSkeletonRemover = () => {
  useLayoutEffect(() => {
    document.getElementById('boot-skeleton')?.remove();
  }, []);
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BootSkeletonRemover />
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

