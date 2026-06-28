import streamlit as st
from webtools.pdf_merge import merge_pdfs
from webtools.pdf_word import convert_pdf_to_word
from webtools.pdf_image import convert_pdf_to_image
from webtools.pdf_security import manage_pdf_security  
from webtools.pdf_compress import compress_pdf
from webtools.pdf_rotate import rotate_pdf
from webtools.pdf_remove import remove_pages
from webtools.pdf_excel import convert_pdf_to_excel
from webtools.pdf_split import split_pdf
from webtools.pdf_ocr import pdf_ocr 
from webtools.pdf_watermark import add_watermark
from webtools.pdf_extract import extract_images

st.sidebar.title("🛠️ PDF 도구 모음")

menu = [
    "PDF 병합",
    "PDF → Word 변환",
    "PDF → 이미지 변환",
    "PDF → 이미지 추출",
    "PDF → Excel 변환",
    "PDF OCR",
    "PDF 분할",
    "PDF 워터마크 추가",
    "PDF 암호 설정/해제",
    "PDF 용량 최적화",
    "PDF 페이지 회전",
    "PDF 특정 페이지 삭제"
]

choice = st.sidebar.selectbox("기능을 선택하세요", menu)

if choice == "PDF 병합":
    merge_pdfs()
elif choice == "PDF → Word 변환":
    convert_pdf_to_word()
elif choice == "PDF → 이미지 변환":
    convert_pdf_to_image()
elif choice == "PDF → 이미지 추출":
    extract_images()
elif choice == "PDF → Excel 변환":
    convert_pdf_to_excel()  
elif choice == "PDF OCR":
    pdf_ocr()
elif choice == "PDF 분할":
    split_pdf()   
elif choice == "PDF 워터마크 추가":
    add_watermark()
elif choice == "PDF 암호 설정/해제": # 추가!
    manage_pdf_security()
elif choice == "PDF 용량 최적화":
    compress_pdf()
elif choice == "PDF 페이지 회전":
    rotate_pdf()
elif choice == "PDF 특정 페이지 삭제":
    remove_pages()
