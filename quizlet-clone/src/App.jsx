import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Navbar, Container } from "react-bootstrap";
import Home from "./pages/Home";
import SetDetail from "./pages/SetDetail";
import StudySession from "./pages/StudySession";
import CreateSet from "./pages/CreateSet";
import CreateSetOcr from "./pages/CreateSetOcr" ;

function App() {
  return (
    <BrowserRouter>
      {/* Thanh Điều Hướng (Navbar) chung cho toàn App */}
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">
            🧠 Quizlet Clone
          </Navbar.Brand>
        </Container>
      </Navbar>

      {/* Định tuyến các trang */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/set/:setId" element={<SetDetail />} />
        <Route path="/set/:setId/study" element={<StudySession />} />
        <Route path="/create" element={<CreateSet />} />
        <Route path="/createSetOcr" element={<CreateSetOcr />} />
        {/* Route dự phòng nếu gõ sai URL */}
        <Route
          path="*"
          element={
            <div className="container mt-4">
              <h3>404 - Không tìm thấy trang</h3>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
