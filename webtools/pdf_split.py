import streamlit as st
import io
from PyPDF2 import PdfReader, PdfWriter
import zipfile

def split_pdf():

    st.title("✂️ PDF 분할기")
    st.write("PDF를 페이지별 또는 특정 페이지 수 단위로 분할합니다.")

    uploaded_file = st.file_uploader(
        "PDF 파일 업로드",
        type=["pdf"]
    )

    if uploaded_file is None:
        return

    reader = PdfReader(uploaded_file)
    total_pages = len(reader.pages)

    st.success(f"총 페이지 수: {total_pages}")

    split_size = st.number_input(
        "몇 페이지씩 분할할까요?",
        min_value=1,
        max_value=total_pages,
        value=1
    )

    if st.button("PDF 분할 시작"):

        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:

            part_num = 1

            for start_page in range(0, total_pages, split_size):

                writer = PdfWriter()

                end_page = min(start_page + split_size, total_pages)

                for page_num in range(start_page, end_page):
                    writer.add_page(reader.pages[page_num])

                pdf_buffer = io.BytesIO()
                writer.write(pdf_buffer)
                pdf_buffer.seek(0)

                zip_file.writestr(
                    f"split_{part_num}.pdf",
                    pdf_buffer.read()
                )

                part_num += 1

        zip_buffer.seek(0)

        st.success("분할 완료!")

        st.download_button(
            label="📦 분할된 PDF ZIP 다운로드",
            data=zip_buffer,
            file_name="split_pdf.zip",
            mime="application/zip"
        )
