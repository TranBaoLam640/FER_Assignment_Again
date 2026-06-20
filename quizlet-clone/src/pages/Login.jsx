import React, { useState } from "react";
import { Container, Form, Button, Card, Navbar, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const API_USERS_URL = "http://localhost:3001/users";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // 1. Kiểm tra dữ liệu đầu vào cơ bản
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!");
      return;
    }

    try {
      // 2. Gọi API lọc tài khoản theo tên đăng nhập người dùng nhập vào
      const res = await fetch(
        `${API_USERS_URL}?user_name=${encodeURIComponent(username.trim())}`,
      );
      const users = await res.json();

      // 3. Kiểm tra xem có tồn tại tài khoản đó không
      if (users.length === 0) {
        setError("Tên đăng nhập không tồn tại trong hệ thống!");
        return;
      }

      const matchingUser = users[0];

      // 4. Đối chiếu mật khẩu
      if (matchingUser.user_password !== password.trim()) {
        setError("Mật khẩu không chính xác! Vui lòng thử lại.");
        return;
      }

      // 5. Đăng nhập thành công
      setSuccess("Đăng nhập thành công! Đang chuyển hướng...");

      // Lưu thông tin user vào localStorage để các trang khác biết ai đang đăng nhập
      const loggedInUser = {
        userId: matchingUser.id,
        userName: matchingUser.user_name,
      };

      localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
      
      onLoginSuccess(loggedInUser);
      // Chuyển hướng sang trang chủ sau 1.5 giây
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      setError("Không thể kết nối đến máy chủ...");
    }
  };

  return (
    <div style={{ backgroundColor: "#f6f7fb", minHeight: "100vh" }}>
      {/* FORM ĐĂNG NHẬP CHÍNH */}
      <Container
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "calc(100vh - 56px)" }}
      >
        <Card
          className="border-0 shadow-sm p-4 rounded-4"
          style={{
            width: "100%",
            maxWidth: "420px",
            backgroundColor: "#ffffff",
          }}
        >
          <Card.Body>
            <h3 className="fw-bold text-dark text-center mb-4">Đăng nhập</h3>

            {/* Khu vực hiển thị thông báo lỗi / thành công */}
            {error && (
              <Alert variant="danger" className="py-2 small">
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="py-2 small">
                {success}
              </Alert>
            )}

            <Form onSubmit={handleLogin}>
              {/* INPUT USERNAME */}
              <Form.Group className="mb-3" controlId="formUsername">
                <Form.Label className="fw-semibold text-secondary small">
                  Tên đăng nhập
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên tài khoản..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="py-2"
                />
              </Form.Group>

              {/* INPUT PASSWORD */}
              <Form.Group className="mb-4" controlId="formPassword">
                <Form.Label className="fw-semibold text-secondary small">
                  Mật khẩu
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="py-2"
                />
              </Form.Group>

              {/* BUTTON SUBMIT */}
              <Button
                type="submit"
                variant="primary"
                className="w-100 py-2 fw-bold rounded-pill shadow-sm mb-3"
              >
                Đăng nhập
              </Button>

              <div className="text-center small text-muted">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="text-decoration-none fw-semibold"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
