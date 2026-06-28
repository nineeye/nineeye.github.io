import streamlit as st
from pdf2image import convert_from_bytes
import io
import zipfile

def convert_pdf_to_image():
    st.subheader("🖼️ PDF → 이미지 변환 (부분 선택 가능)")
    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요", type="pdf")
    
    if uploaded_file:
        # PDF 정보 확인을 위해 임시로 읽기
        images = convert_from_bytes(uploaded_file.getvalue(), first_page=1, last_page=1)
        # 전체 페이지 수 계산 (실제로는 pdf2image가 읽어온 객체 길이를 활용하는 것이 좋음)
        # 여기서는 간단히 페이지 범위 선택을 위해 전체 변환 후 필터링하는 방식 대신
        # pdf2image의 옵션을 활용하는 방식을 사용합니다.
        
        mode = st.radio("변환 방식을 선택하세요", ["전체 페이지 변환", "특정 페이지만 변환"])
        target_pages = None
        
        if mode == "특정 페이지만 변환":
            page_input = st.text_input("페이지 번호를 입력하세요 (예: 1, 3, 5-10)")
            # 간단한 파싱 로직
            target_pages = []
            try:
                for part in page_input.split(','):
                    if '-' in part:
                        start, end = map(int, part.split('-'))
                        target_pages.extend(range(start, end + 1))
                    else:
                        target_pages.append(int(part.strip()))
            except:
                st.error("입력 형식이 잘못되었습니다.")
        
        if st.button("변환 시작"):
            # pdf2image로 이미지 변환 (특정 페이지 지정 가능)
            if mode == "특정 페이지만 변환" and target_pages:
                imgs = convert_from_bytes(uploaded_file.getvalue(), pages=target_pages)
            else:
                imgs = convert_from_bytes(uploaded_file.getvalue())
            
            # 여러 장이면 zip으로, 한 장이면 바로 다운로드
            if len(imgs) > 1:
                zip_buffer = io.BytesIO()
                with zipfile.ZipFile(zip_buffer, "a") as zip_file:
                    for i, img in enumerate(imgs):
                        img_buffer = io.BytesIO()
                        img.save(img_buffer, format="JPEG")
                        zip_file.writestr(f"page_{i+1}.jpg", img_buffer.getvalue())
                st.download_button("이미지 압축파일(ZIP) 다운로드", zip_buffer.getvalue(), "images.zip")
            else:
                img_buffer = io.BytesIO()
                imgs[0].save(img_buffer, format="JPEG")
                st.download_button("이미지 다운로드", img_buffer.getvalue(), "image.jpg")
            
            st.success("이미지 변환 완료!")
