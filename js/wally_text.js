
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
	let tcsv=await load_csv( opts.dirname+"/csv/sheets/text.csv" )
	tcsv.splice(0,1) // remove header so we can sort

	let acsv=await load_csv( opts.dirname+"/csv/jobs/question.out.csv" )

	for(let ai=1;ai<acsv.length;ai++)
	{
		let line=acsv[ai]
		let id=(line[0]).trim()
		let text=clean_text(line[1])
		tcsv.push([id,text])
	}
	
	tcsv.sort(function(a,b){
		if(a[0]<b[0]){return -1}
		if(a[0]>b[0]){return 1}
		if(a[1]<b[1]){return -1}
		if(a[1]>b[1]){return 1}
		return 0
	})
	
	for(let i=tcsv.length-1;i>0;i--)
	{
		let a=tcsv[i]
		let b=tcsv[i-1]
		if( a[0]==b[0] && a[1]==b[1] )
		{
			tcsv.splice(i,1) // dedeup
		}
	}

	tcsv.splice(0,0,["id","text"]) // replace header
	await save_csv( opts.dirname+"/csv/sheets/text.csv" , tcsv )
}


