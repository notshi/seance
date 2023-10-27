
const wally_text={}
export default wally_text

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

wally_text.start=async function(opts)
{
	let tcsv=await load_csv( opts.dirname+"/csv/sheets/text.csv" )

//	console.log(tcsv)

	save_csv( load_csv( opts.dirname+"/csv/sheets/text.csv" , tcsv )
}


