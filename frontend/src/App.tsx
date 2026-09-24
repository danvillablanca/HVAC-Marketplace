import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "@/components/layout/public-layout";
import HomePage from "@/pages/HomePage";
import MapPage from "@/pages/MapPage";
import SearchPage from "@/pages/SearchPage";
import ProviderPage from "@/pages/ProviderPage";
import ChatPage from "@/pages/ChatPage";
import ForProvidersPage from "@/pages/ForProvidersPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProviderPanelPage from "@/pages/panel/ProviderPanelPage";
import ProviderVerificationPage from "@/pages/panel/ProviderVerificationPage";
import AdminVerificationPage from "@/pages/panel/AdminVerificationPage";
import ClientRequestsPage from "@/pages/panel/ClientRequestsPage";

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/buscar" element={<SearchPage />} />
        <Route path="/proveedor/:id" element={<ProviderPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/para-proveedores" element={<ForProvidersPage />} />
        <Route path="/ingresar" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/panel/proveedor" element={<ProviderPanelPage />} />
        <Route path="/panel/proveedor/verificacion" element={<ProviderVerificationPage />} />
        <Route path="/panel/admin/verificaciones" element={<AdminVerificationPage />} />
        <Route path="/panel/solicitudes" element={<ClientRequestsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
