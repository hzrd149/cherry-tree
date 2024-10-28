import { Container } from "@chakra-ui/react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

import { ErrorBoundary } from "./components/error-boundary";
import HomeView from "./views/home";
import Header from "./components/header";
import FileView from "./views/file";
import SettingsView from "./views/settings";
import PublishView from "./views/file/publish";
import ArchiveDownloadView from "./views/archive";
import ArchiveUploadView from "./views/archive/upload";

const router = createBrowserRouter([
  {
    path: "",
    element: (
      <Container gap="2" display="flex" flexDir="column" pb="10">
        <Header />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Container>
    ),
    children: [
      {
        path: "/",
        element: <HomeView />,
      },
      {
        path: "/file/:id",
        element: <FileView />,
      },
      {
        path: "/file/:id/publish",
        element: <PublishView />,
      },
      {
        path: "/archive/:nevent",
        element: <ArchiveDownloadView />,
      },
      {
        path: "/archive/:nevent/upload",
        element: <ArchiveUploadView />,
      },
      {
        path: "/settings",
        element: <SettingsView />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
