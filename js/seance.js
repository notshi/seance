
const seance={}
export default seance

import { default as plated_module } from "plated"
import { parse as csv_parse } from "csv-parse/sync"


import seance_data from "./seance_data.json" with { type: "json" }
const textids=seance_data.textids
const imageids=seance_data.imageids

const QNUM=3 // 3 questions
const ANUM=3 // 3 answers

let htmltemplate=function(s)
{
    let temp = document.createElement("template")
    temp.innerHTML = s.trim()
    return temp.content.firstChild
}

function shuffle(tab)
{
	let tmp=[]
	while(tab.length>0) // shuffle out
	{
		tmp.push( tab.splice( Math.floor( Math.random() * tab.length) , 1 )[0] )
	}
	while(tmp.length>0) // shuffle back
	{
		tab.push( tmp.splice( Math.floor( Math.random() * tmp.length) , 1 )[0] )
	}
	return tab
}

function rando(tab)
{
	if( tab.length < 1 ) { return "MISSING TEXT" }
	let idx = Math.floor( Math.random() * tab.length ) // pick a random
	return tab[idx]
}


seance.start=async function(opts)
{
	let plated=plated_module.create({})
	
	seance.datachunks={}
	seance.datachunks.ghostimage="image1"
	seance.datachunks.image=imageids[seance.datachunks.ghostimage]
	
	seance.randoimages=shuffle([1,2,3,4,5,6,7,8,9,10,11,12])
	seance.randoimages_idx=55555
	seance.get_randoimage=function()
	{
		seance.randoimages_idx++
		if( seance.randoimages_idx >= seance.randoimages.length )
		{
			seance.randoimages_idx=0
		}
		return "image"+seance.randoimages[ seance.randoimages_idx ]
	}
	
	let answers=[] // the answers to each question
	let questions=[] // idbase of each question
	let question={}
	let set_question=function(idx,idbase)
	{
		question={}
		question.idx=idx
		
		question.idbase=idbase || seance.datachunks.image.questions[idx]
		question.id=question.idbase+"_question"
		
		questions[idx]=question.idbase
		
		question.select_num=ANUM*(Math.floor(Math.random()*32768)+32768) // pick random starting answer texts
		
		question.setanswer=function(num)
		{
			let phase=Math.floor(num/ANUM) // cycle through each possible item
			let idx=(num%ANUM)+1
			let id=question.idbase+"_answer"+idx
			let aa=textids[id] || textids["answer0"]
			
			question.select_idx=idx
			question.select_text=aa[ phase%aa.length ]

			seance.datachunks.answer=question.select_text // pick one answer to display
		}
		question.setanswer(question.select_num)

		seance.datachunks.question=rando(textids[question.id]) // pick one random question to display		
	}

	let build_letter=function()
	{
		let s=""
		for(let i=0;i<QNUM;i++)
		{
			let a=answers[i]
			let q=questions[i]
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
		
//	console.log("SEE YANCE")
//	console.log(textids)
//	console.log(imageids)

	let reset_question=function()
	{
		seance.questions=[]
		seance.answers=[]
		set_question(0) // first of 3 questions 0-2
	}
	reset_question()

	seance.save_state=function()
	{
		let state={}

		state.page=seance.page_name
		state.image=seance.datachunks.ghostimage
		state.questions=questions
		state.answers=answers
		state.question_idx=question.idx||0

console.log("SAVE",state)
		seance.state=state
		return state
	}
	seance.load_state=function(state)
	{
		state=state || seance.state || {}
		

		seance.datachunks.ghostimage=state.image || "image1"
		seance.datachunks.image=imageids[ seance.datachunks.ghostimage ]
		seance.goto(state.page || "seance000.html")

		seance.questions=state.questions||[]
		seance.answers=state.answers||[]

		state.question_idx=state.question_idx||0
		set_question( state.question_idx , seance.questions[state.question_idx] )

		seance.state=state
console.log("LOAD",state)
	}

	seance.save=function()
	{
		let state=seance.save_state()
		let s=JSON.stringify(state)
		let h="#"+window.btoa(s)
		if( window.location.hash != h )
		{
			seance.save_hash=h
			window.location.hash = h
		}
	}

	seance.load=function()
	{
		let state={}
		try{ 
			let h=(window.location.hash||"").substr(1)
			let s=window.atob(h)
			state=JSON.parse(s)
		}catch(e){}
		
		seance.load_state(state)
	}

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
//	console.log(map)

	let click=null

	let data={}
	seance.goto=function(name)
	{
		seance.page_name=name
		let chunks=page(name)
		data=chunks.data

		if( data.question )
		{
			console.log("Q"+data.question)
			set_question(data.question)
		}
		build_letter()

		chunks=page(name) // rebuild with newly picked question texts
		data=chunks.data

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
				let name=seance.get_randoimage()
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
//		console.log(it)
		if( it.tagName=="A" )
		{
			let catchghost=it.hasAttribute("catchghost")
			if(catchghost)
			{
				seance.datachunks.ghostimage=seance.catch_ghostname
				seance.datachunks.image=imageids[seance.datachunks.ghostimage]
				shuffle(seance.datachunks.image.questions)
				reset_question()
				console.log("catchghost "+seance.datachunks.ghostimage)
			}

			let mp3=it.getAttribute("mp3")
			if(mp3)
			{
				audio.src=mp3
				audio.loop=true
				;( audio.play() ) .then(function(){}).catch(function(){})
			}
			
			let sfx=it.getAttribute("sfx")
			if(sfx)
			{
				audio.src=mp3
				;( audio.play() )
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
			if( id == "answer" ) // remember answer
			{
				answers[ question.idx ]=question.select_idx
				console.log("answers",answers)
			}

			let href=it.getAttribute("href")
			if(href)
			{
				console.log("GOTO",href)
				seance.goto(href)
			}
			
			seance.save()
		}
	}




//	seance.goto("seance000.html")	
	seance.load() // reset
	seance.save() // set hash

}
