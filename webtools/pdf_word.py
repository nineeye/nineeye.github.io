import streamlit as st
from pdf2docx import Converter
import os
import io

def convert_pdf_to_word():
    st.subheader("PDF → Word 변환기")
    uploaded_file = st.file_uploader("변환할 PDF 파일을 선택하세요", type=['pdf'])
    
    if uploaded_file is not None:
        if st.button("변환 시작"):
            # 업로드된 파일을 임시로 저장
            with open("temp.pdf", "wb") as f:
                f.write(uploaded_file.getbuffer())
            
            # Word 파일로 변환
            cv = Converter("temp.pdf")
            cv.convert("output.docx", start=0, end=None)
            cv.close()
            
            # 변환된 파일 읽기
            with open("output.docx", "rb") as f:
                docx_data = f.read()
            
            # 다운로드 버튼
            st.download_button(
                label="Word 파일 다운로드",
                data=docx_data,
                file_name="converted_file.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
            
            st.success("변환 완료!")
            
            # 임시 파일 삭제
            os.remove("temp.pdf")
            os.remove("output.docx")
