
// build seance_data.json from csv files

const seance_data={}
export default seance_data

import { default as plated_module } from "plated"
import { parse as csv_parse } from "csv-parse/sync"
import fs from "node:fs"

import path from "path"
import { fileURLToPath } from "url"
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

seance_data.generate=async function()
{

const text_csv=fs.readFileSync(__dirname+"/../csv/sheets/text.csv", 'utf8');
let texts=csv_parse(text_csv,{relax_column_count:true,columns:true})

const letter_csv=fs.readFileSync(__dirname+"/../csv/sheets/letter.csv", 'utf8');
let letters=csv_parse(letter_csv,{relax_column_count:true,columns:true})
for(let v of letters ) { texts.push(v) } // append
let textids={} ; for(let v of texts )
{
	textids[v.id]=textids[v.id]||[] ;
	if(v.text)
	{
		let ok=(v.ok||"").toLowerCase().trim()
		if(ok=="ok") // only texts flagged as OK
		{
			(textids[v.id]).push(v.text)
		}
	}
}

const image_csv=fs.readFileSync(__dirname+"/../csv/sheets/image.csv", 'utf8');
let images=csv_parse(image_csv,{relax_column_count:true,columns:true})

let imageids={} ; for(let image of images )
{
	image.idx=Number(image.id.substr(5))
	imageids["image"+image.idx]=image
	image.emotion=image.emotion.trim().toLowerCase()
	image.max_question=0
	for(let i=1;i<100;i++) // probably not that many questions
	{
		let id=image.emotion+i+"_question"
		if(!textids[id]){break} // so we break
		image.max_question=i
	}

// assign questions to each image
	let idx=image.idx*3 // start with this question (might need to wrap)
	image.questions=[]
	if(image.max_question>=1)
	{
		let num=0;
		for(let i=0;i<image.max_question;i++)
		{
			let id=image.emotion+(1+(idx%image.max_question))
			if(textids[id+"_question"]) // might not exist
			{
				image.questions[num]=id // this should be a stable list
				num=num+1
			}
			idx=idx+1 // next
		}
	}
}

console.log( "Generating file "+__dirname+"/seance_data.json" )
fs.writeFileSync(__dirname+"/seance_data.json", JSON.stringify({textids:textids,imageids:imageids},null,1) );


}
