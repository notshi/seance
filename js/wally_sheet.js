
const wally_sheet={}
export default wally_sheet

import { parse as csv_parse } from "csv-parse/sync"
import { stringify as csv_stringify } from "csv-stringify/sync"
import pfs from "node:fs/promises"
import path from "path"
import child_process from "child_process"

import plated from "plated"

import { textids , imageids } from "./seance_data.js"


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
	jobs.push(["predict","128"])

	for(let it of qcsv )
	{
		jobs.push(["prompt","{text:wrap_reword_question}"])
		jobs.push(["id",it.id+"_question"])
		jobs.push(["prefix","{doyou}"])
		jobs.push(["text",it.question])
		jobs.push(["run",5])

		for( let i=1 ; i<=4 ; i++ )
		{
			let answer=it["answer"+i]
			if(answer)
			{
				jobs.push(["prompt","{text:wrap_reword_answer}"])
				jobs.push(["id",it.id+"_answer"+i])
				jobs.push(["prefix","{imy}"])
				jobs.push(["text",answer])
				jobs.push(["run",5])
			}
		}
	}

	await save_csv( opts.dirname+filename , jobs )

	await wally_sheet.start2(opts)
}

wally_sheet.start2=async function(opts)
{
	let filename="/csv/jobs/letter.csv"
	console.log("working on "+filename)

	let jobs=[]
	jobs.push(["id","text"])
	jobs.push(["predict","512"])
	for(let imageid in imageids )
	{
		let image=imageids[imageid]
		for( let i=0 ; i<=5 ; i++ )
		{
			for( let a=1 ; a<=4 ; a++ )
			{
				let id="letter_"+image.id+"_"+image.questions[i]+"_answer"+a

				let statements=(textids[ image.questions[i]+"_answer"+a ]).join(" ")
				
				jobs.push(["id",id])
				jobs.push(["emotion",image.emotion])
				jobs.push(["artist_name",image.artist])
				jobs.push(["artist_description",image.bio_prompt])
				jobs.push(["statements",statements])
				jobs.push(["prompt","{wrap_letter}"])
				jobs.push(["run",1])
			}
		}
	}
	await save_csv( opts.dirname+filename , jobs )
}


