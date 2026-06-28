import streamlit as st
from pypdf import PdfReader
from io import BytesIO
import zipfile


def extract_images():

    st.title("🖼️ PDF 이미지 추출")

    uploaded_file = st.file_uploader(
        "PDF 파일 선택",
        type=["pdf"]
    )

    if uploaded_file is None:
        return

    try:

        reader = PdfReader(uploaded_file)

        extracted_images = []

        image_count = 0

        progress = st.progress(0)

        for page_idx, page in enumerate(reader.pages):

            if "/XObject" not in page["/Resources"]:
                progress.progress(
                    (page_idx + 1) / len(reader.pages)
                )
                continue

            x_objects = page["/Resources"]["/XObject"].get_object()

            for obj_name in x_objects:

                obj = x_objects[obj_name]

                if obj.get("/Subtype") == "/Image":

                    image_count += 1

                    data = obj.get_data()

                    filter_type = obj.get("/Filter")

                    if filter_type == "/DCTDecode":
                        ext = "jpg"

                    elif filter_type == "/JPXDecode":
                        ext = "jp2"

                    elif filter_type == "/FlateDecode":
                        ext = "png"

                    else:
                        ext = "bin"

                    filename = f"page_{page_idx+1}_img_{image_count}.{ext}"

                    extracted_images.append(
                        {
                            "filename": filename,
                            "data": data
                        }
                    )

            progress.progress(
                (page_idx + 1) / len(reader.pages)
            )

        st.success(
            f"총 {len(extracted_images)}개의 이미지를 발견했습니다."
        )

        if len(extracted_images) == 0:
            st.warning("추출 가능한 이미지가 없습니다.")
            return

        st.subheader("이미지 미리보기")

        for img in extracted_images:

            try:
                st.image(
                    img["data"],
                    caption=img["filename"],
                    use_container_width=True
                )
            except:
                pass

            st.download_button(
                label=f"⬇️ {img['filename']} 다운로드",
                data=img["data"],
                file_name=img["filename"],
                mime="application/octet-stream"
            )

        zip_buffer = BytesIO()

        with zipfile.ZipFile(
            zip_buffer,
            "w",
            zipfile.ZIP_DEFLATED
        ) as zip_file:

            for img in extracted_images:

                zip_file.writestr(
                    img["filename"],
                    img["data"]
                )

        zip_buffer.seek(0)

        st.download_button(
            label="📦 전체 이미지 ZIP 다운로드",
            data=zip_buffer,
            file_name="pdf_images.zip",
            mime="application/zip"
        )

    except Exception as e:

        st.error(f"오류 발생: {e}")
