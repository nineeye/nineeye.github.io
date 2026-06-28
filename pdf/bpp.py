import streamlit as st
import io
import os
from pdf2docx import Converter
from pdf2image import convert_from_bytes

# Poppler 경로 설정 (다운로드하신 폴더의 bin 경로)
POPPLER_PATH = r'C:\poppler\Library\bin'

# 페이지 설정
st.set_page_config(page_title="PDF 올인원 도구", layout="centered")

# 사이드바 메뉴 구성
st.sidebar.title("🛠️ PDF 도구 모음")
menu = st.sidebar.selectbox("기능을 선택하세요", ["PDF → Word 변환", "PDF → 이미지 변환"])

# 1. PDF → Word 변환 기능
if menu == "PDF → Word 변환":
    st.title("📄 PDF → Word 변환기")
    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요.", type=["pdf"])

    if uploaded_file and st.button("변환 시작하기"):
        with st.spinner("변환 중입니다. 잠시만 기다려주세요..."):
            try:
                pdf_path = "input.pdf"
                docx_path = "output.docx"
                with open(pdf_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                
                cv = Converter(pdf_path)
                cv.convert(docx_path, start=0, end=None)
                cv.close()
                
                with open(docx_path, "rb") as f:
                    st.download_button("결과물 다운로드", f, "result.docx")
                st.success("완벽하게 변환되었습니다!")
            except Exception as e:
                st.error(f"변환 중 오류가 발생했습니다: {e}")

# 2. PDF → 이미지 변환 기능
elif menu == "PDF → 이미지 변환":
    st.title("🖼️ PDF → 이미지 변환기")
    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요", type="pdf")

    if uploaded_file is not None and st.button("변환 시작"):
        with st.spinner("변환 중입니다..."):
            try:
                # poppler_path 추가 적용
                images = convert_from_bytes(uploaded_file.read(), poppler_path=POPPLER_PATH)
                
                for i, image in enumerate(images):
                    img_byte_arr = io.BytesIO()
                    image.save(img_byte_arr, format='PNG')
                    img_byte_arr = img_byte_arr.getvalue()
                    
                    st.image(image, caption=f"페이지 {i+1}")
                    st.download_button(
                        label=f"페이지 {i+1} 다운로드",
                        data=img_byte_arr,
                        file_name=f"page_{i+1}.png",
                        mime="image/png"
                    )
                st.success("모든 페이지 변환 완료!")
            except Exception as e:
                st.error(f"변환 중 오류가 발생했습니다: {e}")
