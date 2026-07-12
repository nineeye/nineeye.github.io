// =====================================
// Converter Mall
// Upload Uploader (NEW)
// =====================================

export function bindUploader({

    dropZone,
    input,
    onFiles

}) {

    if (!dropZone || !input) {

        console.error("❌ dropZone 또는 input 없음");

        return;

    }


    // 클릭하면 파일 선택창
    dropZone.addEventListener("click", () => {


        input.click();

    });

    // 파일 선택
    input.addEventListener("change", async () => {


        const files = Array.from(input.files || []);


        if (!files.length) return;

        await onFiles(files);

    });

    // Drag Over
    dropZone.addEventListener("dragover", e => {

        e.preventDefault();

        dropZone.classList.add("drag-over");

    });

    // Drag Leave
    dropZone.addEventListener("dragleave", () => {

        dropZone.classList.remove("drag-over");

    });

    // Drop
    dropZone.addEventListener("drop", async e => {

        e.preventDefault();

        dropZone.classList.remove("drag-over");

        const files = Array.from(e.dataTransfer.files || []);


        if (!files.length) return;

        await onFiles(files);

    });

}
