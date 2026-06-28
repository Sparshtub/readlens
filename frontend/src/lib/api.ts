const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
) {
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    // If Clerk key is placeholder or local testing bypass, we can send a mock token
    headers.set("Authorization", "Bearer mock_user_123");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let detail = "API request failed";
    try {
      const errorData = JSON.parse(errorText);
      detail = errorData.detail || detail;
    } catch {
      detail = errorText || detail;
    }
    throw new Error(detail);
  }

  return response.json();
}

export const api = {
  getDocuments: async (token?: string | null) => {
    return fetchWithAuth("/documents/", {}, token);
  },
  
  uploadDocument: async (formData: FormData, token?: string | null) => {
    return fetchWithAuth("/documents/", {
      method: "POST",
      body: formData,
    }, token);
  },
  
  deleteDocument: async (docId: string, token?: string | null) => {
    return fetchWithAuth(`/documents/${docId}`, {
      method: "DELETE",
    }, token);
  },
  
  getHighlights: async (docId?: string, token?: string | null) => {
    const query = docId ? `?document_id=${docId}` : "";
    return fetchWithAuth(`/highlights/${query}`, {}, token);
  },
  
  createHighlight: async (data: { document_id: string; text: string; page_index: number; selection_coords?: string }, token?: string | null) => {
    return fetchWithAuth("/highlights/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }, token);
  },
  
  deleteHighlight: async (highlightId: string, token?: string | null) => {
    return fetchWithAuth(`/highlights/${highlightId}`, {
      method: "DELETE",
    }, token);
  }
};
