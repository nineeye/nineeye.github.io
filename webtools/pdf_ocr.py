import streamlit as st
import pytesseract
from pdf2image import convert_from_bytes
from docx import Document
import io

def pdf_ocr():

    st.title("🔍 PDF OCR 텍스트 추출기")

    uploaded_file = st.file_uploader(
        "PDF 파일 업로드",
        type=["pdf"]
    )

    if uploaded_file is None:
        return

    language = st.selectbox(
        "OCR 언어 선택",
        ["kor", "eng", "kor+eng"]
    )

    if st.button("OCR 시작"):

        with st.spinner("OCR 처리 중..."):

            try:

                images = convert_from_bytes(
                    uploaded_file.read(),
                    dpi=300
                )

                extracted_text = ""

                for idx, image in enumerate(images):

                    page_text = pytesseract.image_to_string(
                        image,
                        lang=language
                    )

                    extracted_text += f"\n\n===== PAGE {idx+1} =====\n\n"
                    extracted_text += page_text

                st.success("OCR 완료")

                st.text_area(
                    "추출 결과",
                    extracted_text,
                    height=400
                )

                # TXT 다운로드
                st.download_button(
                    "📄 TXT 다운로드",
                    extracted_text,
                    file_name="ocr_result.txt"
                )

                # DOCX 다운로드
                doc = Document()
                doc.add_paragraph(extracted_text)

                doc_buffer = io.BytesIO()
                doc.save(doc_buffer)
                doc_buffer.seek(0)

                st.download_button(
                    "📝 DOCX 다운로드",
                    doc_buffer,
                    file_name="ocr_result.docx",
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                )

            except Exception as e:
                st.error(f"오류 발생: {str(e)}")
