// =========================================
// Converter Mall Generator v1.0
// 하나의 JSON으로 변환기 생성
// =========================================

class ToolGenerator{

constructor(tool){

this.tool=tool;

}

title(){

return this.tool.title;

}

description(){

return this.tool.description;

}

accept(){

return this.tool.accept.join(",");

}

output(){

return this.tool.output;

}

icon(){

return this.tool.icon;

}

html(){

return `

<!DOCTYPE html>

<html lang="ko">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>${this.title()}</title>

<meta
name="description"
content="${this.description()}">

<link rel="stylesheet"
href="../../assets/css/main.css">

<link rel="stylesheet"
href="../../assets/css/converter.css">

</head>

<body>

<header class="header">

<div class="logo">

${this.icon()} ${this.title()}

</div>

<a href="../../index.html">

Home

</a>

</header>

<section class="converter-hero">

<h1>

${this.title()}

</h1>

<p>

${this.description()}

</p>

</section>

<section class="upload">

<div id="dropBox"

class="drop-box">

업로드

</div>

</section>

<section>

<button id="convertBtn">

변환

</button>

</section>

<section id="downloadResult">

</section>

<script src="../../assets/js/converter-engine.js"></script>

<script src="../../assets/js/${this.tool.engine}.js"></script>

</body>

</html>

`;

}

}