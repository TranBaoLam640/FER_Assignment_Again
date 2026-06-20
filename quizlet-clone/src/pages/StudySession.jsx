import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Card, Button, ProgressBar, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
const API_URL = "http://localhost:3001/sets";

// ===== ĐỊNH NGHĨA STYLES HIỆU ỨNG MỚI (Hiện đại & Mềm mại hơn) =====
const cardContainerStyle = (isTransitioning) => ({
  perspective: "1000px",
  maxWidth: "600px", // Mở rộng khung thẻ ra một chút cho thoáng
  minHeight: "400px", // Ép chiều cao tối thiểu để thẻ trông bề thế
  transition: "opacity 0.15s ease, transform 0.15s ease",
  opacity: isTransitioning ? 0.3 : 1,
  transform: isTransitioning ? "scale(0.95)" : "scale(1)",
  margin: "0 auto",
});

const cardInnerStyle = (flipped) => ({
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: "400px",
  textAlign: "center",
  transition: "transform 0.4s ease",
  transformStyle: "preserve-3d",
  transform: flipped ? "rotateX(180deg)" : "rotateX(0deg)",
  cursor: "pointer",
});

const cardFaceStyle = {
  position: "absolute",
  width: "100%",
  height: "100%",
  backfaceVisibility: "hidden",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  borderRadius: "1.5rem", // Bo góc to và tròn hơn
  backgroundColor: "#ffffff", // Nền trắng tinh
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)", // Bóng đổ 3D siêu mềm mại
  border: "none", // Xóa viền cứng nhắc
};

const cardBackStyle = {
  ...cardFaceStyle,
  transform: "rotateX(180deg)",
  backgroundColor: "#f8f9fa", // Mặt sau cho hơi xám nhẹ để dễ phân biệt
};

