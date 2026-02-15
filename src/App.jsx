import { useState } from "react";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [tab, setTab] = useState("inicio");

  return (
    <MainLayout>
      <Home />
      <BottomNav active={tab} onChange={setTab} />
    </MainLayout>
  );
}
