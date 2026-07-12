// =========================================
// Build All Tools
// =========================================

async function build(){

const res=await fetch("../data/tools.json");

const tools=await res.json();

tools.forEach(tool=>{

const page=

new ToolGenerator(tool);

console.log(

page.html()

);

});

}

build();