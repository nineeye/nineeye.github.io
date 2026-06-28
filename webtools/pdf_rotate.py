import streamlit as st
from pypdf import PdfReader, PdfWriter
import io

def rotate_pdf():
    st.subheader("🔄 PDF 페이지 회전")
    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요", type="pdf")
    
    if uploaded_file:
        reader = PdfReader(uploaded_file)
        num_pages = len(reader.pages)
        
        # 1. 방식 선택
        mode = st.radio("회전 방식을 선택하세요", ["전체 페이지 회전", "특정 페이지만 회전"])
        angle = st.selectbox("회전 각도 (시계 방향)", [90, 180, 270])
        
        target_pages = []
        if mode == "전체 페이지 회전":
            target_pages = list(range(num_pages))
        else:
            page_input = st.text_input(f"페이지 번호를 입력하세요 (예: 1, 3, 5-10) (1 ~ {num_pages})")
            # 2. 페이지 파싱 (범위 입력 5-10 지원 추가)
            try:
                if page_input:
                    for part in page_input.split(','):
                        if '-' in part:
                            start, end = map(int, part.split('-'))
                            target_pages.extend(range(start - 1, end))
                        else:
                            target_pages.append(int(part.strip()) - 1)
            except:
                st.error("입력 형식이 잘못되었습니다. (예: 1, 3, 5-10)")

        if st.button("회전 실행"):
            writer = PdfWriter()
            for i, page in enumerate(reader.pages):
                if i in target_pages:
                    page.rotate(angle)
                writer.add_page(page)
            
            output = io.BytesIO()
            writer.write(output)
            output.seek(0)
            
            st.download_button("수정된 PDF 다운로드", output, "rotated.pdf")
            st.success("회전 완료!")
