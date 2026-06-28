import streamlit as st
from pypdf import PdfReader, PdfWriter
import io

def remove_pages():
    st.subheader("✂️ PDF 특정 페이지 삭제")
    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요", type="pdf")
    
    if uploaded_file:
        reader = PdfReader(uploaded_file)
        num_pages = len(reader.pages)
        
        # 전체 페이지 수 안내 추가
        st.info(f"📄 현재 파일의 총 페이지 수: **{num_pages}페이지**")
        
        page_input = st.text_input(f"삭제할 페이지 번호를 입력하세요 (예: 1, 3-5) (1 ~ {num_pages})")
        
        if st.button("삭제 실행"):
            try:
                remove_list = []
                for part in page_input.split(','):
                    if '-' in part:
                        start, end = map(int, part.split('-'))
                        remove_list.extend(range(start - 1, end))
                    else:
                        remove_list.append(int(part.strip()) - 1)
                
                # 삭제 후 남은 페이지 확인
                if len(remove_list) >= num_pages:
                    st.error("모든 페이지를 삭제할 수는 없습니다!")
                    return

                writer = PdfWriter()
                for i, page in enumerate(reader.pages):
                    if i not in remove_list:
                        writer.add_page(page)
                
                output = io.BytesIO()
                writer.write(output)
                output.seek(0)
                
                st.download_button("수정된 PDF 다운로드", output, "removed_pages.pdf")
                st.success(f"{len(remove_list)}개의 페이지가 성공적으로 삭제되었습니다!")
            except:
                st.error("입력 형식이 잘못되었습니다. (예: 1, 3-5)")
