import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PosPage from "./modules/PosPage";

export default function PosPageFullscreen() {
  const { isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Request fullscreen on load (user interaction required)
    const handleFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.log("Fullscreen request failed:", err);
      }
    };

    // Small delay to allow page to render first
    const timer = setTimeout(handleFullscreen, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <div className="flex items-center justify-center h-screen bg-[#071F07] text-white">Loading...</div>;
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="w-screen h-screen overflow-hidden bg-[#071F07] p-3">
        <div className="w-full h-full rounded-lg overflow-hidden">
          <PosPage />
        </div>
      </div>
    </ProtectedRoute>
  );
}
