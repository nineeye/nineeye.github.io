import streamlit as st
from pypdf import PdfReader, PdfWriter
import io

def manage_pdf_security():
    st.subheader("🔒 PDF 암호 설정 및 해제")
    
    action = st.radio("작업을 선택하세요", ["암호 설정", "암호 해제"])
    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요", type="pdf")
    
    if uploaded_file:
        password = st.text_input("비밀번호를 입력하세요", type="password")
        
        if st.button("작업 시작"):
            if not password:
                st.warning("비밀번호를 입력해 주세요.")
                return
            
            try:
                if action == "암호 설정":
                    reader = PdfReader(uploaded_file)
                    writer = PdfWriter()
                    for page in reader.pages:
                        writer.add_page(page)
                    writer.encrypt(password)
                    
                    output = io.BytesIO()
                    writer.write(output)
                    output.seek(0)
                    st.download_button("암호 설정된 PDF 다운로드", output, "secured.pdf")
                    st.success("암호 설정 완료!")

                else: # 암호 해제
                    reader = PdfReader(uploaded_file)
                    if reader.is_encrypted:
                        reader.decrypt(password)
                    
                    writer = PdfWriter()
                    for page in reader.pages:
                        writer.add_page(page)
                    
                    output = io.BytesIO()
                    writer.write(output)
                    output.seek(0)
                    st.download_button("암호 해제된 PDF 다운로드", output, "unsecured.pdf")
                    st.success("암호 해제 완료!")
                    
            except Exception as e:
                st.error(f"오류 발생: {str(e)}")
