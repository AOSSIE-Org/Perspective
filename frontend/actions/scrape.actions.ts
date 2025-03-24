'use server'

export async function scrapeAndSummarize(requestURL: string,  articleUrl: string) {
  try {
    const response = await fetch(requestURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: articleUrl }),
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

export async function generatePerspective(requestURL: string) {
  try {
    const response = await fetch(requestURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: requestURL }),
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

export async function getRelatedTopics(requestURL: string, summary?: string | undefined) {
  try {
    const response = await fetch(requestURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch related topics");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getRelatedTopics:", error);
    throw error;
  }
}

