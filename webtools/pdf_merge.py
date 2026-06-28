import streamlit as st
from pypdf import PdfWriter
import io

def merge_pdfs():
    st.subheader("PDF 병합기")
    # 여러 파일 업로드 받기
    uploaded_files = st.file_uploader("합칠 PDF 파일들을 선택하세요", accept_multiple_files=True, type=['pdf'])
    
    if uploaded_files and len(uploaded_files) > 1:
        if st.button("PDF 병합 시작"):
            merger = PdfWriter()
            
            for pdf in uploaded_files:
                merger.append(pdf)
            
            # 메모리 상에서 병합된 파일 생성
            output_stream = io.BytesIO()
            merger.write(output_stream)
            output_stream.seek(0)
            
            # 다운로드 버튼 제공
            st.download_button(
                label="병합된 PDF 다운로드",
                data=output_stream,
                file_name="merged_result.pdf",
                mime="application/pdf"
            )
            st.success("병합 완료!")
    elif uploaded_files:
        st.info("두 개 이상의 파일을 선택해주세요.")

# 메인 메뉴 연결 부분 (예시)
# if choice == "PDF 병합":
#     merge_pdfs()
