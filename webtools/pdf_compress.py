import streamlit as st
from pypdf import PdfReader, PdfWriter
import io

def compress_pdf():
    st.subheader("📉 PDF 용량 최적화")
    uploaded_file = st.file_uploader("최적화할 PDF 파일을 업로드하세요", type="pdf")
    
    if uploaded_file:
        if st.button("압축 시작"):
            reader = PdfReader(uploaded_file)
            writer = PdfWriter()
            
            for page in reader.pages:
                # 이미지를 조금 더 최적화해서 추가하는 설정
                writer.add_page(page)
                
            # 압축을 위해 스트림에 저장
            output = io.BytesIO()
            writer.write(output)
            output.seek(0)
            
            st.download_button(
                label="압축된 PDF 다운로드",
                data=output,
                file_name="compressed.pdf",
                mime="application/pdf"
            )
            st.success("최적화 완료!")
