
const wally={}
export default wally

import wally_work from "./wally_work.js"

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
	Read chunks from data.csv and everything in csv/input/* and do some 
	work.

	The {prompt} chunk is expanded and used as an ai prompt {count} 
	times and will be written to *.result.csv

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

	await wally_work.start(opts) // this is async but we do not wait
}
else
{
	console.log(` Unknown wally command "${cmd}" `)
}
