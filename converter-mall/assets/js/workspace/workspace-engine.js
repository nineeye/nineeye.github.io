// =====================================
// AI Workspace Engine v2.0
// =====================================

window.workspaceEngine = (() => {

    function formatSize(bytes) {

        if (bytes < 1024)
            return bytes + " B";

        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + " KB";

        return (bytes / 1024 / 1024).toFixed(2) + " MB";

    }

    function extension(name) {

        const arr = name.split(".");

        return arr.pop().toLowerCase();

    }

    function render(file) {

        const workspace =
            document.getElementById("workspace");

        const recommend =
            document.getElementById("recommendContainer");

        if (!workspace || !recommend)
            return;

        const ext = extension(file.name);

        //--------------------------------------------------
        // Tool Registry 검색
        //--------------------------------------------------

        let tools = [];

        if (window.ToolRegistry) {

            tools = ToolRegistry.findByExtension(ext);

        }

        //--------------------------------------------------
        // Workspace
        //--------------------------------------------------

        workspace.innerHTML = `

<div class="workspace-card">

    <h3>${file.name}</h3>

    <p>📦 ${formatSize(file.size)}</p>

    <p>📁 ${ext.toUpperCase()} 파일</p>

    <p>🤖 AI가 사용할 수 있는 변환기를 분석했습니다.</p>

</div>

`;

        //--------------------------------------------------
        // 추천 변환기
        //--------------------------------------------------

        if (tools.length === 0) {

            recommend.innerHTML = `

<div class="empty">

지원되는 변환기를 찾지 못했습니다.

</div>

`;

            return;

        }

        recommend.innerHTML = tools.map(tool => `

<div class="recommend-card">

    <div class="recommend-icon">

        ${tool.icon}

    </div>

    <div class="recommend-info">

        <h3>${tool.name}</h3>

        <p>${tool.category}</p>

    </div>

    <button
        class="recommend-btn"
        data-tool="${tool.id}"
    >

        열기

    </button>

</div>

`).join("");

        //--------------------------------------------------
        // 버튼 이벤트
        //--------------------------------------------------

        recommend
            .querySelectorAll(".recommend-btn")
            .forEach(btn => {

                btn.onclick = () => {

                    location.href =
                        "converters/" +
                        btn.dataset.tool +
                        "/index.html";

                };

            });

    }

    return {

        load(file) {

            render(file);

        }

    };

})();