
const seance={}
export default seance

import { default as plated_module } from "plated"


seance.start=async function(opts)
{
	console.log(plated_module)
	let plated=plated_module.create({})
		
	console.log("SEE YANCE")
	console.log(plated.chunks)

// load full plated json for this site
	let map=await (await fetch("./plated.map.json") ).json()

	
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
			let href=it.getAttribute("href")
			console.log("A",href)
			goto(href)
		}
	}




	goto("landing.html")

}
