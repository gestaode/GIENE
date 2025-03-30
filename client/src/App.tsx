import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import CreateVideo from "@/pages/create-video";
import EditVideo from "@/pages/edit-video";
import SchedulePost from "@/pages/schedule-post";
import Library from "@/pages/library";
import Schedule from "@/pages/schedule";
import Leads from "@/pages/leads";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import TestAdvancedVideo from "@/pages/test-advanced-video";
import FFmpegTester from "@/pages/ffmpeg-tester";

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <MainLayout>
            <Dashboard />
          </MainLayout>
        )}
      </Route>
      <Route path="/create-video">
        {() => (
          <MainLayout>
            <CreateVideo />
          </MainLayout>
        )}
      </Route>
      <Route path="/edit-video/:id">
        {({ id }) => (
          <MainLayout>
            <EditVideo id={id} />
          </MainLayout>
        )}
      </Route>
      <Route path="/schedule-post/:id">
        {({ id }) => (
          <MainLayout>
            <SchedulePost id={id} />
          </MainLayout>
        )}
      </Route>
      <Route path="/library">
        {() => (
          <MainLayout>
            <Library />
          </MainLayout>
        )}
      </Route>
      <Route path="/schedule">
        {() => (
          <MainLayout>
            <Schedule />
          </MainLayout>
        )}
      </Route>
      <Route path="/leads">
        {() => (
          <MainLayout>
            <Leads />
          </MainLayout>
        )}
      </Route>
      <Route path="/analytics">
        {() => (
          <MainLayout>
            <Analytics />
          </MainLayout>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <MainLayout>
            <Settings />
          </MainLayout>
        )}
      </Route>
      <Route path="/test-advanced-video">
        {() => (
          <MainLayout>
            <TestAdvancedVideo />
          </MainLayout>
        )}
      </Route>
      <Route path="/ffmpeg-tester">
        {() => (
          <MainLayout>
            <FFmpegTester />
          </MainLayout>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
