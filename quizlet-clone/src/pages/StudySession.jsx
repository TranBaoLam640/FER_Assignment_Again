import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';

function StudySession() {
  const { setId } = useParams();

  return (
    <Container className="mt-4 text-center">
      <div className="text-start mb-3">
        <Link to={`/set/${setId}`} className="text-decoration-none">← Thoát chế độ học</Link>
      </div>
      
      <h3>Chế độ học bộ thẻ: {setId}</h3>
      
      {/* Khung Flashcard thô */}
      <Card className="my-5 p-5 mx-auto" style={{ maxWidth: '500px', minHeight: '250px', cursor: 'pointer' }}>
        <Card.Body className="d-flex align-items-center justify-content-center">
          <h4>[Mặt trước: Click để lật - Tính năng này sẽ code ở Giai đoạn 3]</h4>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-center gap-3">
        <Button variant="secondary">Trở về</Button>
        <Button variant="primary">Tiếp theo</Button>
      </div>
    </Container>
  );
}

export default StudySession;