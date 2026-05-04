import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "@/components/Navigation";
import BubbleSpace from "@/pages/BubbleSpace";
import ContextManager from "@/pages/ContextManager";
import PrdOutput from "@/pages/PrdOutput";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <Navigation />
        <main className="flex-1 ml-16">
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
