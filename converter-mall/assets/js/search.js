// =====================================
// Converter-Mall/assets/js/search.js
// Search Module
// =====================================

export function initSearch() {

    const searchBox = document.getElementById("searchBox");

    if (!searchBox) return;

    const cards = [...document.querySelectorAll(".tool-card")];

    searchBox.addEventListener("input", () => {

        const keyword = searchBox.value
            .trim()
            .toLowerCase();

        let visible = 0;

        cards.forEach(card => {

            const text = card.textContent.toLowerCase();

            const match = keyword === "" || text.includes(keyword);

            card.style.display = match ? "" : "none";

            if (match) visible++;

        });

        updateEmpty(keyword, visible);

    });

}

function updateEmpty(keyword, visible) {

    let empty = document.getElementById("searchEmpty");

    if (!empty) {

        empty = document.createElement("div");

        empty.id = "searchEmpty";

        empty.className = "search-empty";

        const grid = document.querySelector(".tool-grid");

        if (grid)
            grid.after(empty);

    }

    if (!keyword) {

        empty.style.display = "none";

        return;

    }

    if (visible === 0) {

        empty.style.display = "block";

        empty.innerHTML = `

<div class="empty-icon">
🔍
</div>

<h3>검색 결과가 없습니다.</h3>

<p>"${keyword}"와(과) 일치하는 변환기를 찾지 못했습니다.</p>

`;

    } else {

        empty.style.display = "none";

    }

}