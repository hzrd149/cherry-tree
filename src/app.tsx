import { Container } from "@chakra-ui/react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";

import Header from "./components/header";
import ArchiveDownloadView from "./views/archive";
import ArchiveUploadView from "./views/archive/upload";
import FileView from "./views/file";
import PublishView from "./views/file/publish";
import HomeView from "./views/home";
import SettingsView from "./views/settings";
import { ErrorBoundary } from "./components/error-boundary";
import { Suspense } from "react";

function RootLayout() {
  return (
    <Container gap="2" display="flex" flexDir="column" pb="10">
      <Header />
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </Container>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE}>
      <Routes>
        <Route Component={RootLayout}>
          <Route path="/" element={<HomeView />} />
          <Route path="/file/:id" element={<FileView />} />
          <Route path="/file/:id/publish" element={<PublishView />} />
          <Route path="/archive/:nevent" element={<ArchiveDownloadView />} />
          <Route path="/archive/:nevent/upload" element={<ArchiveUploadView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
