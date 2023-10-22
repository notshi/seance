
const wally_work={}
export default wally_work

import { parse as csv_parse } from "csv-parse/sync"
import pfs from "node:fs/promises"
import path from "path"



wally_work.start=async function(opts)
{
	console.log("working")
	let it={}
	it.opts=opts
	it.ids={}
	await wally_work.load_all(it)
	
	if( opts.filename )
	{
		await wally_work.load_csv(it,opts.filename)
	}
	
	await wally_work.random(it)
	
	console.log(it)
}


wally_work.load_all=async function(it)
{
	await wally_work.load_csvs(it,it.opts.dirname+"/csv/input")
}


wally_work.load_csvs=async function(it,path)
{
	for(let name of await pfs.readdir(path) )
	{
		await wally_work.load_csv(it,path+"/"+name)
	}
}


wally_work.load_csv=async function(it,path)
{
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
				if(!it.ids[id]) { it.ids[id]=[] } // manifest array
				it.ids[id][ it.ids[id].length ]=text // append to end of array
			}
		}
	}
}


wally_work.random=async function(it)
{
	it.rnd={}
	for(let n in it.ids)
	{
		let a=it.ids[n]
		if(a.length>0)
		{
			let i=Math.floor(Math.random()*a.length)%a.length
			let v=a[i]
			it.rnd[n]=v
		}
	}
}
