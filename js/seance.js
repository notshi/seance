
const seance={}
export default seance

import { default as plated_module } from "plated"
import { parse as csv_parse } from "csv-parse/sync"


import { textids , imageids } from "./seance_data.js"


let htmltemplate=function(s)
{
    let temp = document.createElement("template")
    temp.innerHTML = s.trim()
    return temp.content.firstChild
}

function shuffle(tab)
{
	let idx = 0
	for( let len=tab.length ; len>0 ; len-- )
	{
		idx = Math.floor( Math.random() * len) // pick a random
		let temp=tab[idx]
		tab[idx]=tab[len-1]
		tab[len-1]=temp
	}
	return tab
}
function rando(tab)
{
	let idx = Math.floor( Math.random() * tab.length ) // pick a random
	return tab[idx]
}

seance.start=async function(opts)
{
	console.log(plated_module)
	let plated=plated_module.create({})
	
	seance.datachunks={}
	seance.datachunks.ghostimage="image1"
	seance.datachunks.image=imageids[seance.datachunks.ghostimage]

	let answers=[0,0,0,0,0,0] // the 6 answers
	let question={}
	let set_question=function(idx)
	{
		question={}
		question.idx=idx
		
		question.idbase=seance.datachunks.image.questions[idx]
		question.id=question.idbase+"_question"
		
		question.order=shuffle([1,2,3,4]) // random order of answers
//		question.order[4]=0 // and 5th answer is always a pass

		question.select_num=4*(Math.floor(Math.random()*32768)+32768) // pick random starting answer texts
		
		question.setanswer=function(num)
		{
			let phase=Math.floor(num/4) // cycle through each possible item
			let idx=question.order[ num%4 ]
			let id=question.idbase+"_answer"+idx
//			if(idx==0) { id="answer0" } // pass option is generic
			let aa=textids[id] || textids["answer0"]
			
			question.select_id=id
			question.select_idx=idx
			question.select_text=aa[ phase%aa.length ]

			seance.datachunks.answer=question.select_text // pick one answer to display
		}
		question.setanswer(question.select_num)

		seance.datachunks.question=rando(textids[question.id]) // pick one random question to display		
	}
	set_question(0) // 6 questions 0-5

	let build_letter=function()
	{
		let s=""
		for(let i=0;i<6;i++)
		{
			let a=answers[i]
			let q=seance.datachunks.image.questions[i]
			let id="letter_"+seance.datachunks.image.id+"_"+q+"_answer"+a
			let t=textids[id]
			if(t)
			{
				s=s+"<p>"+rando(t)+"</p>\n"
			}
		}
		
		seance.datachunks.letter=s
	}
//	build_letter()
		
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
		let chunks=plated.chunks.merge_namespace(seance.datachunks)
		plated.chunks.reset_namespace()
		return chunks
	}
	console.log(map)

	let click=null

	let data={}
	let goto=function(name)
	{
		let chunks=page(name)
		data=chunks.data

		if(data.mode=="question") // pick a new question and reload chunks
		{
			set_question(data.question)
			chunks=page(name) // rebuild with newly picked question texts
			data=chunks.data
		}

		if(data.mode=="letter") // Build final letter
		{
			build_letter()			
			chunks=page(name) // rebuild with newly picked question texts
			data=chunks.data
		}

		let css=plated.chunks.replace("{css}",chunks)
		let str=plated.chunks.replace("{body}",chunks)
		let body=document.createElement("body");
		body.innerHTML=str

		body.addEventListener("click",click)
		document.getElementsByTagName('body')[0].replaceWith(body)
		document.getElementsByTagName('style')[0].innerHTML=css
		
		seance.catch_ghostname=null
		if(data.mode=="ghostfloat") // float some ghosts
		{
			console.log(data.mode)
			let add_ghost ; add_ghost=function()
			{
				let name="image"+(Math.floor(Math.random() * 12)+1)
				if(!seance.catch_ghostname){seance.catch_ghostname=name} // if not set yet
				
				let p=document.getElementById("ghost_container")
				if(p)
				{
					let g=htmltemplate(`
<div class="ghost_handle">
	<div class="ghost_image" style="background:url('./data/${name}.small.jpg') center center / contain no-repeat;"></div>
</div>
`)
					p.appendChild(g)
					setTimeout(function(){seance.catch_ghostname=name},3000) // wait a while before setting
					setTimeout(add_ghost,7000)
					setTimeout(function(){g.remove()},15000)
				}
			}
			add_ghost()

		}

	}
	
	click=function(event)
	{
		event.preventDefault()
		let it=event.target
		console.log(it)
		if( it.tagName=="A" )
		{
			let catchghost=it.hasAttribute("catchghost")
			if(catchghost)
			{
				seance.datachunks.ghostimage=seance.catch_ghostname
				seance.datachunks.image=imageids[seance.datachunks.ghostimage]
				console.log("catchghost "+seance.datachunks.ghostimage)
			}

			let mp3=it.getAttribute("mp3")
			if(mp3)
			{
				audio.src=mp3
				audio.loop=true
				;( audio.play() ) .then(function(){}).catch(function(){})
			}
			
			let id=it.id
			if( ( id == "answer_next" ) || ( id == "answer_prev" ) ) // handle arrows
			{
				if( id == "answer_next" )
				{
					question.select_num++
				}
				else
				if( id == "answer_prev" )
				{
					question.select_num--
				}
				question.setanswer(question.select_num)
				
				let a=document.getElementById("answer")
				a.textContent=seance.datachunks.answer

			}
			if( id == "answer_yes" ) // remember answer
			{
				answers[ question.idx ]=question.select_idx
				console.log("answers",answers)
			}

			let href=it.getAttribute("href")
			if(href)
			{
				console.log("GOTO",href)
				goto(href)
			}
		}
	}




	goto("seance000.html")

}
