import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Card, Button, ProgressBar } from "react-bootstrap";

const API_URL = "http://localhost:3001/sets";

// ===== ĐỊNH NGHĨA STYLES HIỆU ỨNG =====
const cardContainerStyle = (isTransitioning) => ({
  perspective: '1000px',
  maxWidth: '500px',
  minHeight: '280px',
  transition: 'opacity 0.15s ease, transform 0.15s ease',
  opacity: isTransitioning ? 0.3 : 1,
  transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
});

const cardInnerStyle = (flipped) => ({
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: "280px",
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
  borderRadius: "12px",
};

const cardBackStyle = {
  ...cardFaceStyle,
  transform: "rotateX(180deg)",
};

function StudySession() {
  const { setId } = useParams();
  const [set, setSet] = useState({ title: "", description: "", cards: [] });
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const res = await fetch(`${API_URL}/${setId}`);
      const data = await res.json();
      setSet(data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    }
  };

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
    <Container className="mt-4 text-center" style={{ maxWidth: '600px' }}>
      
      <h3 className="mb-4 text-dark fw-bold">Chế độ học bộ thẻ: {set.title || "Đang tải..."}</h3>

      {set.cards && set.cards.length > 0 ? (
        <div className="w-100">
          
          {/* 1. THANH TIẾN ĐỘ DUY NHẤT */}
          <div className="mb-4 mx-auto" style={{ maxWidth: "500px" }}>
            <ProgressBar 
              animated 
              variant="success" 
              now={currentCardIndex === set.cards.length ? 100 : ((currentCardIndex + 1) / set.cards.length) * 100} 
              style={{ height: '8px', borderRadius: '4px' }} 
            />
            <div className="d-flex justify-content-between mt-2 small text-muted fw-semibold">
              <span>{currentCardIndex === set.cards.length ? "🎉 Hoàn thành!" : "⏳ Đang tiến trình..."}</span>
              <span>
                {currentCardIndex === set.cards.length ? set.cards.length : currentCardIndex + 1} / {set.cards.length} thẻ
              </span>
            </div>
          </div>

          {/* 2. KHU VỰC HIỂN THỊ CARD (Căn giữa và có khoảng cách đẹp) */}
          <div className="my-5"> 
            {currentCardIndex === set.cards.length ? (
              
              // 🏆 TRƯỜNG HỢP: SLIDE CUỐI CHÚC MỪNG
              <Card className="p-5 mx-auto border-0 shadow text-center" 
                    style={{ maxWidth: '500px', minHeight: '280px', borderRadius: '12px', background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)' }}>
                <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                  <h1 className="display-4 mb-3">🎉🏆🎉</h1>
                  <h2 className="text-success fw-bold mb-2">Congratulate!</h2>
                  <p className="fs-4 text-secondary style-italic">"You are a hero."</p>
                </Card.Body>
              </Card>

            ) : (

              // 📇 TRƯỜNG HỢP: HỌC TỪ VỰNG BÌNH THƯỜNG
              <div className="mx-auto" style={cardContainerStyle(isTransitioning)}>
                <div style={cardInnerStyle(isFlipped)} onClick={() => !isTransitioning && setIsFlipped(!isFlipped)}>
                  
                  {/* MẶT TRƯỚC */}
                  <Card className="shadow-sm border-2 h-100 w-100" style={cardFaceStyle}>
                    <small className="text-muted mb-3 fw-semibold">THUẬT NGỮ</small>
                    <h2 className="text-dark fw-bold">{set.cards[currentCardIndex].newWord}</h2>
                    <small className="text-primary mt-4 position-absolute bottom-0 mb-3 small">💡 Click để xem định nghĩa</small>
                  </Card>

                  {/* MẶT SAU */}
                  <Card className="shadow-sm border-2 bg-light border-primary h-100 w-100" style={cardBackStyle}>
                    <small className="text-primary mb-3 fw-semibold">ĐỊNH NGHĨA</small>
                    <p className="fs-4 text-secondary px-3">{set.cards[currentCardIndex].definition}</p>
                    <small className="text-muted mt-4 position-absolute bottom-0 mb-3 small">💡 Click để quay lại thuật ngữ</small>
                  </Card>

                </div>
              </div>
            )}
          </div>

          {/* 3. CỤM NÚT BẤM ĐIỀU HƯỚNG DUY NHẤT */}
          <div className="d-flex justify-content-center gap-3 mt-4">
            {currentCardIndex === set.cards.length ? (
              
              // 🔄 Giao diện nút ở slide cuối
              <>
                <Button 
                  variant="outline-dark" 
                  onClick={() => setCurrentCardIndex(set.cards.length - 1)}
                >
                  ← Back to last card
                </Button>
                <Link to="/">
                  <Button variant="success" className="px-4 fw-bold">
                    🏠 Homepage
                  </Button>
                </Link>
              </>

            ) : (

              // 🔘 Giao diện nút lúc đang học bình thường
              <>
                <Button 
                  variant="outline-secondary" 
                  onClick={handlePrev} 
                  disabled={currentCardIndex === 0}
                >
                  ← Prev
                </Button>
                <Button 
                  variant="primary" 
                  className="px-4" 
                  onClick={handleNext}
                >
                  {currentCardIndex === set.cards.length - 1 ? "Hoàn thành →" : "Next →"}
                </Button>
              </>
            )}
          </div>

        </div>
      ) : (
        <div className="my-5 text-muted">Đang tải danh sách thẻ từ vựng...</div>
      )}

    </Container>
  );
}

export default StudySession;