
const seance={}
export default seance

import { default as plated_module } from "plated"
import { parse as csv_parse } from "csv-parse/sync"
import QRCode from 'qrcode'
import {encode, decode} from "messagepack";
//import zlib from "zlib";

import seance_data from "./seance_data.json" with { type: "json" }
const textids=seance_data.textids
const imageids=seance_data.imageids

const QNUM=3 // 3 questions
const ANUM=3 // 3 answers
const HASHBASE64=true // encode hashdata?

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

function rando(tab,num)
{
	if( tab.length < 1 ) { return "MISSING TEXT" }
	let idx
	if(num) // choose
	{
		idx=num
		if(idx<0) {idx=-idx}
		idx=idx%tab.length
	}
	else // just random
	{
		idx=Math.floor( Math.random() * tab.length ) // pick a random
	}
	return tab[idx]
}

function randi(tab)
{
	if( tab.length < 1 ) { return 0 }
	let idx = Math.floor( Math.random() * tab.length ) // pick a random
	return idx
}


seance.start=async function(opts)
{
	let plated=plated_module.create({})
	
	seance.datachunks={}
	seance.datachunks.ghostimage="image1"
	seance.datachunks.image=imageids[seance.datachunks.ghostimage]
	
	seance.select_num=(Math.floor(Math.random()*32768)+32768) // pick random starting answer texts

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
	
	let question={}
	let set_question=function(idx)
	{
		question={}
		question.idx=idx
		
		question.idbase=seance.questions[idx]
		question.id=question.idbase+"_question"
						
		question.setanswer=function(num)
		{
			let phase=Math.floor(num/ANUM) // cycle through each possible item
			let idx=(num%ANUM)+1
			let id=question.idbase+"_answer"+idx
			let aa=textids[id] || textids["answer0"]
			
			question.select_idx=idx
			question.select_text=aa[0] // aa[ phase%aa.length ]

			seance.datachunks.answer=question.select_text // pick one answer to display
		}
		question.setanswer(seance.select_num)

//console.log(textids[question.id])
//		seance.datachunks.question=rando(textids[question.id]) // pick one random question to display		
		
		let qidx= seance.questions[idx+3] % textids[question.id].length
//console.log(qidx)
		seance.datachunks.question=textids[question.id][qidx]
//console.log(seance.datachunks.question)
	}

	let build_letter=async function()
	{
		let s=""
		for(let i=0;i<QNUM;i++)
		{
			let a=seance.answers[i]
			let q=seance.questions[i]
			let id="letter_"+seance.datachunks.image.id+"_"+q+"_answer"+a
			let t=textids[id]
			if(t)
			{
				s=s+"<p>"+rando(t,seance.select_num)+"</p>\n"
			}
		}
		
		seance.datachunks.letter=s
		seance.datachunks.qrcode_img=await QRCode.toDataURL("https://notshi.github.io/seance/"+seance.save_hash)
	}

	let reset_question=function(q)
	{
		seance.select_num=(Math.floor(Math.random()*32768)+32768) // pick random starting answer texts
		shuffle(seance.datachunks.image.questions)
		seance.questions=[ seance.datachunks.image.questions[0] , seance.datachunks.image.questions[1] , seance.datachunks.image.questions[2] ]
		seance.questions[3]=randi(textids[seance.questions[0]+"_question"])
		seance.questions[4]=randi(textids[seance.questions[1]+"_question"])
		seance.questions[5]=randi(textids[seance.questions[2]+"_question"])
		seance.answers=[]
		set_question(0) // first of 3 questions 0-2
	}
	reset_question()

	seance.save_state=async function()
	{
		let state={}

		state.r=seance.select_num
		state.p=seance.page_name
		state.i=seance.datachunks.ghostimage
		state.q=seance.questions
		state.a=seance.answers
		state.x=question.idx||0

		seance.state=state
		return state
	}
	seance.load_state=async function(state)
	{
		state=state || seance.state || {}
		
		reset_question()

		seance.select_num=state.r || seance.select_num

		seance.datachunks.ghostimage=state.i || "image1"
		seance.datachunks.image=imageids[ seance.datachunks.ghostimage ]

		seance.questions=state.q||seance.questions
		seance.answers=state.a||seance.answers

		state.x=state.x||0
		set_question( state.x )

		await seance.goto(state.p || "seance000.html")

		seance.state=state
	}

	seance.save=async function()
	{
		let state=await seance.save_state()
		let h
		if(HASHBASE64)
		{
			let s=encode(state)
			h="#"+Buffer.from(s).toString('base64')
		}
		else
		{
			let s=JSON.stringify(state)
			h="#"+escape(s)
		}
		if( window.location.hash != h )
		{
			seance.save_hash=h
			window.location.hash = h
//			console.log(state)
		}
	}

	seance.load=async function()
	{
		let state={}
		try{ 
			let h=(window.location.hash||"").substr(1)
			seance.save_hash="#"+h
			if(HASHBASE64)
			{
				let b=Buffer.from(h, 'base64')
				state=decode(b)
console.log("LOAD#",state)
			}
			else
			{
				let s=unescape(h)
				state=JSON.parse(s)
			}
		}catch(e){}
		
		await seance.load_state(state)
	}

	seance.hashchange=function()
	{
		if( window.location.hash != seance.save_hash )
		{
			seance.load()
			seance.save()
		}
	}
	window.addEventListener("hashchange",seance.hashchange)


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
	seance.goto=async function(name)
	{
		console.log("GOTO",name)

		seance.page_name=name
		let chunks=page(name)
		data=chunks.data

		if( "number"==typeof data.question )
		{
			console.log("question"+data.question)
			set_question(data.question)
		}
		if(data.mode=="letter") // only build letter when we need it
		{
			console.log(data.mode)
			await build_letter()
		}
		
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
	
	click=async function(event)
	{
		event.preventDefault()
		let it=event.target
//		console.log(it)
		if( it.tagName=="A" )
		{
			await seance.doclick(it)
		}
	}
	seance.doclick=async function(it)
	{
		let catchghost=it.hasAttribute("catchghost")
		if(catchghost)
		{
			seance.datachunks.ghostimage=seance.catch_ghostname
			seance.datachunks.image=imageids[seance.datachunks.ghostimage]
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
				seance.select_num++
			}
			else
			if( id == "answer_prev" )
			{
				seance.select_num--
			}
			question.setanswer(seance.select_num)
			
			let a=document.getElementById("answer")
			a.textContent=seance.datachunks.answer

		}
		if( id == "answer" ) // remember answer
		{
			seance.answers[ question.idx ]=question.select_idx
		}

		let href=it.getAttribute("href")
		if(href)
		{
			await seance.goto(href)
		}
		
		seance.save()
	}

//	seance.goto("seance000.html")	
	await seance.load() // reset
	await seance.save() // set hash

}
