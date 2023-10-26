
const wally_sheet={}
export default wally_sheet

import { parse as csv_parse } from "csv-parse/sync"
import { stringify as csv_stringify } from "csv-stringify/sync"
import pfs from "node:fs/promises"
import path from "path"
import child_process from "child_process"

import plated from "plated"


let load_csv=async function(path)
{
	let data=await pfs.readFile(path,"utf8")
	let csv=csv_parse(data,{relax_column_count:true,columns:true})
	return csv
}

let save_csv=async function(path,rows)
{
	let csvs=csv_stringify( rows )
	await pfs.writeFile( path , csvs )
}

wally_sheet.start=async function(opts)
{
	let qcsv=await load_csv( opts.dirname+"/csv/sheets/question.csv" )

//	console.log(qcsv)

	let filename="/csv/jobs/question.csv"
	console.log("working on "+filename)

	let jobs=[]
	jobs.push(["id","text"])
	jobs.push(["prompt","{text:wrap_reword_question}"])

	for(let it of qcsv )
	{
		jobs.push(["id",it.id+"_question"])
		jobs.push(["text",it.question])
		jobs.push(["run",5])
	}

	save_csv( opts.dirname+filename , jobs )


}


