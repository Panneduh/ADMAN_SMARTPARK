import { BrowserRouter, Routes, Route } from "react-router-dom";
import SPGSLandingPage from "./components/SPGSLandingPage";
import ParkingSelectionPage from "./components/ParkingSelectionPage";
import EngineeringFacultyLotPage from "./components/EngineeringFacultyLotPage";
import AboutUsPage from "./components/AboutUsPage";
import ComingSoonPage from "./pages/ComingSoonPage"; // 👈 ADD THIS

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SPGSLandingPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/select-lot" element={<ParkingSelectionPage />} />

        {/* REAL LOT PAGE */}
        <Route
          path="/lot/engineering-faculty"
          element={<EngineeringFacultyLotPage />}
        />

        {/* 👇 NEW COMING SOON PAGE */}
        <Route
          path="/coming-soon/:lotName"
          element={<ComingSoonPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;