const SHEET_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL!;

export interface Flashcard {
  ID: string | number;
  Hanzi: string;
  Pinyin: string;
  Meaning: string;
  Level: string;
  Next_Review_Date: string;
  Interval_Days: number;
}

export interface Dialogue {
  ID: string | number;
  Topic: string;
  Speaker_A: string;
  Speaker_B: string;
  Hanzi: string;
  Pinyin: string;
  Meaning: string;
}

export interface Grammar {
  ID: string | number;
  Title: string;
  Structure: string;
  Explanation: string;
  Examples: string;
}

export async function fetchSheetData<T>(sheetName: string): Promise<T[]> {
  try {
    const response = await fetch(`${SHEET_URL}?sheet=${sheetName}`, {
      method: "GET",
      // Disable cache so we always get the latest data from the sheet
      cache: "no-store",
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error(`Error fetching data for sheet ${sheetName}:`, error);
    return [];
  }
}

export async function updateFlashcardReview(id: string | number, nextReviewDate: string, intervalDays: number): Promise<boolean> {
  try {
    const response = await fetch(SHEET_URL, {
      method: "POST",
      body: JSON.stringify({
        sheet: "Vocab",
        action: "update_review",
        id: id,
        next_review_date: nextReviewDate,
        interval_days: intervalDays
      })
    });
    
    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return false;
  }
}

export async function addSheetRow(sheetName: string, data: any): Promise<boolean> {
  try {
    const response = await fetch(SHEET_URL, {
      method: "POST",
      body: JSON.stringify({
        sheet: sheetName,
        action: "add_row",
        data: data
      })
    });
    
    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error(`Error adding row to ${sheetName}:`, error);
    return false;
  }
}

export async function translateText(text: string): Promise<{ zhCN: string, zhTW: string }> {
  const response = await fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      sheet: "Vocab",
      action: "translate",
      text: text
    })
  });
  
  const textResponse = await response.text();
  let result;
  try {
    result = JSON.parse(textResponse);
  } catch (e) {
    throw new Error("Không thể parse JSON từ server: " + textResponse);
  }

  if (result.success) {
    return { zhCN: result.zhCN, zhTW: result.zhTW };
  }
  
  throw new Error(result.error || "Lỗi không xác định từ server");
}

export async function translateBatchText(texts: string[]): Promise<string[]> {
  const response = await fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      sheet: "Vocab",
      action: "translate_batch",
      texts: texts
    })
  });
  
  const textResponse = await response.text();
  let result;
  try {
    result = JSON.parse(textResponse);
  } catch (e) {
    throw new Error("Không thể parse JSON từ server: " + textResponse);
  }

  if (result.success) {
    return result.results;
  }
  
  throw new Error(result.error || "Lỗi không xác định từ server");
}

export async function addBatchRows(sheetName: string, rows: any[]): Promise<{success: boolean, count: number}> {
  const response = await fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      sheet: sheetName,
      action: "add_rows",
      rows: rows
    })
  });
  
  const textResponse = await response.text();
  let result;
  try {
    result = JSON.parse(textResponse);
  } catch (e) {
    throw new Error("Không thể parse JSON từ server: " + textResponse);
  }

  if (result.success) {
    return { success: true, count: result.count };
  }
  
  throw new Error(result.error || "Lỗi không xác định từ server");
}
