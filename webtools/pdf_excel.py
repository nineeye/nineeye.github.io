import streamlit as st
import pdfplumber
import pandas as pd
import io
import re

# 🔑 유니코드 매핑 테이블 (수식 복원용)
DECODE_MAP = {
    '\uE034': '1', '\uE035': '2', '\uE036': '3', '\uE037': '4',
    '\uE038': '5', '\uE039': '6', '\uE03A': '7', '\uE03B': '8',
    '\uE03C': '9', '\uE03D': '0', '\uE046': '-', '\uE048': '+'
}

def decode_math_text(text):
    if not text: return text
    for enc, dec in DECODE_MAP.items():
        text = text.replace(enc, dec)
    return text

def clean_sheet_name(name, fallback="Sheet"):
    if not name: return fallback
    name = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', str(name))
    name = re.sub(r'[\\/*?:\[\]]', '', name)
    return name.strip()[:31] if name.strip() else fallback

def convert_pdf_to_excel():
    st.title("🚀 수학 학습지 PDF ➡️ 엑셀 복원 변환기")
    st.write("PDF 파일을 업로드하면 자동으로 변환이 진행되며 다운로드 버튼이 나타납니다.")
    
    # 💾 [핵심] 세션 상태 초기화 (데이터 증발 및 무한 루프 방지)
    if 'excel_data' not in st.session_state:
        st.session_state['excel_data'] = None
    if 'last_uploaded_filename' not in st.session_state:
        st.session_state['last_uploaded_filename'] = None

    uploaded_file = st.file_uploader("수학 문제지 PDF 파일을 업로드하세요", type="pdf")
    
    if uploaded_file:
        # 🔥 [핵심 제어문] 이전 파일과 이름이 다를 때만 (즉, 새로 업로드되었을 때만) 변환 실행
        if st.session_state['last_uploaded_filename'] != uploaded_file.name:
            with st.spinner("🔄 PDF에서 깨진 수식을 분석하고 엑셀 파일로 변환하는 중입니다..."):
                try:
                    excel_buffer = io.BytesIO()
                    found_text = False
                    
                    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                        with pdfplumber.open(uploaded_file) as pdf:
                            for i, page in enumerate(pdf.pages):
                                text = page.extract_text(layout=True)
                                if text:
                                    lines = text.split('\n')
                                    page_rows = []
                                    detected_title = None
                                    
                                    for line in lines:
                                        if not line.strip(): continue
                                        decoded_line = decode_math_text(line)
                                        
                                        if not detected_title and any(k in decoded_line for k in ["학습지", "계산", "학기", "혼합", "초등학교"]):
                                            detected_title = decoded_line
                                        
                                        columns = re.split(r'\s{4,}', decoded_line.strip())
                                        page_rows.append(columns)
                                    
                                    if page_rows:
                                        df = pd.DataFrame(page_rows)
                                        remove_illegal_chars = lambda val: re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', str(val)) if isinstance(val, str) else val
                                        df = df.map(remove_illegal_chars) if hasattr(df, 'map') else df.applymap(remove_illegal_chars)
                                        
                                        sheet_title = detected_title if detected_title else f"Page_{i+1}"
                                        safe_sheet_name = clean_sheet_name(sheet_title, fallback=f"Page_{i+1}")
                                        
                                        df.to_excel(writer, sheet_name=safe_sheet_name, index=False, header=False)
                                        found_text = True
                                        
                    if found_text:
                        # 성공 시 세션 상태에 데이터 백업 및 파일명 기록
                        st.session_state['excel_data'] = excel_buffer.getvalue()
                        st.session_state['last_uploaded_filename'] = uploaded_file.name
                        st.success("🎉 수식 해독 및 엑셀 변환 완료!")
                    else:
                        st.error("PDF 파일에서 텍스트를 추출하지 못했습니다. 이미지형 PDF인지 확인해주세요.")
                        st.session_state['excel_data'] = None
                        
                except Exception as e:
                    st.error(f"🚨 변환 중 오류가 발생했습니다: {str(e)}")
                    st.session_state['excel_data'] = None

    # 🎯 [핵심] 다운로드 버튼은 상단 제어문과 독립적으로 렌더링
    if st.session_state['excel_data'] is not None and uploaded_file is not None:
        st.write("---")
        clean_filename = uploaded_file.name.rsplit('.', 1)[0]
        st.download_button(
            label="✨ 복원된 엑셀 파일 다운로드",
            data=st.session_state['excel_data'],
            file_name=f"{clean_filename}_수식복원.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

if __name__ == "__main__":
    convert_pdf_to_excel()
