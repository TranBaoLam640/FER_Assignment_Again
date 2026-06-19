import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // Tự lấy ID từ URL thanh địa chỉ
import { Card, Button, ProgressBar, Container, Row, Col } from "react-bootstrap";

// Cấu hình URL cứng trong file để component tự chạy độc lập
const API_URL = "http://localhost:3001/sets";
const CARDS_PER_ROUND = 7;

export default function LearningSession() {
  const { setId } = useParams(); // Tự động lấy setId từ Router, không phụ thuộc vào cha nữa

  console.log("=== [1] LearningSession RENDER ===");
  console.log("Tìm thấy setId từ URL thanh địa chỉ là:", setId);

  // --- Các State quản lý dữ liệu gốc ---
  const [set, setSet] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [currentBatch, setCurrentBatch] = useState([]);
  const [masteredCardIds, setMasteredCardIds] = useState(new Set());
  const [roundScores, setRoundScores] = useState({}); 

  // --- Các State quản lý chiếc Card hiện tại ---
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [previousCardId, setPreviousCardId] = useState(null);

  // --- Các State quản lý Tương tác & Phản hồi ---
  const [selectedOption, setSelectedOption] = useState(null); 
  const [isCorrect, setIsCorrect] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showRoundCongratulation, setShowRoundCongratulation] = useState(false);

  // TỰ ĐỘNG GỌI API LẤY DỮ LIỆU (Giống file cũ của bạn, sửa triệt để lỗi undefined)
  useEffect(() => {
    console.log("=== [2] useEffect FETCH DATA RUNNING ===");
    const fetchSetData = async () => {
      try {
        const res = await fetch(`${API_URL}/${setId}`);
        const data = await res.json();
        console.log("Tải dữ liệu bộ thẻ từ API thành công:", data);
        
        if (data && data.cards && data.cards.length > 0) {
          setSet(data);
          setAllCards(data.cards);
          // Khởi tạo mẻ 7 từ đầu tiên
          initNextBatch(data.cards, new Set());
        } else {
          console.warn("Dữ liệu mảng cards trống hoặc không hợp lệ.");
        }
      } catch (err) {
        console.error("Lỗi gọi API lấy bộ thẻ:", err);
      }
    };

    if (setId) {
      fetchSetData();
    }
  }, [setId]);

  // Hàm bốc mẻ 7 từ tiếp theo chưa "tốt nghiệp"
  const initNextBatch = (cardsList, masteredSet) => {
    console.log("=== [3] initNextBatch CALLED ===");
    const unmasteredCards = cardsList.filter(c => !masteredSet.has(c.id || c.newWord));
    const batch = unmasteredCards.slice(0, CARDS_PER_ROUND);
    console.log(`Bốc ra mẻ mới gồm ${batch.length} từ:`, batch);
    
    if (batch.length === 0) {
      return;
    }

    setCurrentBatch(batch);
    
    const initialScores = {};
    batch.forEach(c => {
      initialScores[c.id || c.newWord] = 0;
    });
    setRoundScores(initialScores);
    setShowRoundCongratulation(false);
    
    pickNextCardInBatch(batch, initialScores, null);
  };

  // Hàm chọn thẻ phát sóng (Đảm bảo anti-consecutive - không trùng liên tiếp)
  const pickNextCardInBatch = (batch, scores, lastCardId) => {
    console.log("=== [4] pickNextCardInBatch CALLED ===");
    const incompleteCards = batch.filter(c => scores[c.id || c.newWord] < 2);

    if (incompleteCards.length === 0) {
      handleRoundComplete(batch);
      return;
    }

    let nextCard = null;
    if (incompleteCards.length > 1) {
      const filtered = incompleteCards.filter(c => (c.id || c.newWord) !== lastCardId);
      nextCard = filtered[Math.floor(Math.random() * filtered.length)];
    } else {
      nextCard = incompleteCards[0];
    }

    setCurrentCard(nextCard);
    setPreviousCardId(nextCard.id || nextCard.newWord);
    generateOptions(nextCard, batch);
    
    setSelectedOption(null);
    setIsCorrect(null);
    setHasAnswered(false);
    setFeedbackMessage("");
  };

  // Hàm trộn ngẫu nhiên tạo 4 đáp án dạng lưới 2x2
  const generateOptions = (card, batch) => {
    const correctAnswer = card.newWord;
    let distractors = batch
      .map(c => c.newWord)
      .filter(word => word !== correctAnswer);
    
    distractors.sort(() => 0.5 - Math.random());
    const chosenDistractors = distractors.slice(0, 3);
    
    const finalOptions = [correctAnswer, ...chosenDistractors];
    finalOptions.sort(() => 0.5 - Math.random());
    setOptions(finalOptions);
  };

  // Click chọn đáp án
  const handleOptionClick = (option) => {
    if (hasAnswered) return;

    const isRight = option === currentCard.newWord;
    setSelectedOption(option);
    setIsCorrect(isRight);
    setHasAnswered(true);

    const cardKey = currentCard.id || currentCard.newWord;
    const updatedScores = { ...roundScores };

    if (isRight) {
      setFeedbackMessage("You are great hitting it");
      updatedScores[cardKey] += 1;
      setRoundScores(updatedScores);

      setTimeout(() => {
        pickNextCardInBatch(currentBatch, updatedScores, cardKey);
      }, 1200);
    } else {
      setFeedbackMessage("Not quite, you're still learning!");
      updatedScores[cardKey] = 0; // Trả lời sai reset điểm từ này về 0 để hỏi lại
      setRoundScores(updatedScores);
    }
  };

  const handleDontKnow = () => {
    if (hasAnswered) return;
    handleOptionClick("__DONT_KNOW_TRIGGERED__");
  };

  const handleContinue = () => {
    pickNextCardInBatch(currentBatch, roundScores, previousCardId);
  };

  // Hoàn thành xong mẻ 7 từ, đồng bộ API cập nhật PATCH xuống db.json
  const handleRoundComplete = async (completedBatch) => {
    setShowRoundCongratulation(true);

    const newMasteredSet = new Set(masteredCardIds);
    completedBatch.forEach(c => newMasteredSet.add(c.id || c.newWord));
    setMasteredCardIds(newMasteredSet);

    const updatedCards = allCards.map(c => {
      if (completedBatch.some(b => (b.id || b.newWord) === (c.id || c.newWord))) {
        return { ...c, status: "know" };
      }
      return c;
    });

    setAllCards(updatedCards);

    try {
      await fetch(`${API_URL}/${setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: updatedCards }),
      });
    } catch (err) {
      console.error("Lỗi lưu DB ngầm:", err);
    }
  };

  const handleNextRoundLoad = () => {
    initNextBatch(allCards, masteredCardIds);
  };

  const totalCardsCount = allCards.length;
  const totalMasteredCount = masteredCardIds.size;
  const progressPercentage = totalCardsCount > 0 ? (totalMasteredCount / totalCardsCount) * 100 : 0;

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* 🖤 BANNER HEADER MÀU ĐEN Ở TRÊN CÙNG */}
      <div className="bg-dark text-white p-3 d-flex justify-content-between align-items-center shadow">
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="btn btn-outline-light btn-sm">← Back</Link>
          <span className="fw-bold fs-5 ms-2">🧠 Quizlet Clone</span>
        </div>
        <span className="badge bg-secondary">Learning Mode</span>
      </div>

      <Container className="flex-grow-1 d-flex flex-column align-items-center mt-4" style={{ maxWidth: "850px" }}>
        <h3 className="fw-bold text-center text-dark mb-3">
          Learning Mode: {set?.title || "Đang tải..."}
        </h3>

        {/* 📊 THANH TIẾN ĐỘ PROGRESS BAR CHUẨN UX */}
        <div className="w-100 mb-4 px-2">
          <div className="d-flex justify-content-between text-secondary small fw-semibold mb-1">
            <span>Tiến độ tổng thể:</span>
            <span>{totalMasteredCount} / {totalCardsCount} thẻ hoàn thành</span>
          </div>
          <ProgressBar variant="success" now={progressPercentage} style={{ height: "10px" }} animated />
        </div>

        {showRoundCongratulation ? (
          /* 🏆 MÀN HÌNH CHÚC MỪNG MỖI KHI XONG 7 TỪ */
          <Card className="w-100 border-0 shadow rounded-4 p-5 text-center my-auto">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <h1 className="display-4 mb-3">🎉🏆🎉</h1>
              <h2 className="text-success fw-bold mb-2">Congratulate!</h2>
              <p className="fs-4 text-secondary fst-italic">"You are a hero."</p>
              {totalMasteredCount < totalCardsCount ? (
                <Button variant="primary" className="mt-4 px-5 py-2 fw-bold rounded-pill" onClick={handleNextRoundLoad}>
                  Học tiếp 7 từ mới →
                </Button>
              ) : (
                <Link to="/">
                  <Button variant="success" className="mt-4 px-5 py-2 fw-bold rounded-pill">
                    Quay về trang chủ 🥳
                  </Button>
                </Link>
              )}
            </Card.Body>
          </Card>
        ) : currentCard ? (
          /* 📇 GIAO DIỆN TRẬN ĐẤU TRẮC NGHIỆM */
          <div className="w-100 d-flex flex-column align-items-center gap-3">
            
            {/* CARD HIỂN THỊ CÂU HỎI (LẤY THEO DEFINITION NHƯ BẠN YÊU CẦU) */}
            <Card className="w-100 border-0 shadow-sm rounded-4 p-4 text-start position-relative" style={{ minHeight: "180px" }}>
              <span className="text-uppercase text-muted small fw-bold tracking-wider">Definition</span>
              <Card.Body className="p-0 mt-3">
                <h4 className="fw-normal text-dark lh-base">{currentCard.definition}</h4>
              </Card.Body>
            </Card>

            {/* TINH CHỈNH VỊ TRÍ MESSAGE THÔNG BÁO KHI CLICK ĐÁP ÁN */}
            <div className="w-100 text-start px-2 mt-2" style={{ minHeight: "30px" }}>
              {hasAnswered && (
                <h5 className={`fw-bold ${isCorrect ? "text-success" : "text-danger"}`}>
                  {feedbackMessage}
                </h5>
              )}
            </div>

            {/* LƯỚI 4 ĐÁP ÁN ĐÚNG PHONG CÁCH 2X2 CỦA QUIZLET */}
            <Row className="g-3 w-100 m-0">
              {options.map((option, index) => {
                let cardClass = "p-3 border rounded-3 text-start bg-white w-100 h-100 d-flex align-items-center position-relative fw-semibold";
                let styleInline = { cursor: "pointer", transition: "all 0.2s", minHeight: "70px" };
                let iconSymbol = null;

                if (hasAnswered) {
                  if (option === currentCard.newWord) {
                    cardClass += " border-success text-success bg-success bg-opacity-10";
                    styleInline.borderWidth = "2px";
                    styleInline.borderStyle = "dashed"; // Viền đứt nét dạng dashed chuẩn ảnh mẫu
                    iconSymbol = <span className="me-2 fw-bold fs-5">✓</span>;
                  } else if (selectedOption === option && !isCorrect) {
                    cardClass += " border-danger text-danger bg-danger bg-opacity-10";
                    styleInline.borderWidth = "2px";
                    iconSymbol = <span className="me-2 fw-bold fs-5">✕</span>;
                  } else {
                    styleInline.opacity = "0.4"; // Làm mờ các đáp án không được chọn
                  }
                } else {
                  cardClass += " border-light-subtle text-secondary shadow-sm hover-shadow";
                }

                return (
                  <Col key={index} xs={12} md={6}>
                    <div className={cardClass} style={styleInline} onClick={() => handleOptionClick(option)}>
                      <span className="text-muted me-3 bg-light rounded-circle px-2 py-1 small">{index + 1}</span>
                      {iconSymbol}
                      <span>{option}</span>
                    </div>
                  </Col>
                );
              })}
            </Row>

            {/* NÚT BẤM DƯỚI ĐÁY: DONT KNOW / CONTINUE */}
            <div className="w-100 d-flex justify-content-between align-items-center mt-4 px-2">
              <div>
                {!hasAnswered && (
                  <Button   
                    variant="link" 
                    className="text-decoration-none text-muted fw-semibold p-0 border-0 bg-transparent" 
                    style={{ opacity: 0.6 }} // Làm mờ hoàn toàn viền ngoài
                    onClick={handleDontKnow}
                  >
                    Don't know
                  </Button>
                )}
              </div>
              <div>
                {hasAnswered && !isCorrect && (
                  <Button variant="primary" className="px-5 py-2 fw-bold rounded-pill shadow" onClick={handleContinue}>
                    Continue
                  </Button>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center my-auto p-5 rounded-3 bg-white shadow-sm border-light">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p className="text-muted fs-5 fw-semibold mb-0">Đang khởi tạo mẻ dữ liệu học tập...</p>
          </div>
        )}
      </Container>
    </div>
  );
}