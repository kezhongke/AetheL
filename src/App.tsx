import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainNavigation from "@/components/MainNavigation";
import Navigation from "@/components/Navigation";
import BubbleSpace from "@/pages/BubbleSpace";
import ContextManager from "@/pages/ContextManager";
import PrdOutput from "@/pages/PrdOutput";
import { useWorkspacePersistence } from "@/hooks/useWorkspacePersistence";

export default function App() {
  useWorkspacePersistence();

  return (
    <Router>
      <div className="flex min-h-screen">
        <MainNavigation />
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<BubbleSpace />} />
            <Route path="/context" element={<ContextManager />} />
            <Route path="/prd" element={<PrdOutput />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
