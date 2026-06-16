import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

// Dữ liệu fake tạm thời để hiển thị giao diện

const API_URL = "http://localhost:3001/sets";

function Home() { 
  const [sets, setSets] = useState([]);                         
  useEffect(() => {
    fetchSets();
  }, []);
  const fetchSets = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setSets(data);
    } catch (err) {
    }
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Bộ thẻ học tập của bạn</h2>
        <Button as={Link} to="/create" variant="primary">
          Tạo bộ thẻ mới
        </Button>
      </div>
      <Row>
        {sets.map((set) => (
          <Col md={4} key={set.id} className="mb-3">
            <Card>
              <Card.Body>
                <Card.Title>{set.title}</Card.Title>
                <Card.Text className="text-muted">
                  {set.cards.length} thuật ngữ
                </Card.Text>
                <Button
                  as={Link}
                  to={`/set/${set.id}`}
                  variant="outline-primary"
                >
                  Xem chi tiết
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Home;
