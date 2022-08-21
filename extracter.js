//download html using axios
//extract information using jsdom
//convert matces to teams
//save teams to excel file using excel4node
//create folders and save pdf using pdf-lib
//node extracter.js --dataFolder=data --excel=worldCup.xls --source="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results"

//npm init -y
//npm  install minimist
//npm install axios
//npm  install jsdom
//npm install excel4node
//npm install pdf-lib

//next require all libary
let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let path = require("path");
let fs = require("fs");
//download html using axios
//extract information using jsdom
//convert matces to teams
//save teams to excel file using excel4node
//creat folders and save pdf using pdf-lib

let args = minimist(process.argv);
let dwnPromise = axios.get(args.source);
dwnPromise.then(function (response) {
  let html = response.data;
  let dom = new jsdom.JSDOM(html);
  let doc = dom.window.document;
  let scoreBlock = doc.querySelectorAll("div.ds-px-4.ds-py-3");
  let matches = [];

  for (let i = 0; i < scoreBlock.length; i++) {
    let match = {
      t1: "",
      t2: "",
      t1s: "",
      t2s: "",
      result: ""

    };

    let score = scoreBlock[i].querySelectorAll("div.ds-text-compact-s.ds-text-typo-title > strong");
    if (score.length == 2) {
      match.t1s = score[0].textContent;
      match.t2s = score[1].textContent;
    } else if (score.length == 1) {
      match.t1s = score[0].textContent;
      match.t2s = "";
    } else {

    }
    let result = scoreBlock[i].querySelector("p.ds-text-tight-s.ds-font-regular.ds-truncate.ds-text-typo-title>span");
    match.result = result.textContent;
    let teams = scoreBlock[i].querySelectorAll("p.ds-text-tight-m.ds-font-bold.ds-capitalize");
    match.t1 = teams[0].textContent;
    match.t2 = teams[1].textContent;

    matches.push(match);
  }
  let matchesKaJSON = JSON.stringify(matches);

  fs.writeFileSync("match.json", matchesKaJSON, "utf-8");

  let teams = [];
  for (let i = 0; i < matches.length; i++) {
    pushTeamInTeamsArray(teams, matches[i].t1);
    pushTeamInTeamsArray(teams, matches[i].t2);

  }
  for (let i = 0; i < matches.length; i++) {
    pushTeamDetailsInTeamsArray(teams, matches[i].t1, matches[i].t2, matches[i].t1s, matches[i].t2s, matches[i].result);
    pushTeamDetailsInTeamsArray(teams, matches[i].t2, matches[i].t1, matches[i].t2s, matches[i].t1s, matches[i].result);

  }

  let teamsKaJSON = JSON.stringify(teams);
  fs.writeFileSync("teams.json", teamsKaJSON, "utf-8");
  prepareExcel(teams, args.excel);
  preperFolderAndPdf(teams,args.dataFolder);

}).catch(function (error) {
  console.log(error);
});
function preperFolderAndPdf(teams,datadir){
  if(fs.existsSync(datadir)==false){
    fs.mkdirSync(datadir);
  }

  for(let i=0;i<teams.length;i++){
    let teamFolder=path.join(datadir,teams[i].name);
    if(fs.existsSync(teamFolder)==false){
      fs.mkdirSync(teamFolder);
    }

for(let j=0;j<teams[i].matchss.length;j++){
  let match=teams[i].matchss[j];
  creatPdf(teamFolder,teams[i].name,match);
}

  }
}
function creatPdf(teamFolder,homeName,match){
  let matchPdf=path.join(teamFolder,match.vs+".pdf");
let templetFileBytes=fs.readFileSync("Templet.pdf");
let pdfDocKaPromise=pdf.PDFDocument.load(templetFileBytes);
pdfDocKaPromise.then(function(pdfDoc){
  let page=pdfDoc.getPage(0);
   page.drawText(homeName,{
    x:340,
    y:713,
    size:18
   });
   page.drawText(match.vs,{
    x:340,
    y:686,
    size:18
   });
   page.drawText(match.myScore,{
    x:340,
    y:659,
    size:18
   });
   page.drawText(match.oponentScore,{
    x:340,
    y:632,
    size:18
   });
   page.drawText(match.result,{
    x:328,
    y:605,
    size:8
   });
   let savePromise=pdfDoc.save();
   savePromise.then(function(changedBytes){
    fs.writeFileSync(matchPdf,changedBytes);
   });

})

  
}
function prepareExcel(teams, excelFileName) {
  let wb = new excel.Workbook();

  for (let i = 0; i < teams.length; i++) {
    let tsheet = wb.addWorksheet(teams[i].name);
    tsheet.cell(1, 1).string("vs");
    tsheet.cell(1, 2).string("my Score");
    tsheet.cell(1, 3).string("opo Score");
    tsheet.cell(1, 4).string("result");
    for (let j = 0; j < teams[i].matchss.length; j++) {
      tsheet.cell(2+j, 1).string(teams[i].matchss[j].vs);
      tsheet.cell(2+j, 2).string(teams[i].matchss[j].myScore);
      tsheet.cell(2+j, 3).string(teams[i].matchss[j].oponentScore);
      tsheet.cell(2+j, 4).string(teams[i].matchss[j].result);
    }
  }
  wb.write(excelFileName);
}

function pushTeamInTeamsArray(teamsArray, team) {
  let idx = -1;
  for (let i = 0; i < teamsArray.length; i++) {
    if (teamsArray[i].name == team) {
      idx = i;
    }
  }
  if (idx == -1) {
    let teamA = {
      name: team,
      matchss: []
    }
    teamsArray.push(teamA);
  }
}
function pushTeamDetailsInTeamsArray(array, ownTeam, opoTeam, ownScore, opoScore, result) {
  let idx = -1;
  for (let i = 0; i < array.length; i++) {
    if (array[i].name == ownTeam) {
      idx = i;
    }
  }
  let team = array[idx];
  team.matchss.push({
    vs: opoTeam,
    myScore: ownScore,
    oponentScore: opoScore,
    result: result
  })


}