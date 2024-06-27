
const wally_text={}
export default wally_text

import { parse as csv_parse } from "csv-parse/sync"
import { stringify as csv_stringify } from "csv-stringify/sync"
import pfs from "node:fs/promises"
import path from "path"
import child_process from "child_process"

import plated from "plated"

import wally_sheets from "./wally_sheets.js"

let load_csv=async function(path)
{
	let data=await pfs.readFile(path,"utf8")
	let csv=csv_parse(data,{relax_column_count:true})
	return csv
}

let save_csv=async function(path,rows)
{
	let csvs=csv_stringify( rows )
	await pfs.writeFile( path , csvs )
}

let clean_text=function(s)
{
	s=s.trim()
	s=s.split("\n")[0] // first line only rest of lines are usually garbage
	s=s.trim()
	s=s.replace(/[^\x20-\x7F]/g, " ") // replace non ascii chars or control sequences with spaces
	s=s.replace(/\s+/g, " ") // replace multiple spaces with 1 space
	s=s.trim()
	return s
}

wally_text.start=async function(opts)
{
	let rows=[["id","text"]]
	let acsv=await load_csv( opts.dirname+"/csv/jobs/question.out.csv" )
	for(let ai=1;ai<acsv.length;ai++)
	{
		let line=acsv[ai]
		let id=(line[0]).trim()
		let text=clean_text(line[1])
		if(id && text)
		{
			rows.push([id,text])
		}
	}

	let doc=await wally_sheets.load_doc("12rsvB81cRoE5n7mdCpvCjj38OqTFjBSVzJNOfL4ApPY")
	let sheet=doc.sheetsByTitle["text"]
	await wally_sheets.merge_sheet(sheet,rows)
}


