import google.generativeai as genai
from openai import OpenAI
from backend.app.core.config import settings
from typing import Optional

# Initialize APIs if keys are available
if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("pk_test_"):
    genai.configure(api_key=settings.GEMINI_API_KEY)

class LLMService:
    def __init__(self):
        self.gemini_available = bool(settings.GEMINI_API_KEY and "placeholder" not in settings.GEMINI_API_KEY if settings.GEMINI_API_KEY else False)
        self.openai_available = bool(settings.OPENAI_API_KEY and "placeholder" not in settings.OPENAI_API_KEY if settings.OPENAI_API_KEY else False)
        
        if self.openai_available:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
    def generate_explanation_and_translation(self, text: str) -> tuple[str, str]:
        """
        Generate explanation and translation for highlighted text.
        Returns (explanation, translation).
        """
        if not text.strip():
            return "", ""
            
        prompt = (
            f"You are an expert reading assistant. For the following text snippet:\n"
            f"\"\"\"\n{text}\n\"\"\"\n\n"
            f"1. Explain it simply (1-2 sentences max).\n"
            f"2. Translate it to Hindi.\n"
            f"Format your response EXACTLY as:\n"
            f"EXPLANATION: [simple explanation]\n"
            f"TRANSLATION: [hindi translation]"
        )
        
        # Try Gemini API
        if self.gemini_available:
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                return self._parse_explanation_translation_response(response.text, text)
            except Exception as e:
                print(f"Gemini API failed: {e}")
                
        # Try OpenAI API
        if self.openai_available:
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a helpful reading assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=250,
                    temperature=0.3
                )
                content = response.choices[0].message.content or ""
                return self._parse_explanation_translation_response(content, text)
            except Exception as e:
                print(f"OpenAI API failed: {e}")
                
        # Mock Fallback
        mock_explanation = f"This passage discusses: '{text[:60]}...'. It suggests a deeper focus on the core arguments surrounding the document's central ideas."
        mock_translation = f"यह अंश चर्चा करता है: '{text[:40]}...'"
        return mock_explanation, mock_translation

    def chat_with_page(self, question: str, page_content: str, page_index: int, title: str) -> str:
        """
        Contextual chat using page content.
        """
        if not question.strip():
            return "Please enter a question."
            
        prompt = (
            f"You are ReadLens AI, an intelligent reading companion. The user is currently reading the book/document titled \"{title}\".\n"
            f"They are on Page {page_index}.\n"
            f"Here is the text content of Page {page_index}:\n"
            f"\"\"\"\n{page_content}\n\"\"\"\n\n"
            f"User's Question: {question}\n\n"
            f"Answer the user's question directly using the page content. Keep the tone helpful, engaging, and academic. "
            f"If the answer cannot be found in the page context, explain what is on this page and politely state you don't have broader context."
        )
        
        # Try Gemini API
        if self.gemini_available:
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                return response.text.strip()
            except Exception as e:
                print(f"Gemini API failed: {e}")
                
        # Try OpenAI API
        if self.openai_available:
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a helpful reading assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.5
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"OpenAI API failed: {e}")
                
        # Mock Fallback
        return (
            f"[Offline/Dev Mode] You asked about page {page_index} of '{title}': \"{question}\".\n\n"
            f"Based on page content (first 80 chars: \"{page_content[:80]}...\"), the author presents arguments related to this topic. "
            f"Connect your API keys in .env to get full AI explanations!"
        )

    def _parse_explanation_translation_response(self, response_text: str, original_text: str) -> tuple[str, str]:
        explanation = ""
        translation = ""
        
        try:
            lines = response_text.strip().split("\n")
            for line in lines:
                if line.upper().startswith("EXPLANATION:"):
                    explanation = line[len("EXPLANATION:"):].strip()
                elif line.upper().startswith("TRANSLATION:"):
                    translation = line[len("TRANSLATION:"):].strip()
            
            # If parsing failed, return parts
            if not explanation or not translation:
                parts = response_text.split("TRANSLATION:")
                if len(parts) == 2:
                    explanation = parts[0].replace("EXPLANATION:", "").strip()
                    translation = parts[1].strip()
                else:
                    explanation = response_text
                    translation = "अंश का अनुवाद उपलब्ध नहीं है।"
        except Exception:
            explanation = response_text
            translation = "अनुवाद करने में त्रुटि हुई।"
            
        return explanation or original_text, translation

llm_service = LLMService()
