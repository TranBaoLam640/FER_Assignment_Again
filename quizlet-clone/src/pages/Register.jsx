import React, { useState } from "react";
import { Container, Form, Button, Card, Navbar, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const API_USERS_URL = "http://localhost:3001/users";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !password.trim()) {
      setError("Vui lòng điền đầy đủ Tên đăng nhập và Mật khẩu!");
      return;
    }

    try {
      const checkRes = await fetch(
        `${API_USERS_URL}?user_name=${encodeURIComponent(username.trim())}`,
      );
      const existingUsers = await checkRes.json();

      if (existingUsers.length > 0) {
        setError("Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác!");
        return;
      }

      // Bước 2: Tạo cấu trúc dữ liệu theo đúng yêu cầu hệ thống
      const payload = {
        user_name: username.trim(),
        user_password: password.trim(), // Lưu ý: Trong thực tế nên hash password ở backend
      };

      // Bước 3: Gửi request POST tạo user mới
      const res = await fetch(API_USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess("Đăng ký tài khoản thành công! Đang chuyển hướng...");
        setUsername("");
        setPassword("");

        // Tự động chuyển hướng về trang chủ hoặc trang login sau 2 giây
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError("Có lỗi xảy ra từ phía máy chủ khi tạo tài khoản.");
      }
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      setError("Không thể kết nối đến máy chủ...");
    }
  };

  return (
    <div style={{ backgroundColor: "#f6f7fb", minHeight: "100vh" }}>
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
            <h3 className="fw-bold text-dark text-center mb-4">
              Tạo tài khoản mới
            </h3>

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

            <Form onSubmit={handleRegister}>
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
                Đăng ký
              </Button>

              <div className="text-center small text-muted">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-decoration-none fw-semibold">
                  Đăng nhập
                </Link>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
