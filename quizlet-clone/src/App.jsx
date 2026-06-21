import { React, useState,useEffect} from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Navbar, Container, Button } from "react-bootstrap";
import Home from "./pages/Home";
import SetDetail from "./pages/SetDetail";
import StudySession from "./pages/StudySession";
import CreateSet from "./pages/CreateSet";
import LearningSession from "./pages/LearningSession";
import Register from "./pages/Register";
import Login from "./pages/Login";
import TestSession from "./pages/TestSession";
import MatchGame from "./pages/MatchGame";
import { useNavigate } from "react-router-dom";
import { testConnection } from "./api/testApi";
function NavigationBar({ user, onLogout }) {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          🧠 Quizlet Clone
        </Navbar.Brand>

        {/* Giao diện tự động cập nhật ngay khi biến 'user' thay đổi state */}
        {user ? (
          <div className="d-flex align-items-center gap-3">
            <span className="text-light small opacity-75">
              Chào, {user.userName}
            </span>

            <Button
              variant="outline-danger"
              size="sm"
              className="rounded-pill px-3 fw-bold"
              onClick={onLogout} // Gọi hàm logout mượt mà, không F5 trang
            >
              Đăng xuất 🚪
            </Button>
          </div>
        ) : (
          // Nếu chưa đăng nhập, hiển thị nút Đăng nhập / Đăng ký gọn gàng
          <div className="d-flex gap-2">
            <Button
              as={Link}
              to="/login"
              variant="outline-light"
              size="sm"
              className="rounded-pill px-3"
            >
              Đăng nhập
            </Button>
          </div>
        )}
      </Container>
    </Navbar>
  );
}
function MainApp() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  useEffect(() => {
    testConnection();
  }, []);
  // Hàm xử lý đăng xuất mượt mà bằng State
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    navigate("/");
  };
  return (
    <>
      {/* Truyền dữ liệu user và hàm logout xuống cho Navbar gánh vác */}
      <NavigationBar user={currentUser} onLogout={handleLogout} />

      {/* Định tuyến các trang */}
      <Routes>
        <Route path="/" element={<Home currentUser={currentUser} />} />
        <Route path="/set/:setId" element={<SetDetail />} />
        <Route path="/set/:setId/study" element={<StudySession />} />
        <Route
          path="/create"
          element={<CreateSet currentUser={currentUser} />}
        />
        <Route path="/set/:setId/learn" element={<LearningSession />} />
        <Route path="/register" element={<Register />} />
        <Route path="/set/:setId/test" element={<TestSession />} />
        <Route path="/set/:setId/game" element={<MatchGame />} />

        {/* 🔥 TRUYỀN THÊM hàm setCurrentUser vào trang Login để khi đăng nhập xong nó cập nhật ngược lại App */}
        <Route
          path="/login"
          element={<Login onLoginSuccess={setCurrentUser} />}
        />

        <Route
          path="*"
          element={
            <div className="container mt-4">
              <h3>404 - Không tìm thấy trang</h3>
            </div>
          }
        />
      </Routes>
    </>
  );
}
function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  );
}
export default App;