function StudySession() {
  const navigate = useNavigate();
  const { setId } = useParams();
  const [set, setSet] = useState({ title: "", description: "", cards: [] });
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTrackProgress, setIsTrackProgress] = useState(false);

  useEffect(() => {
    fetchSets();

    const savedIndex = localStorage.getItem(`progress_${setId}`);
    if (savedIndex !== null) {
      setCurrentCardIndex(Number(savedIndex));
    }
  }, [setId]);
  useEffect(() => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      alert("Bạn cần đăng nhập để truy cập tính năng này!");
      navigate("/login");
    }
  }, [navigate]);
  useEffect(() => {
    if (set.cards && set.cards.length > 0) {
      localStorage.setItem(`progress_${setId}`, currentCardIndex);
    }
  }, [currentCardIndex, setId, set.cards]);

  const fetchSets = async () => {
    try {
      const res = await fetch(`${API_URL}/${setId}`);
      const data = await res.json();
      setSet(data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    }
  };
  const updateCardStatus = async (statusValue) => {
    // 1. Tạo bản sao mảng cards hiện tại
    const updatedCards = [...set.cards];

    // 2. Gắn cờ trạng thái mới cho thẻ
    updatedCards[currentCardIndex].status = statusValue;

    // 3. Cập nhật State giao diện để lật thẻ ngay lập tức
    setSet({ ...set, cards: updatedCards });
    handleNext();

    // 4. Bắn API PATCH cập nhật ngầm xuống db.json
    try {
      await fetch(`${API_URL}/${setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: updatedCards }),
      });
    } catch (err) {
      console.error("Lỗi cập nhật Database:", err);
    }
  };

  const handleKnow = () => updateCardStatus("know");
  const handleNotKnow = () => updateCardStatus("not_know");

  const handleNext = () => {
    if (set.cards && currentCardIndex < set.cards.length) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleSpeak = (textToSpeak) => {
    if (!("speechSynthesis" in window)) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng phát âm.");
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex - 1);
        setIsFlipped(false);
        setIsTransitioning(false);
      }, 150);
    }
  };

  return (
    // Thêm style nền xám nhạt cho toàn bộ Container để thẻ trắng nổi bật lên
    <div
      style={{
        backgroundColor: "#f6f7fb",
        minHeight: "100vh",
        paddingBottom: "3rem",
      }}
    >
      <Container className="pt-5 text-center" style={{ maxWidth: "700px" }}>
        <h3 className="mb-4 text-dark fw-bold">{set.title || "Đang tải..."}</h3>

        {set.cards && set.cards.length > 0 ? (
          <div className="w-100">
            {/* 1. KHU VỰC TIẾN ĐỘ & NÚT GẠT (Gộp chung thành 1 cụm cho gọn gàng) */}
            <div className="mb-5 mx-auto" style={{ maxWidth: "600px" }}>
              <ProgressBar
                animated
                variant="success"
                now={
                  currentCardIndex === set.cards.length
                    ? 100
                    : ((currentCardIndex + 1) / set.cards.length) * 100
                }
                style={{ height: "10px", borderRadius: "5px" }} // Thanh chạy dày hơn xíu
              />
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted fw-semibold small">
                  {currentCardIndex === set.cards.length
                    ? "Hoàn thành!"
                    : "Đang tiến trình..."}
                  <span className="ms-2 fw-bold text-dark">
                    {currentCardIndex === set.cards.length
                      ? set.cards.length
                      : currentCardIndex + 1}{" "}
                    / {set.cards.length} thẻ
                  </span>
                </span>

                <Form.Check
                  type="switch"
                  id="track-progress-switch"
                  label="Track Progress"
                  className="fw-bold text-primary m-0"
                  checked={isTrackProgress}
                  onChange={(e) => setIsTrackProgress(e.target.checked)}
                />
              </div>
            </div>

            {/* 2. KHU VỰC HIỂN THỊ CARD */}
            <div className="mb-5">
              {currentCardIndex === set.cards.length ? (
                // 🏆 TRƯỜNG HỢP: SLIDE CUỐI CHÚC MỪNG
                <Card
                  className="p-5 mx-auto border-0 text-center"
                  style={{
                    maxWidth: "600px",
                    minHeight: "400px",
                    borderRadius: "1.5rem",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    background:
                      "linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)",
                  }}
                >
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                    <h1 className="display-4 mb-3">🎉🏆🎉</h1>
                    <h2 className="text-success fw-bold mb-2">Congratulate!</h2>
                    <p className="fs-4 text-secondary fst-italic">
                      "You are a hero."
                    </p>

                    {/* Bảng thống kê lấy dữ liệu THẬT từ Database */}
                    <div className="mt-4 p-3 bg-white rounded shadow-sm text-start w-100 border-0">
                      <h5 className="fw-bold border-bottom pb-2 mb-3">
                        Kết quả học tập:
                      </h5>

                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-secondary fw-semibold">
                          ⚪ Not learn (Chưa học/Bỏ qua):
                        </span>
                        <span className="fw-bold text-secondary">
                          {/* Đếm những thẻ không có status, hoặc status khác know/not_know */}
                          {
                            set.cards.filter(
                              (c) =>
                                c.status !== "know" && c.status !== "not_know",
                            ).length
                          }
                        </span>
                      </div>

                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-success fw-semibold">
                          ✅ Know (Đã thuộc):
                        </span>
                        <span className="fw-bold text-success">
                          {/* Đếm những thẻ có chữ know */}
                          {set.cards.filter((c) => c.status === "know").length}
                        </span>
                      </div>

                      <div className="d-flex justify-content-between">
                        <span className="text-danger fw-semibold">
                          ❌ Not know (Chưa thuộc):
                        </span>
                        <span className="fw-bold text-danger">
                          {/* Đếm những thẻ có chữ not_know */}
                          {
                            set.cards.filter((c) => c.status === "not_know")
                              .length
                          }
                        </span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ) : (
                // 📇 TRƯỜNG HỢP: HỌC TỪ VỰNG BÌNH THƯỜNG
                <div style={cardContainerStyle(isTransitioning)}>
                  <div
                    style={{
                      ...cardInnerStyle(isFlipped),
                      display:
                        set?.learningType === "source" ? "grid" : undefined,
                      height: set?.learningType === "source" ? "auto" : "100%",
                    }}
                    onClick={() => !isTransitioning && setIsFlipped(!isFlipped)}
                  >
                    {/* MẶT TRƯỚC */}
                    <Card
                      style={{
                        ...cardFaceStyle,
                        height:
                          set?.learningType === "source" ? "auto" : "100%",
                        position:
                          set?.learningType === "source"
                            ? "relative"
                            : "absolute",
                        gridArea:
                          set?.learningType === "source"
                            ? "1 / 1 / 2 / 2"
                            : undefined,
                        paddingBottom:
                          set?.learningType === "source" ? "4rem" : "2rem",
                        opacity: isFlipped ? 0 : 1,
                        visibility: isFlipped ? "hidden" : "visible",
                        transition:
                          "transform 0.4s ease, opacity 0.2s ease, visibility 0.2s ease",
                      }}
                    >
                      <small className="text-muted mb-4 fw-bold tracking-wide">
                        {set?.learningType === "source"
                          ? "SOURCE CÂU HỎI"
                          : "THUẬT NGỮ"}
                      </small>
                      <h1
                        className={
                          set?.learningType === "source"
                            ? "text-dark w-100 px-3"
                            : "text-dark fw-bold display-5"
                        }
                        style={{
                          whiteSpace: "pre-line",
                          fontSize:
                            set?.learningType === "source"
                              ? "1.1rem"
                              : undefined,
                          fontWeight:
                            set?.learningType === "source"
                              ? "normal"
                              : undefined,
                          textAlign:
                            set?.learningType === "source" ? "left" : undefined,
                          lineHeight:
                            set?.learningType === "source" ? "1.6" : undefined,
                        }}
                      >
                        {set.cards[currentCardIndex].newWord}
                      </h1>

                      {/* 🔊 NÚT BẤM PHÁT ÂM THANH (Đã làm trong suốt, bỏ viền) */}
                      {set?.learningType !== "source" && (
                        <Button
                          variant="link"
                          className="position-absolute top-0 end-0 m-3 p-2 text-decoration-none text-secondary"
                          style={{
                            fontSize: "1.5rem",
                            outline: "none",
                            boxShadow: "none",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeak(set.cards[currentCardIndex].newWord);
                          }}
                          title="Phát âm"
                        >
                          🔊
                        </Button>
                      )}
                      <small className="text-primary position-absolute bottom-0 mb-4 fw-semibold">
                        💡 Click để xem định nghĩa
                      </small>
                    </Card>

                    {/* MẶT SAU */}
                    <Card style={cardBackStyle}>
                      <small className="text-primary mb-4 fw-bold tracking-wide">
                        ĐỊNH NGHĨA
                      </small>
                      <p className="fs-3 text-secondary px-4 lh-base">
                        {set.cards[currentCardIndex].definition}
                      </p>

                      {/* 🔊 NÚT BẤM PHÁT ÂM THANH MẶT SAU */}
                      <Button
                        variant="link"
                        className="position-absolute top-0 end-0 m-3 p-2 text-decoration-none text-secondary"
                        style={{
                          fontSize: "1.5rem",
                          outline: "none",
                          boxShadow: "none",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeak(set.cards[currentCardIndex].newWord);
                        }}
                        title="Phát âm"
                      >
                        🔊
                      </Button>
                      <small className="text-muted position-absolute bottom-0 mb-4 fw-semibold">
                        💡 Click để quay lại thuật ngữ
                      </small>
                    </Card>
                  </div>
                </div>
              )}
            </div>

            {/* 3. CỤM NÚT BẤM ĐIỀU HƯỚNG (Thêm class rounded-pill để bo tròn như viên thuốc) */}
            <div className="d-flex justify-content-center gap-3">
              {currentCardIndex === set.cards.length ? (
                // 🔄 Giao diện nút ở slide cuối
                <>
                  <Button
                    variant="outline-dark"
                    className="px-4 py-2 rounded-pill fw-bold"
                    onClick={() => setCurrentCardIndex(set.cards.length - 1)}
                  >
                    ← Back to last card
                  </Button>
                  <Link to="/">
                    <Button
                      variant="success"
                      className="px-5 py-2 rounded-pill fw-bold shadow-sm"
                    >
                      🏠 Homepage
                    </Button>
                  </Link>
                  <Button
                    variant="outline-dark"
                    className="px-4 py-2 rounded-pill fw-bold"
                    onClick={() => setCurrentCardIndex(0)}
                  >
                    Return to first card →
                  </Button>
                </>
              ) : isTrackProgress ? (
                // 💡 ĐANG BẬT TRACK PROGRESS: Hiển thị X và V
                <>
                  <Button
                    variant="danger"
                    className="px-5 py-2 rounded-pill fw-bold fs-5 shadow-sm"
                    onClick={handleNotKnow}
                  >
                    ❌ Not Know
                  </Button>
                  <Button
                    variant="success"
                    className="px-5 py-2 rounded-pill fw-bold fs-5 shadow-sm"
                    onClick={handleKnow}
                  >
                    ✅ Know
                  </Button>
                </>
              ) : (
                // 🔘 NÚT PREV/NEXT BÌNH THƯỜNG
                <>
                  <Button
                    variant="outline-secondary"
                    className="px-4 py-2 rounded-pill fw-bold"
                    onClick={handlePrev}
                    disabled={currentCardIndex === 0}
                  >
                    ← Prev
                  </Button>
                  <Button
                    variant="primary"
                    className="px-5 py-2 rounded-pill fw-bold shadow-sm"
                    onClick={handleNext}
                  >
                    {currentCardIndex === set.cards.length - 1
                      ? "Hoàn thành →"
                      : "Next →"}
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="my-5 text-muted fs-5">
            Đang tải danh sách thẻ từ vựng...
          </div>
        )}
      </Container>
    </div>
  );
}

export default StudySession;
