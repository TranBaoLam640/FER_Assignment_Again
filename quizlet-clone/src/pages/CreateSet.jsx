import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';

const API_URL = 'http://localhost:3001/sets';

function CreateSet() {
  // ===== STATE =====
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState([
    { newWord: '', definition: '', imageUrl: '' }
  ]);

  // Danh sách tất cả bộ thẻ đã tạo (để hiển thị + sửa/xóa)
  const [sets, setSets] = useState([]);

  // ID của bộ thẻ đang được chỉnh sửa (null = đang tạ          o mới)
  const [editingId, setEditingId] = useState(null);

  // Thông báo kết quả
  const [alert, setAlert] = useState(null); // { variant, message }

  // ===== FETCH DATA KHI LOAD TRANG =====
  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setSets(data);
      console.log(data);
    } catch (err) {
      showAlert('danger', 'Không thể kết nối đến json-server. Hãy chắc chắn đã chạy lệnh: npx json-server --watch db.json --port 3001');
    }
  };

  const showAlert = (variant, message) => {
    setAlert({ variant, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // ===== XỬ LÝ CARDS =====
  const handleCardChange = (index, field, value) => {
    const updated = [...cards];
    updated[index][field] = value;
    setCards(updated);
  };

  const handleAddCard = () => {
    setCards([...cards, { newWord: '', definition: '', imageUrl: '' }]);
  };

  const handleDeleteCard = (indexToRemove) => {
    if (cards.length === 1) {
      showAlert('warning', 'Bộ thẻ phải có ít nhất 1 thẻ từ vựng!');
      return;
    }
    setCards(cards.filter((_, i) => i !== indexToRemove));
  };

  // ===== RESET FORM =====
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCards([{ newWord: '', definition: '', imageUrl: '' }]);
    setEditingId(null);
  };

  // ===== TẠO MỚI hoặc CẬP NHẬT (PUT) =====
  const 
  handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showAlert('warning', 'Vui lòng nhập Tiêu đề cho bộ thẻ!');
      return;
    }

    const payload = { title, description, cards };

    try {
      let res;

      if (editingId !== null) {
        // === CẬP NHẬT (PUT) ===
        res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // === TẠO MỚI (POST) ===
        res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        showAlert('success', editingId ? 'Cập nhật bộ thẻ thành công!' : 'Tạo bộ thẻ mới thành công!');
        resetForm();
        fetchSets(); // Refresh danh sách
      } else {
        throw new Error('Server trả về lỗi');
      }
    } catch (err) {
      showAlert('danger', 'Có lỗi xảy ra, không thể lưu bộ thẻ.');
    }
  };

  // ===== NẠP DỮ LIỆU VÀO FORM ĐỂ SỬA =====
  const handleEdit = (set) => {
    setEditingId(set.id);
    setTitle(set.title);
    setDescription(set.description);
    setCards(set.cards);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== XÓA BỘ THẺ (DELETE) =====
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bộ thẻ này không?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showAlert('success', 'Đã xóa bộ thẻ!');
        fetchSets();
        if (editingId === id) resetForm(); // Nếu đang sửa cái này thì reset form
      } else {
        throw new Error();
      }
    } catch {
      showAlert('danger', 'Không thể xóa bộ thẻ.');
    }
  };

  // ===== RENDER =====
  return (
    <Container className="my-5" style={{ maxWidth: '800px' }}>
      {/* THÔNG BÁO */}
      {alert && (
        <Alert variant={alert.variant} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* TIÊU ĐỀ */}
      <h2 className="mb-4 text-dark fw-bold">
        {editingId ? '✏️ Chỉnh sửa bộ thẻ' : 'Tạo học phần mới'}
      </h2>

      <Form onSubmit={handleSubmit}>
        {/* THÔNG TIN CHUNG */}
        <Card className="bg-light border-0 p-4 mb-4 rounded-3">
          <Form.Group className="mb-3" controlId="formSetTitle">
            <Form.Label className="fw-bold">Tiêu đề *</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề, ví dụ: 'Tiếng Anh IT - Bài 1'"
              size="lg"
            />
          </Form.Group>

          <Form.Group controlId="formSetDescription">
            <Form.Label className="fw-bold">Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thêm mô tả ngắn gọn..."
            />
          </Form.Group>
        </Card>

        {/* DANH SÁCH CARDS */}
        <h3 className="mb-3 text-dark h4">Danh sách từ vựng</h3>

        {cards.map((card, index) => (
          <Card key={index} className="mb-4 shadow-sm rounded-3">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3 border-bottom-0">
              <span className="fw-bold text-muted">#{index + 1}</span>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDeleteCard(index)}
              >
                Xóa thẻ
              </Button>
            </Card.Header>

            <Card.Body className="pt-0">
              <Row>
                <Col md={4} className="mb-3 mb-md-0">
                  <Form.Group controlId={`word-${index}`}>
                    <Form.Label className="small text-muted fw-semibold">Thuật ngữ (New Word)</Form.Label>
                    <Form.Control
                      type="text"
                      value={card.newWord}
                      onChange={(e) => handleCardChange(index, 'newWord', e.target.value)}
                      placeholder="Từ mới..."
                      className="border-top-0 border-start-0 border-end-0 rounded-0 border-2 border-dark px-1"
                      style={{ boxShadow: 'none' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={4} className="mb-3 mb-md-0">
                  <Form.Group controlId={`def-${index}`}>
                    <Form.Label className="small text-muted fw-semibold">Định nghĩa (Definition)</Form.Label>
                    <Form.Control
                      type="text"
                      value={card.definition}
                      onChange={(e) => handleCardChange(index, 'definition', e.target.value)}
                      placeholder="Nghĩa của từ..."
                      className="border-top-0 border-start-0 border-end-0 rounded-0 border-2 border-dark px-1"
                      style={{ boxShadow: 'none' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group controlId={`img-${index}`}>
                    <Form.Label className="small text-muted fw-semibold">Link ảnh (Image URL)</Form.Label>
                    <Form.Control
                      type="text"
                      value={card.imageUrl}
                      onChange={(e) => handleCardChange(index, 'imageUrl', e.target.value)}
                      placeholder="https://example.com/anh.jpg"
                      className="border-top-0 border-start-0 border-end-0 rounded-0 border-2 border-dark px-1"
                      style={{ boxShadow: 'none' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}

        {/* NÚT THÊM THẺ */}
        <Button
          variant="outline-primary"
          onClick={handleAddCard}
          className="w-100 py-3 fw-bold mb-4 bg-white"
          style={{ borderStyle: 'dashed', borderWidth: '2px', fontSize: '16px' }}
        >
          + Add a card
        </Button>

        {/* NÚT SUBMIT + HỦY SỬA */}
        <div className="d-flex justify-content-end gap-2">
          {editingId && (
            <Button variant="outline-secondary" size="lg" onClick={resetForm}>
              Hủy chỉnh sửa
            </Button>
          )}
          <Button type="submit" variant="primary" size="lg" className="px-5 fw-bold">
            {editingId ? 'Lưu thay đổi' : 'Tạo bộ học phần'}
          </Button>
        </div>
      </Form>

      {/* ===== DANH SÁCH CÁC BỘ THẺ ĐÃ TẠO ===== */}
      {sets.length > 0 && (
        <>
          <hr className="my-5" />
          <h3 className="mb-4 text-dark fw-bold">📚 Các bộ thẻ đã tạo ({sets.length})</h3>
          {sets.map((set) => (
            <Card key={set.id} className="mb-3 shadow-sm rounded-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="fw-bold mb-1">{set.title}</h5>
                    {set.description && (
                      <p className="text-muted small mb-1">{set.description}</p>
                    )}
                    <span className="badge bg-secondary">{set.cards?.length || 0} thẻ</span>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEdit(set)}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(set.id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </>
      )}
    </Container>
  );
}

export default CreateSet;