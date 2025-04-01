import { API_URL } from "./config";

export const fetchWord = async (gameId: string): Promise<string> => {
  const response = await fetch(`${API_URL}/game/${gameId}/word`, {
    method: "GET",
  });
  if (!response.ok) {
    console.error("Failed to fetch word: ", response.statusText);
    throw new Error("Failed to fetch word");
  }
  const data = await response.json();
  console.log("data:", data);
  return data.word;
};
