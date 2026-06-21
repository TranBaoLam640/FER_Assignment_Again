import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // Tự lấy ID từ URL thanh địa chỉ
import {
  Card,
  Button,
  ProgressBar,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
// Cấu hình URL cứng trong file để component tự chạy độc lập
const API_URL = "http://localhost:3001/sets";
const CARDS_PER_ROUND = 7;

function TestSession() {
  const navigate = useNavigate();
  const { setId } = useParams(); // Tự động lấy setId từ Router, không phụ thuộc vào cha nữa

  console.log("=== [1] LearningSession RENDER ===");
  console.log("Tìm thấy setId từ URL thanh địa chỉ là:", setId);

  // --- Các State quản lý dữ liệu gốc ---
  const [set, setSet] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [currentBatch, setCurrentBatch] = useState([]);
  const [masteredCardIds, setMasteredCardIds] = useState(new Set());
  const [roundScores, setRoundScores] = useState({});
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [previousCardId, setPreviousCardId] = useState(null);

  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showRoundCongratulation, setShowRoundCongratulation] = useState(false);

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
          initNextBatch(data.cards, new Set(), data.learningType);
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

  useEffect(() => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      alert("Bạn cần đăng nhập để truy cập tính năng này!");
      navigate("/login");
    }
  }, [navigate]);
  const initNextBatch = (cardsList, masteredSet, type) => {
    console.log("=== [3] initNextBatch CALLED ===");
    const unmasteredCards = cardsList.filter(
      (c) => !masteredSet.has(c.id || c.newWord),
    );
    const batch = unmasteredCards.slice(0, CARDS_PER_ROUND);
    console.log(`Bốc ra mẻ mới gồm ${batch.length} từ:`, batch);

    if (batch.length === 0) {
      return;
    }

    setCurrentBatch(batch);

    const initialScores = {};
    batch.forEach((c) => {
      initialScores[c.id || c.newWord] = 0;
    });
    setRoundScores(initialScores);
    setShowRoundCongratulation(false);

    pickNextCardInBatch(batch, initialScores, null, type || set?.learningType);
  };

  const pickNextCardInBatch = (batch, scores, lastCardId, currentType) => {
    console.log("=== [4] pickNextCardInBatch CALLED ===");
    const incompleteCards = batch.filter((c) => scores[c.id || c.newWord] < 1);

    if (incompleteCards.length === 0) {
      handleRoundComplete(batch);
      return;
    }

    let nextCard = null;
    if (incompleteCards.length > 1) {
      const filtered = incompleteCards.filter(
        (c) => (c.id || c.newWord) !== lastCardId,
      );
      nextCard = filtered[Math.floor(Math.random() * filtered.length)];
    } else {
      nextCard = incompleteCards[0];
    }

    setCurrentCard(nextCard);
    setPreviousCardId(nextCard.id || nextCard.newWord);
    generateOptions(nextCard, batch, currentType || set?.learningType);

    setSelectedOption(null);
    setIsCorrect(null);
    setHasAnswered(false);
    setFeedbackMessage("");
  };

  const generateOptions = (card, batch, currentType) => {
    if (currentType === "source") {
      const rawText = card.newWord || "";
      const matchA = rawText.search(/\bA\./);
      if (matchA !== -1) {
        const optionsText = rawText.substring(matchA);

        const parts = optionsText.split(/\s*\b(B\.|C\.|D\.)\s*/);

        let optA = parts[0]?.trim(); // Kết quả: "A. Nội dung vế A"
        let optB = parts[1] && parts[2] ? (parts[1] + parts[2]).trim() : "";
        let optC = parts[3] && parts[4] ? (parts[3] + parts[4]).trim() : "";
        let optD = parts[5] && parts[6] ? (parts[5] + parts[6]).trim() : "";

        if (!optD && parts[4]) optD = parts[4].trim();

        const finalOptions = [optA, optB, optC, optD].filter(Boolean);

        if (finalOptions.length === 4) {
          setOptions(finalOptions);
          return;
        }
      }
    }

    const correctAnswer = card.newWord;
    let distractors = batch
      .map((c) => c.newWord)
      .filter((word) => word !== correctAnswer);

    distractors.sort(() => 0.5 - Math.random());
    const chosenDistractors = distractors.slice(0, 3);

    const finalOptions = [correctAnswer, ...chosenDistractors];
    finalOptions.sort(() => 0.5 - Math.random());
    setOptions(finalOptions);
  };

  const handleOptionClick = (option) => {
    if (hasAnswered) return;

    let isRight = false;
    if (set?.learningType === "source") {
      const selectedLetter = option.trim().charAt(0).toUpperCase(); // "C"
      const correctLetter = currentCard.definition
        .trim()
        .charAt(0)
        .toUpperCase(); // "C"
      isRight = selectedLetter === correctLetter;
    } else {
      isRight = option === currentCard.newWord;
    }

    setSelectedOption(option);
    setIsCorrect(isRight);
    setHasAnswered(true);

    const cardKey = currentCard.id || currentCard.newWord;
    const updatedScores = { ...roundScores };

    if (isRight) {
      setFeedbackMessage("You are great hitting it");
      updatedScores[cardKey] += 1;
      setRoundScores(updatedScores);
    } else {
      setFeedbackMessage("Not quite, you're still learning!");
      updatedScores[cardKey] += 2;
      setRoundScores(updatedScores);
    }
    setTimeout(() => {
      pickNextCardInBatch(currentBatch, updatedScores, cardKey);
    }, 1200);
  };

  const handleDontKnow = () => {
    if (hasAnswered) return;
    handleOptionClick("__DONT_KNOW_TRIGGERED__");
  };

  const handleContinue = () => {
    pickNextCardInBatch(currentBatch, roundScores, previousCardId);
  };

  const handleRoundComplete = async (completedBatch) => {
    setShowRoundCongratulation(true);

    const newMasteredSet = new Set(masteredCardIds);
    completedBatch.forEach((c) => newMasteredSet.add(c.id || c.newWord));
    setMasteredCardIds(newMasteredSet);

    const updatedCards = allCards.map((c) => {
      const cardKey = c.id || c.newWord;

      const isCardInBatch = completedBatch.some(
        (b) => (b.id || b.newWord) === cardKey,
      );

      if (isCardInBatch) {
        if (roundScores[cardKey] === 1) {
          return { ...c, status: "know" };
        } else if (roundScores[cardKey] === 2) {
          return { ...c, status: "not_know" };
        }
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
  const progressPercentage =
    totalCardsCount > 0 ? (totalMasteredCount / totalCardsCount) * 100 : 0;

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <Container
        className="flex-grow-1 d-flex flex-column align-items-center mt-4"
        style={{ maxWidth: "850px" }}
      >
        <h3 className="fw-bold text-center text-dark mb-3">
          Learning Mode: {set?.title || "Đang tải..."}
        </h3>

        {/* 📊 THANH TIẾN ĐỘ PROGRESS BAR CHUẨN UX */}
        <div className="w-100 mb-4 px-2">
          <div className="d-flex justify-content-between text-secondary small fw-semibold mb-1">
            <span>Tiến độ tổng thể:</span>
            <span>
              {totalMasteredCount} / {totalCardsCount} thẻ hoàn thành
            </span>
          </div>
          <ProgressBar
            variant="success"
            now={progressPercentage}
            style={{ height: "10px" }}
            animated
          />
        </div>

        {showRoundCongratulation ? (
          /* 🏆 MÀN HÌNH CHÚC MỪNG MỖI KHI XONG 7 TỪ */
          <Card className="w-100 border-0 shadow rounded-4 p-5 text-center my-auto">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <h1 className="display-4 mb-3">🎉🏆🎉</h1>
              <h2 className="text-success fw-bold mb-2">Congratulate!</h2>
              <p className="fs-4 text-secondary fst-italic">
                "You are a hero."
              </p>
              {totalMasteredCount < totalCardsCount ? (
                <Button
                  variant="primary"
                  className="mt-4 px-5 py-2 fw-bold rounded-pill shadow-sm"
                  onClick={handleNextRoundLoad}
                >
                  Test{" "}
                  {Math.min(
                    CARDS_PER_ROUND,
                    totalCardsCount - totalMasteredCount,
                  )}{" "}
                  câu tiếp theo →
                </Button>
              ) : (
                /* 🏆 MÀN HÌNH TỔNG KẾT FINAL RESULT (Lấy dữ liệu trực tiếp từ allCards) */
                <div className="mt-4 w-100">
                  <h3 className="fw-bold text-dark mb-4">
                    Kết quả bài thi của bạn
                  </h3>

                  <Row className="g-3 justify-content-center mb-4">
                    {/* Cột Điểm phần trăm */}
                    <Col xs={12} md={4}>
                      <div className="p-4 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-25 h-100 d-flex flex-column justify-content-center">
                        <span className="text-primary fw-semibold mb-1">
                          Điểm số
                        </span>
                        <h2 className="display-5 fw-bold text-primary mb-0">
                          {Math.round(
                            (allCards.filter((c) => c.status === "know")
                              .length /
                              totalCardsCount) *
                              100,
                          ) / 10|| 2}
                          
                        </h2>
                      </div>
                    </Col>

                    {/* Cột Đúng / Sai */}
                    <Col xs={12} md={8}>
                      <div className="d-flex flex-column gap-3 h-100">
                        <div className="p-3 bg-success bg-opacity-10 rounded-4 border border-success border-opacity-25 d-flex justify-content-between align-items-center">
                          <span className="text-success fw-bold fs-5">
                            ✓ Số câu đúng
                          </span>
                          <span className="badge bg-success rounded-pill fs-5 px-3">
                            {allCards.filter((c) => c.status === "know").length}
                          </span>
                        </div>

                        <div className="p-3 bg-danger bg-opacity-10 rounded-4 border border-danger border-opacity-25 d-flex justify-content-between align-items-center">
                          <span className="text-danger fw-bold fs-5">
                            ✕ Số câu sai
                          </span>
                          <span className="badge bg-danger rounded-pill fs-5 px-3">
                            {
                              allCards.filter((c) => c.status === "not_know")
                                .length
                            }
                          </span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Các nút hành động */}
                  <div className="d-flex gap-3 justify-content-center mt-2">
                    <Button
                      variant="outline-secondary"
                      className="px-4 py-2 fw-bold rounded-pill"
                      onClick={() => window.location.reload()}
                    >
                      ↻ Thi lại
                    </Button>
                    <Link to="/">
                      <Button
                        variant="primary"
                        className="px-5 py-2 fw-bold rounded-pill shadow-sm"
                      >
                        Hoàn tất & Về trang chủ
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        ) : currentCard ? (
          /* 📇 GIAO DIỆN TRẬN ĐẤU TRẮC NGHIỆM */
          <div className="w-100 d-flex flex-column align-items-center gap-3">
            {/* CARD HIỂN THỊ CÂU HỎI (LẤY THEO DEFINITION NHƯ BẠN YÊU CẦU) */}
            <Card
              className="w-100 border-0 shadow-sm rounded-4 p-4 text-start position-relative"
              style={{ minHeight: "180px" }}
            >
              <span className="text-uppercase text-muted small fw-bold tracking-wider">
                {set?.learningType === "source" ? "Question" : "Definition"}
              </span>
              <Card.Body className="p-0 mt-3">
                <h4
                  className="fw-normal text-dark lh-base"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {/* NẾU LÀ SOURCE: Hiển thị phần câu hỏi gốc (chỉ lấy phần nội dung trước chữ A.) */}
                  {set?.learningType === "source"
                    ? currentCard.newWord.split(/\bA\./)[0]?.trim()
                    : currentCard.definition}
                </h4>
              </Card.Body>
            </Card>

            {/* TINH CHỈNH VỊ TRÍ MESSAGE THÔNG BÁO KHI CLICK ĐÁP ÁN */}
            <div
              className="w-100 text-start px-2 mt-2"
              style={{ minHeight: "30px" }}
            >
              {hasAnswered && (
                <h5
                  className={`fw-bold ${isCorrect ? "text-success" : "text-danger"}`}
                >
                  {feedbackMessage}
                </h5>
              )}
            </div>

            {/* LƯỚI 4 ĐÁP ÁN ĐÚNG PHONG CÁCH 2X2 CỦA QUIZLET */}
            <Row className="g-3 w-100 m-0">
              {options.map((option, index) => {
                let cardClass =
                  "p-3 border rounded-3 text-start bg-white w-100 h-100 d-flex align-items-center position-relative fw-semibold";
                let styleInline = {
                  cursor: "pointer",
                  transition: "all 0.2s",
                  minHeight: "70px",
                };
                let iconSymbol = null;

                // Tìm dòng này bên trong options.map:
                if (hasAnswered) {
                  // ĐỔI ĐOẠN ĐIỀU KIỆN NÀY:
                  const isThisOptionCorrect =
                    set?.learningType === "source"
                      ? option.trim().charAt(0).toUpperCase() ===
                        currentCard.definition.trim().charAt(0).toUpperCase()
                      : option === currentCard.newWord;

                  if (isThisOptionCorrect) {
                    cardClass +=
                      " border-success text-success bg-success bg-opacity-10";
                    styleInline.borderWidth = "2px";
                    styleInline.borderStyle = "dashed";
                    iconSymbol = <span className="me-2 fw-bold fs-5">✓</span>;
                  } else if (selectedOption === option && !isCorrect) {
                    cardClass +=
                      " border-danger text-danger bg-danger bg-opacity-10";
                    styleInline.borderWidth = "2px";
                    iconSymbol = <span className="me-2 fw-bold fs-5">✕</span>;
                  } else {
                    styleInline.opacity = "0.4";
                  }
                } else {
                  cardClass +=
                    " border-light-subtle text-secondary shadow-sm hover-shadow";
                }

                return (
                  <Col key={index} xs={12} md={6}>
                    <div
                      className={cardClass}
                      style={styleInline}
                      onClick={() => handleOptionClick(option)}
                    >
                      <span className="text-muted me-3 bg-light rounded-circle px-2 py-1 small">
                        {index + 1}
                      </span>
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
            </div>
          </div>
        ) : (
          <div className="text-center my-auto p-5 rounded-3 bg-white shadow-sm border-light">
            <div
              className="spinner-border text-primary mb-3"
              role="status"
            ></div>
            <p className="text-muted fs-5 fw-semibold mb-0">
              Đang khởi tạo mẻ dữ liệu học tập...
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}

export default TestSession;
