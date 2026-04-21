import { BrowserRouter, Routes, Route } from "react-router-dom";
import SPGSLandingPage from "./components/SPGSLandingPage";
import ParkingSelectionPage from "./components/ParkingSelectionPage";
import EngineeringFacultyLotPage from "./components/EngineeringFacultyLotPage";
import AboutUsPage from "./components/AboutUsPage";
import MeetTheTeamPage from "./components/MeetTheTeamPage";
import FutureImplementationPage from "./components/FutureImplementationPage";
import GalleryPage from "./components/GalleryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SPGSLandingPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/team" element={<MeetTheTeamPage />} />
        <Route path="/select-lot" element={<ParkingSelectionPage />} />
        <Route path="/future" element={<FutureImplementationPage />} />
        <Route path="/gallery" element={<GalleryPage />} />

        <Route
          path="/lot/engineering-faculty"
          element={<EngineeringFacultyLotPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;