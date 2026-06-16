import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Button, Card, Stack } from "react-bootstrap";

const API_URL = "http://localhost:3001/sets";

function SetDetail() {
  // Lấy setId từ URL xuống bằng useParams của React Router
  const { setId } = useParams();
  const [set, setSet] = useState({title:"",description:"",cards:[]});
  useEffect(() => {
    fetchSets();
  }, []);
  const fetchSets = async () => {
    try {
      const res = await fetch(`${API_URL}/${setId}`);
      const data = await res.json();
     

      setSet(data);
    } catch (err) {}
  };
  return (
    <Container className="mt-4">
      <div className="mb-4">
        <h2 className="mt-2">{set.title}</h2>
        <p className="text-muted">{set.description}</p>
      </div>

      {/* Nút bấm chuyển sang chế độ Học */}    
      <div className="mb-4">
        <Button
          as={Link}
          to={`/set/${setId}/study`}
          variant="success"
          size="lg"
          className="me-3"
        >
          🎯 Vào chế độ Học Flashcard
        </Button>
      </div>

      <h4>Danh sách từ vựng</h4>
      <Stack gap={2}>
        {set.cards.map((e) => {
         return (
           <Card className="p-3">
            <div className="d-flex justify-content-between">
              <strong>{e.newWord}</strong>
              <span className="text-secondary">{e.definition}</span>
            </div>
          </Card>
         )
        })}
      </Stack>
    </Container>
  );
}

export default SetDetail;
