
const seance={}
export default seance

import { default as plated_module } from "plated"
import { parse as csv_parse } from "csv-parse/sync"

import text_csv from "../csv/sheets/text.csv"
let texts=csv_parse(text_csv,{relax_column_count:true,columns:true})
let textids={} ; for(let v of texts ) { textids[v.id]=textids[v.id]||[] ; (textids[v.id]).push(v.text) }

import image_csv from "../csv/sheets/image.csv"
let images=csv_parse(image_csv,{relax_column_count:true,columns:true})
let imageids={} ; for(let image of images )
{
	image.idx=Number(image.id.substr(5))
	imageids[image.idx]=image
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
	for(let i=0;i<5;i++)
	{
		let id=image.emotion+idx+"_question" // might not exist
		while(!textids[id]) // wrap
		{
			idx=idx-image.max_question // wrap
			id=image.emotion+idx+"_question" // try this
		}
		image.questions[i]=image.emotion+idx // this should be a stable list
		idx=idx+1 // next
	}
}

seance.start=async function(opts)
{
	console.log(plated_module)
	let plated=plated_module.create({})
		
	console.log("SEE YANCE")
	console.log(textids)
	console.log(imageids)

// load full plated json for this site
	let map=await (await fetch("./plated.map.json") ).json()
	
	let audio=new Audio()

	
	let page=function(name)
	{
		let aa=name.split("/")
		plated.chunks.reset_namespace()
		plated.chunks.push_namespace(map[""])
		let s
		for(let n of aa)
		{
			if(s) { s=s+"/"+n } else { s=n }
			plated.chunks.push_namespace(map[s])
		}
		let chunks=plated.chunks.merge_namespace({})
		plated.chunks.reset_namespace()
		return chunks
	}
	console.log(map)

	let click=null

	let goto=function(name)
	{
		let chunks=page(name)
		let css=plated.chunks.replace("{css}",chunks)
		let str=plated.chunks.replace("{body}",chunks)
		let body=document.createElement("body");
		body.innerHTML=str

		body.addEventListener("click",click)
		document.getElementsByTagName('body')[0].replaceWith(body)
		document.getElementsByTagName('style')[0].innerHTML=css
	}
	
	click=function(event)
	{
		event.preventDefault()
		let it=event.target
		console.log(it)
		if( it.tagName=="A" )
		{
			let mp3=it.getAttribute("mp3")
			if(mp3)
			{
				audio.src=mp3
				;( audio.play() ) .then(function(){}).catch(function(){})
			}

			let href=it.getAttribute("href")
			console.log("A",href)
			goto(href)
		}
	}




	goto("seance000.html")

}
