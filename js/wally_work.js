
const wally_work={}
export default wally_work

import { parse as csv_parse } from "csv-parse/sync"
import pfs from "node:fs/promises"
import path from "path"
import child_process from "child_process"

import plated from "plated"


wally_work.start=async function(opts)
{
	console.log("working")
	let it={}
	it.opts=opts
	it.ids={}

	await wally_work.load_all(it)
	
	if( opts.filename )
	{
		it.cmd=await wally_work.load_csv(it,opts.filename)
	}
	
	it.rnd={}
	await wally_work.random(it,it.ids,it.rnd)
	await wally_work.random(it,it.cmd,it.rnd)
	
	let p=plated.create({})
	//p.setup()

	it.prompt=p.chunks.replace(it.rnd.prompt,it.rnd)
	
	console.log(it)

	it.result=child_process.execSync(it.opts.dirname+"/ai/llama -p \""+it.prompt.replace(/(["'$`\\])/g,'\\$1')+"\"",{encoding:"utf8"})

	console.log(it.result)
}


wally_work.load_all=async function(it)
{
	await wally_work.load_csvs(it,it.opts.dirname+"/csv/input")
}


wally_work.load_csvs=async function(it,path)
{
	for(let name of await pfs.readdir(path) )
	{
		await wally_work.load_csv(it,path+"/"+name,it.ids)
	}
}


wally_work.load_csv=async function(it,path,into)
{
	into=into || {}
	let data=await pfs.readFile(path,"utf8")
//	console.log(path,data)
	let csv=csv_parse(data,{relax_column_count:true,columns:true})
//	console.log(csv)
	for(let v of csv )
	{
		if(v.id && v.text)
		{
			let id=v.id.trim()
			let text=v.text.trim()
			if(id && text)
			{
				if(!into[id]) { into[id]=[] } // manifest array
				into[id][ into[id].length ]=text // append to end of array
			}
		}
	}
	return into
}


wally_work.random=async function(it,from,into)
{
	from=from || {}
	into=into || {}
	for(let n in from)
	{
		let a=from[n]
		if(a.length>0)
		{
			let i=Math.floor(Math.random()*a.length)%a.length
			let v=a[i]
			into[n]=v
		}
	}
	return into
}
