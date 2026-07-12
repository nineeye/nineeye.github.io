const search=document.getElementById("searchBox");

search.addEventListener("input",()=>{

const keyword=

search.value.toLowerCase();

document

.querySelectorAll(".tool-card")

.forEach(card=>{

const text=

card.innerText.toLowerCase();

card.style.display=

text.includes(keyword)

?"block"

:"none";

});

});