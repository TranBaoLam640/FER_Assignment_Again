import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

const API_URL = "http://localhost:3001/sets";
const MAX_PAIRS = 6; 

function MatchGame() {
  const { setId } = useParams();
  const navigate = useNavigate();


  const [setInfo, setSetInfo] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [gamePieces, setGamePieces] = useState([]);
  const [selectedPieces, setSelectedPieces] = useState([]); 
  const [matchedPairIds, setMatchedPairIds] = useState([]); 
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isMismatching, setIsMismatching] = useState(false); 

  useEffect(() => {
    const fetchSetData = async () => {
      try {
        const res = await fetch(`${API_URL}/${setId}`);
        const data = await res.json();
        
        if (data && data.cards && data.cards.length > 0) {
          setSetInfo(data);
          setAllCards(data.cards);
          initializeGame(data.cards);
        } else {
          alert("Bộ thẻ này chưa có dữ liệu!");
          navigate("/");
        }
      } catch (err) {
        console.error("Lỗi gọi API:", err);
      }
    };
    if (setId) fetchSetData();
  }, [setId, navigate]);

  useEffect(() => {
    let interval = null;
    if (isPlaying && !isFinished) {
      interval = setInterval(() => {
        setTime((prev) => prev + 0.1);
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFinished]);

  const initializeGame = (cardsList) => {
    // Bốc ngẫu nhiên tối đa 6 thẻ
    const shuffledCards = [...cardsList].sort(() => 0.5 - Math.random());
    const selectedCards = shuffledCards.slice(0, Math.min(MAX_PAIRS, cardsList.length));

    let pieces = [];
    selectedCards.forEach((card) => {
      const pairId = card.id || card.newWord;
      
      // Mảnh 1: Mặt trước (Từ vựng)
      pieces.push({
        uniqueId: `${pairId}-term`,
        pairId: pairId,
        text: card.newWord,
        type: "term"
      });
      
      // Mảnh 2: Mặt sau (Định nghĩa)
      pieces.push({
        uniqueId: `${pairId}-def`,
        pairId: pairId,
        text: card.definition,
        type: "def"
      });
    });

    // Xáo trộn vị trí 12 mảnh ghép
    pieces.sort(() => 0.5 - Math.random());

    setGamePieces(pieces);
    setSelectedPieces([]);
    setMatchedPairIds([]);
    setTime(0);
    setIsPlaying(true);
    setIsFinished(false);
    setIsMismatching(false);
  };

  const handlePieceClick = (piece) => {
    if (!isPlaying || isMismatching || matchedPairIds.includes(piece.pairId)) return;
    if (selectedPieces.some((p) => p.uniqueId === piece.uniqueId)) return;

    const newSelection = [...selectedPieces, piece];
    setSelectedPieces(newSelection);

    if (newSelection.length === 2) {
      const [first, second] = newSelection;

      if (first.pairId === second.pairId) {
        const newMatched = [...matchedPairIds, first.pairId];
        setMatchedPairIds(newMatched);
        setSelectedPieces([]);

        if (newMatched.length === gamePieces.length / 2) {
          setIsPlaying(false);
          setIsFinished(true);
        }
      } else {
        setIsMismatching(true);
        setTimeout(() => {
          setSelectedPieces([]);
          setIsMismatching(false);
        }, 500);
      }
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column pt-4">
      <Container style={{ maxWidth: "900px" }}>
        {/* HEADER: Tiêu đề và Đồng hồ */}
        <div className="d-flex justify-content-between align-items-end mb-4 px-2">
          <div>
            <h3 className="fw-bold text-dark mb-0">Ghép thẻ</h3>
            <span className="text-muted fw-semibold">{setInfo?.title}</span>
          </div>
          <div className="text-end">
            <h2 className="display-6 fw-bold text-primary mb-0">
              {time.toFixed(1)}s
            </h2>
          </div>
        </div>

        {isFinished ? (
          <Card className="border-0 shadow-sm rounded-4 p-5 text-center mt-5">
            <Card.Body>
              <h1 className="display-1 mb-3">⏱️</h1>
              <h2 className="text-success fw-bold mb-3">Hoàn thành xuất sắc!</h2>
              <p className="fs-5 text-secondary mb-4">
                Bạn đã ghép xong mọi thứ trong <strong>{time.toFixed(1)} giây</strong>.
              </p>
              <div className="d-flex gap-3 justify-content-center">
                <Button 
                  variant="outline-primary" 
                  className="px-4 py-2 fw-bold rounded-pill"
                  onClick={() => initializeGame(allCards)}
                >
                  ↻ Chơi lại
                </Button>
                <Link to="/">
                  <Button variant="primary" className="px-4 py-2 fw-bold rounded-pill shadow-sm">
                    Về trang chủ
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-3 m-0">
            {gamePieces.map((piece) => {
              const isMatched = matchedPairIds.includes(piece.pairId);
              const isSelected = selectedPieces.some((p) => p.uniqueId === piece.uniqueId);
              
              let cardClass = "h-100 border rounded-3 p-3 shadow-sm d-flex align-items-center justify-content-center text-center";
              let cardStyle = {
                cursor: isMatched ? "default" : "pointer",
                minHeight: "120px",
                transition: "all 0.2s ease-in-out",
                visibility: isMatched ? "hidden" : "visible", 
                userSelect: "none"
              };

              if (isSelected) {
                if (isMismatching) {
                  cardClass += " border-danger bg-danger bg-opacity-10 text-danger";
                  cardStyle.borderWidth = "3px";
                } else {
                  cardClass += " border-primary bg-primary bg-opacity-10 text-primary";
                  cardStyle.borderWidth = "3px";
                }
              } else {
                cardClass += " bg-white text-dark hover-shadow";
                cardStyle.borderWidth = "2px";
              }

              return (
                <Col xs={6} md={4} lg={3} key={piece.uniqueId}>
                  <div
                    className={cardClass}
                    style={cardStyle}
                    onClick={() => handlePieceClick(piece)}
                  >
                    <span className="fw-semibold fs-6" style={{ wordBreak: "break-word" }}>
                      {piece.text}
                    </span>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </div>
  );
}

export default MatchGame;