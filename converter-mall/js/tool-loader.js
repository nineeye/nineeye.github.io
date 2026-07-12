async function loadTools(){

const res=await fetch("/data/tools.json");

const tools=await res.json();

renderTools(tools);

}

function renderTools(tools){

const grid=document.getElementById("toolGrid");

grid.innerHTML="";

tools.forEach(tool=>{

grid.innerHTML+=`

<a class="tool-card"

href="/converters/${tool.id}/">

<div class="tool-icon">

${tool.icon}

</div>

<h3>

${tool.title}

</h3>

<p>

${tool.category}

</p>

</a>

`;

});

}

loadTools();