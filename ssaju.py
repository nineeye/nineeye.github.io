import os
from google import genai

class Saju:
    def __init__(self, name, birth_date):
        self.name = name
        self.birth_date = birth_date
        # 최신 라이브러리 초기화 방식
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    def get_fortune(self):
        try:
            prompt = f"{self.name}님의 생년월일은 {self.birth_date}입니다. 오늘 운세를 다정하게 말해주세요."
            # 최신 모델 호출 방식
            response = self.client.models.generate_content(
                model="gemini-2.0-flash", 
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"오류 발생: {str(e)}"
