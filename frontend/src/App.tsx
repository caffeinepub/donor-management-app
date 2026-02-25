import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import DonorListPage from './pages/DonorListPage';
import DonorDetailPage from './pages/DonorDetailPage';
import DonorFormPage from './pages/DonorFormPage';
import AdminPanelPage from './pages/AdminPanelPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import SubAccountLoginPage from './pages/SubAccountLoginPage';

const queryClient = new QueryClient();

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const rootRoute = createRootRoute({ component: Layout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DonorListPage,
});

const donorDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/donor/$logNumber',
  component: DonorDetailPage,
});

const addDonorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/donor/add',
  component: DonorFormPage,
});

const editDonorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/donor/$logNumber/edit',
  component: DonorFormPage,
});

const adminPanelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPanelPage,
});

const profileSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile-setup',
  component: ProfileSetupPage,
});

const subAccountLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: SubAccountLoginPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  addDonorRoute,
  donorDetailRoute,
  editDonorRoute,
  adminPanelRoute,
  profileSetupRoute,
  subAccountLoginRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
