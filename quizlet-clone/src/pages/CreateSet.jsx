import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Card,
  Row,
  Col,
  Alert,
} from "react-bootstrap";

const API_URL = "http://localhost:3001/sets";

function CreateSet() {
  // ===== STATE =====
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState([
    { newWord: "", definition: "", imageUrl: "" },
  ]);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState([]);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [text, setText] = useState("");
  const [payloadArray, setPayloadArray] = useState([]);
  const [sets, setSets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState("");
  // State điều khiển ẩn/hiện ô nhập văn bản thô
  const [showTextAreaInput, setShowTextAreaInput] = useState(false);
  const [rawText, setRawText] = useState("");

  // ===== FETCH DATA KHI LOAD TRANG =====
  useEffect(() => {
    fetchSets();
  }, []);

  const fileToDataURL = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChangeAndProcess = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    // Đảm bảo thư viện Puter đã được nạp từ thẻ script trong index.html
    if (!window.puter) {
      alert("Puter.js library is not loaded yet");
      return;
    }

    setProgress("");
    setResults([]);
    setShowSaveButton(false);

    const tempResults = [];
    const localPayloadArray = []; // Dùng mảng tạm cục bộ để gom hết từ của mọi ảnh trước

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`Processing image ${i + 1} of ${files.length}...`);

      try {
        const dataUrl = await fileToDataURL(file);
        const text = await window.puter.ai.img2txt(dataUrl);
        setText(text);
        const successResult = {
          filename: file.name,
          text: text || "No text found",
          timestamp: new Date().toISOString(),
          isError: false,
        };

        const textArray = text.split(";");
        const textArrayTrim = textArray
          .flatMap((item) => item.split("\n"))
          .map((item) => item.trim())
          .filter((item) => item.includes(":"));

        textArrayTrim.map((item) => {
          const newObject = {
            newWord: item.split(":")[0].trim(),
            definition: item.split(":")[1].trim(),
            imageUrl: "",
          };
          localPayloadArray.push(newObject); // Đẩy vào mảng cục bộ
        });

        tempResults.push(successResult);
        setResults((prev) => [...prev, successResult]);
      } catch (error) {
        const errorResult = {
          filename: file.name,
          text: `Error - ${error.message}`,
          isError: true,
        };
        tempResults.push(errorResult);
        setResults((prev) => [...prev, errorResult]);
      }
    }
    setCards([...cards, ...localPayloadArray]);
    setPayloadArray((prev) => [...prev, ...localPayloadArray]);

    setProgress("All images processed!");
    const hasSuccess = tempResults.some((r) => !r.isError);
    if (hasSuccess) {
      setShowSaveButton(true);
    }

    e.target.value = "";
  };

  const fetchSets = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setSets(data);
    } catch (err) {
      showAlert("danger", "Không thể kết nối đến json-server...");
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
    setCards([...cards, { newWord: "", definition: "", imageUrl: "" }]);
  };

  const handleDeleteCard = (indexToRemove) => {
    if (cards.length === 1) {
      showAlert("warning", "Bộ thẻ phải có ít nhất 1 thẻ từ vựng!");
      return;
    }
    setCards(cards.filter((_, i) => i !== indexToRemove));
  };

  // ===== LOGIC TỰ XỬ LÝ (BẠN SẼ VIẾT VÀO ĐÂY) =====
  const handleImportRawText = () => {
    if (!rawText || !rawText.trim()) return;

    const localPayloadArray = [];

    // Bước 1: Tách thành từng nhóm thẻ dựa trên dấu phân tách dòng ";"
    const rawCards = rawText.split(";");

    rawCards.forEach((rawCard) => {
      const trimmedCard = rawCard.trim();
      if (!trimmedCard) return;

      const lastColonIndex = trimmedCard.lastIndexOf(":");

      if (lastColonIndex !== -1) {
        const newWord = trimmedCard.substring(0, lastColonIndex).trim();
        // Phần sau dấu ":" cuối cùng là đáp án
        const definition = trimmedCard.substring(lastColonIndex + 1).trim();

        if (newWord && definition) {
          localPayloadArray.push({
            newWord: newWord,
            definition: definition,
            imageUrl: "",
          });
        }
      }
    });

    console.log("Imported Cards:", localPayloadArray);
    setCards([...cards, ...localPayloadArray]);
  };

  // ===== RESET FORM =====
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCards([{ newWord: "", definition: "", imageUrl: "" }]);
    setEditingId(null);
    setRawText("");
    setShowTextAreaInput(false);
  };

  // ===== TẠO MỚI hoặc CẬP NHẬT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề của set");
      return;
    }

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card.newWord.trim() || !card.definition.trim()) {
        setError(
          `Thẻ #${i + 1} còn trống dữ liệu. Vui lòng điền cả Thuật ngữ và Định nghĩa!`,
        );
        return;
      }
    }

    setError("");

    const payload = { title, description, cards };
    try {
      let res;
      if (editingId !== null) {
        res = await fetch(`${API_URL}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        showAlert(
          "success",
          editingId
            ? "Cập nhật bộ thẻ thành công!"
            : "Tạo bộ thẻ mới thành công!",
        );
        resetForm();
        fetchSets();
      }
    } catch (err) {
      showAlert("danger", "Có lỗi xảy ra, không thể lưu bộ thẻ.");
    }
  };

  const handleEdit = (set) => {
    setEditingId(set.id);
    setTitle(set.title);
    setDescription(set.description);
    setCards(set.cards);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa bộ thẻ này không?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (res.ok) {
        showAlert("success", "Đã xóa bộ thẻ!");
        fetchSets();
        if (editingId === id) resetForm();
      }
    } catch {
      showAlert("danger", "Không thể xóa bộ thẻ.");
    }
  };
  const handleImportSource = () => {
    if (!rawText || !rawText.trim()) return;

    const localPayloadArray = [];

    // Bước 1: Tách thành từng nhóm thẻ dựa trên dấu phân tách dòng ";"
    const rawCards = rawText.split(";");

    rawCards.forEach((rawCard) => {
      const trimmedCard = rawCard.trim();
      if (!trimmedCard) return;

      // Tìm dấu ":" cuối cùng để tách vế
      const lastColonIndex = trimmedCard.lastIndexOf(":");

      if (lastColonIndex !== -1) {
        const rawNewWord = trimmedCard.substring(0, lastColonIndex).trim();
        const definition = trimmedCard.substring(lastColonIndex + 1).trim();

        if (rawNewWord && definition) {
          // XỬ LÝ FORMAT CHO newWord (Word):
          // Ép câu hỏi ở 1 dòng, A., B., C., D. tự động xuống dòng riêng biệt
          const formattedNewWord = rawNewWord
            .replace(/\s*\b(A\.|B\.|C\.|D\.)\s*/g, "\n$1 ")
            .replace(/\n+/g, "\n")
            .trim();

          // Push vào mảng đúng y hệt template của bạn, không thêm thắt State thừa
          localPayloadArray.push({
            newWord: formattedNewWord,
            definition: definition,
            imageUrl: "",
          });
        }
      }
    });

    console.log("Imported Cards:", localPayloadArray);
    setCards([...cards, ...localPayloadArray]);
  };

  return (
    <Container className="my-5" style={{ maxWidth: "800px" }}>
      {/* THÔNG BÁO */}
      {alert && (
        <Alert
          variant={alert.variant}
          dismissible
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {/* TIÊU ĐỀ */}
      <h2 className="mb-4 text-dark fw-bold">
        {editingId ? "✏️ Chỉnh sửa bộ thẻ" : "Tạo học phần mới"}
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

        {/* ===== KHU VỰC 2 BUTTON TÍNH NĂNG NHẬP NHANH ===== */}
        <div className="mb-4 bg-white p-3 border rounded-3 shadow-sm">
          <div className="d-flex justify-content-between align-items-center">
            <span className="small text-muted fw-bold">
              💡 Nhập dữ liệu nhanh:
            </span>
            <div className="d-flex gap-2">
              {/* Button 1: Nhập văn bản thô */}
              <Button
                variant="outline-dark"
                size="sm"
                onClick={() => setShowTextAreaInput(!showTextAreaInput)}
              >
                {showTextAreaInput ? "✕ Đóng" : " Nhập văn bản thô"}
              </Button>

              {/* Button 2: Quét ảnh từ vựng (OCR) */}
              <Button
                variant="outline-success"
                size="sm"
                style={{ position: "relative" }}
              >
                Quét ảnh từ vựng
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChangeAndProcess}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </Button>
            </div>
          </div>

          {/* Khung hiển thị TextArea nhập liệu thô */}
          {showTextAreaInput && (
            <div className="mt-3 p-3 bg-light rounded border">
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold text-secondary">
                  Nhập hoặc dán đoạn văn bản thô của bạn dưới đây:
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Ví dụ: từ mới : định nghĩa; word : definition;"
                  style={{ fontSize: "14px" }}
                />
              </Form.Group>
              <div className="d-flex justify-content-end">
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleImportSource}
                  className="me-2"
                >
                  Import Source
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleImportRawText}
                >
                  Import từ mới
                </Button>
              </div>
            </div>
          )}
        </div>

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
              <Row className="align-items-start">
                {/* CỘT 1: TỪ MỚI (Tự động co giãn theo số dòng) */}
                <Col md={4} className="mb-3 mb-md-0">
                  <Form.Group controlId={`word-${index}`}>
                    <Form.Label className="small text-muted fw-semibold">
                      Từ mới (Term)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      // THUẬT TOÁN CO GIÃN: Đếm số \n trong chữ, ít nhất là 1 dòng, nhiều nhất là 6 dòng để không bị dài quá mức
                      rows={Math.min(
                        Math.max(
                          card.newWord ? card.newWord.split("\n").length : 1,
                          1,
                        ),
                        6,
                      )}
                      value={card.newWord}
                      onChange={(e) =>
                        handleCardChange(index, "newWord", e.target.value)
                      }
                      placeholder="Từ mới..."
                      // Đổi bg-light thành bg-transparent để xóa mảng xám, trả lại đường gạch chân thanh thoát
                      className="border-top-0 border-start-0 border-end-0 rounded-0 border-2 border-dark px-1 bg-transparent"
                      style={{
                        boxShadow: "none",
                        resize: "none",
                        overflowY: "hidden",
                      }}
                    />
                  </Form.Group>
                </Col>

                {/* CỘT 2: ĐỊNH NGHĨA (Cũng tự động co giãn) */}
                <Col md={4} className="mb-3 mb-md-0">
                  <Form.Group controlId={`def-${index}`}>
                    <Form.Label className="small text-muted fw-semibold">
                      Định nghĩa (Definition)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={Math.min(
                        Math.max(
                          card.definition
                            ? card.definition.split("\n").length
                            : 1,
                          1,
                        ),
                        6,
                      )}
                      value={card.definition}
                      onChange={(e) => {
                        handleCardChange(index, "definition", e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Nghĩa của từ..."
                      className="border-top-0 border-start-0 border-end-0 rounded-0 border-2 border-dark px-1 bg-transparent"
                      style={{
                        boxShadow: "none",
                        resize: "none",
                        overflowY: "hidden",
                        minHeight: "38px",
                      }}
                    />
                  </Form.Group>
                </Col>

                {/* CỘT 3: LINK ẢNH (Luôn là 1 dòng) */}
                <Col md={4}>
                  <Form.Group controlId={`img-${index}`}>
                    <Form.Label className="small text-muted fw-semibold">
                      Link ảnh (Image URL)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={card.imageUrl}
                      onChange={(e) =>
                        handleCardChange(index, "imageUrl", e.target.value)
                      }
                      placeholder="https://example.com/anh.jpg"
                      className="border-top-0 border-start-0 border-end-0 rounded-0 border-2 border-dark px-1 bg-transparent"
                      style={{ boxShadow: "none" }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}

        {/* NÚT THÊM THẺ THỦ CÔNG */}
        <Button
          variant="outline-primary"
          onClick={handleAddCard}
          className="w-100 py-3 fw-bold mb-4 bg-white"
          style={{
            borderStyle: "dashed",
            borderWidth: "2px",
            fontSize: "16px",
          }}
        >
          + Add a card
        </Button>

        {/* NÚT SUBMIT */}

        <div className="d-flex justify-content-center gap-2">
          {editingId && (
            <Button variant="outline-secondary" size="lg" onClick={resetForm}>
              Hủy chỉnh sửa
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="px-5 fw-bold"
          >
            {editingId ? "Lưu thay đổi" : "Tạo bộ học phần"}
          </Button>
        </div>
        <div className="mt-4">{error}</div>
      </Form>

      {/* ===== DANH SÁCH BỘ THẺ ĐÃ TẠO ===== */}
      {sets.length > 0 && (
        <>
          <hr className="my-5" />
          <h3 className="mb-4 text-dark fw-bold">
            📚 Các bộ thẻ đã tạo ({sets.length})
          </h3>
          {sets.map((set) => (
            <Card key={set.id} className="mb-3 shadow-sm rounded-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="fw-bold mb-1">{set.title}</h5>
                    {set.description && (
                      <p className="text-muted small mb-1">{set.description}</p>
                    )}
                    <span className="badge bg-secondary">
                      {set.cards?.length || 0} thẻ
                    </span>
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
