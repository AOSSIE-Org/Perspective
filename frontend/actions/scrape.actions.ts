'use server'

export async function scrapeAndSummarize(requestURL: string) {
  try {
    const response = await fetch("http://localhost:8000/scrape-and-summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: requestURL }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error calling backend:", error);
    throw error;
  }
}

export async function generatePerspective(summaryText: string) {
  try {
    const response = await fetch("http://localhost:8000/generate-perspective", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: summaryText }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("Error calling FastAPI /generate-perspective:", error);
    throw error;
  }
}

