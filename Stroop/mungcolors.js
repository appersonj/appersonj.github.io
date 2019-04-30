#!/usr/bin/env node
"use strict"; // works ok as first line in script
const v8 = require("v8");
v8.setFlagsFromString("--max-old-space-size=6000");
//v8.setFlagsFromString("--use_strict");

const fs = require("fs");
const path = require("path");

// =================== begin BOILER ==================
let noLeadWS = function(s, usageStyle) {
  return (usageStyle ?
    s.replace(/^[\r\t ]*/g, "").replace(/(\n)[\r ]*/g, "$1  ") :
    s.replace(/(^|\n)[\t\r ]*/g, "$1"));
};
let usageWS = function(s) {
  return "\n" + noLeadWS(s, true);
};
const tstring = (new Date()).toISOString();
const thisProg = path.basename(process.argv[1]);
const ctxArgs = (process.argv[2]) ? (" \u0027" + process.argv.slice(2).join("\u0027 \u0027") + "\u0027") : "";
const runCtx = `# [${tstring} ${process.env.USER}] ${thisProg} ${ctxArgs}`;

/* global dbug */ // Decleare any globals to SHUT UP ESLINT
global.dbug = 0;
// =================== end BOILER ==================


let usage = function(extra) {
  if (extra) {
    console.error(extra);
  }
  console.log(
    usageWS(
      `Usage: ${thisProg} [-h|-v|-P] [ file ]  -  mungs colors out of html

    The html table is curled from:   
        "https://www.omniglot.com/language/colours/multilingual.htm"

   ------ boilerplate flags -------
  -h : help (this very one),
  -v : verbose/debug info (multiple -v is more verbose),
  -P : annotate (prefix) output with provenance info (when, who, what)

`
    )
  );
  process.exit(99);

};

const desiredColors = ["red", "blue", "green", "purple", "orange", "yellow"];


const detagList = function(txt, tag) { 
  const reString = `(?:(.*?)<${tag}>)(.*?)(?:</${tag}>)`;
  const re  = new RegExp(reString, 'ugm' );
  const res = txt.split(re).filter(x => x.match(/\S/));

  // console.log(`detagList)_: res=${res}`);
  return res;
}

const wrang = function(txt) { 

  // const lines = txt.split(/(\r\n|\n)/);
  // console.log(`lines.length = ${lines.length}`);

  // get rid of CRs
  txt = txt.replace(/(\r\n|\r)/gm,"\n");
  
  // find the first table
  txt = txt.replace(/^.*?(<table.*)/s, "$1");
  
  const thead = txt.replace(/.*?<tr>(.*?)<\/tr>.*/s,"$1");
  
  console.log(`thead: ${thead}\n`);

  const colorList= detagList(thead, 'th').map(c => c.toLowerCase());
  const inverseMap = desiredColors.map(c => colorList.indexOf(c));

  console.log(`desiredColors: ${desiredColors}\ncolorList: ${colorList}\ninverseMap: ${inverseMap}\n` );

};

let modMain = function(options, globals) {

  // how to safely set globals w/out eval or global[x]
  if("object" === typeof globals) {
    Object.keys(globals).forEach(k => global[k] = globals[k]);
  }
  if (options.provenance) {
    console.log(`${options.provenance}`);
  }
  let content = fs.readFileSync(options.file).toString();
  dbug > 0 && console.error("file=" + (options.file || "0:stdin"));

  wrang(content);
  return '';
};


let cliMain = function(args) {
  let options = { file : 0};
  let globals = {dbug : 0};
  let i = 0;

  for (i = 0; i < args.length; ++i) {
    if (!(args[i].match(/^-.*./))) {
      break;
    }
    switch (args[i]) {
      case "-h":
        usage();
        break;
      case "-v":
        globals.dbug += 1;
        break;
      case "-P":
        options.provenance= runCtx;
        break;
      default:
        usage("unknown paramter: " + args[i]);
        break;
    }
  }
  if (i < args.length) {
    options.file = args[i++];
  }
  return modMain(options,globals);
};

//  export both cli and module version
exports.cliMain = cliMain;
exports.modMain = modMain;

if (require.main === module) { // if running from command-line ...
  process.stdout.write(cliMain(process.argv.slice(2)).toString());
}


