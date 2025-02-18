from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_article_summary():
    response = client.post(
        "/api/v1/article-summary",
        json={"url": "https://example.com/article"}
    )
    assert response.status_code == 200
    assert "summary" in response.json() 