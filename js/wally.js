
const wally={}
export default wally

import wally_work from "./wally_work.js"
import wally_sheet from "./wally_sheet.js"

import minimist from "minimist"

import path from "path"
import url from "url"

const args = minimist(process.argv.slice(2),{boolean:true})

//console.log(args)

let cmd=args._[0] || "help"

if( cmd=="help" )
{
	console.log(`
wally
	Feed input csv files and templates into an AI generator and record 
	results in an output csv file. 

wally work data.csv
	Read chunks from data.csv and randomise everything in csv/input/* 
	and do some work.
	
	Read data.csv one line at a time, setting the given chunk. When we 
	set a "run" chunk then: The current {prompt} chunk is expanded and 
	used as an ai prompt {run} times.
	
	output will be written to *.out.csv
	
	if data.csv is not given then csv/jobs is scanned and any .csv file 
	without a .out.csv will automatically be processed.

wally sheet
	Read input data sheets from csv/sheet/*.csv and create internal 
	data files and ai jobs.

wally help
	Print this help message.
`)
}
else
if( cmd=="work" )
{
	let opts={}

	// parent dir relative to this file
	opts.dirname=path.join( path.dirname(url.fileURLToPath(import.meta.url)) , ".." )

	opts.filename=args._[1]

	await wally_work.start(opts)
}
else
if( cmd=="sheet" )
{
	let opts={}

	// parent dir relative to this file
	opts.dirname=path.join( path.dirname(url.fileURLToPath(import.meta.url)) , ".." )

	opts.filename=args._[1]

	await wally_sheet.start(opts)
}
else
{
	console.log(` Unknown wally command "${cmd}" `)
}
