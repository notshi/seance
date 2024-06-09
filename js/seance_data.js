
import { default as plated_module } from "plated"
import { parse as csv_parse } from "csv-parse/sync"

import path from "path"
import { fileURLToPath } from "url"


import text_csv   from "../csv/sheets/text.csv"
export let texts=csv_parse(text_csv,{relax_column_count:true,columns:true})

import letter_csv from "../csv/sheets/letter.csv"
export let letters=csv_parse(letter_csv,{relax_column_count:true,columns:true})
for(let v of letters ) { texts.push(v) } // append
export let textids={} ; for(let v of texts ) { textids[v.id]=textids[v.id]||[] ; (textids[v.id]).push(v.text) }

import image_csv from "../csv/sheets/image.csv"
export let images=csv_parse(image_csv,{relax_column_count:true,columns:true})

export let imageids={} ; for(let image of images )
{
	image.idx=Number(image.id.substr(5))
	imageids["image"+image.idx]=image
	image.emotion=image.emotion.trim().toLowerCase()
	image.max_question=0
	for(let i=1;i<20;i++)
	{
		let id=image.emotion+i+"_question"
		if(!textids[id]){break}
		image.max_question=i
	}

// assign questions to each image
	let idx=image.idx*3 // start with this question (might need to wrap)
	image.questions=[]
	for(let i=0;i<=5;i++)
	{
		let id=image.emotion+idx+"_question" // might not exist
		if(!textids[id]) // wrap
		{
			idx=idx-image.max_question // wrap
			id=image.emotion+idx+"_question" // try this
		}
		image.questions[i]=image.emotion+idx // this should be a stable list
		idx=idx+1 // next
	}
}

