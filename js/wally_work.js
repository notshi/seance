
const wally_work={}
export default wally_work

import { parse as csv_parse } from "csv-parse/sync"
import { stringify as csv_stringify } from "csv-stringify/sync"
import pfs from "node:fs/promises"
import path from "path"
import child_process from "child_process"

import plated from "plated"


wally_work.start=async function(opts)
{
	if( opts.filename )
	{
		await wally_work.job(opts,opts.filename)
	}
	else // do all undone jobs
	{
		let todo={}
		let done={}
		for(let name of await pfs.readdir( opts.dirname+"/csv/jobs" ) )
		{
			if( name.slice(-8)==".out.csv" )
			{
				let n=name.slice(0,-8)+".csv"
				done[n]=true
			}
			else
			if( name.slice(-4)==".csv" )
			{
				let n=name.slice(0,-4)+".csv"
				todo[n]=true
			}
		}
		for(let n in todo)
		{
			if( !done[n] )
			{
				await wally_work.job(opts,opts.dirname+"/csv/jobs/"+n)
			}
		}
	}
}

wally_work.job=async function(opts,filename)
{
	console.log("working on "+filename)
	let it={}
	it.opts=opts
	it.ids={}
	it.cmd=[]

	await wally_work.load_all(it)
	
	if( filename )
	{
		it.cmd=await wally_work.parse_csv(it,filename)
		
		if( filename.slice(-4)==".csv" )
		{
			it.outname=filename.slice(0,-4)+".out.csv"
		}
	}
	
	let p=plated.create({})
	let jobidx=0
	
	it.jobs=[]
	it.prompts=[]
	it.results=[]

	it.redo={}
	it.rnd=await wally_work.random(it,it.ids)
	for(let v of it.cmd)
	{
		let id=""
		let text=""
		if(v.id)
		{
			id=v.id.trim()
			text=(v.text||"").trim()
			if(id)
			{
				it.redo[id]=text
				it.rnd[id]=text
			}
		}
		
		if(id=="run") // generate some output
		{
			jobidx=jobidx+1
			let repeat=Number(text||1)||1
			let predict=Number(it.rnd.predict||1024)||1024
			for(let i=0;i<repeat;i++)
			{
				let prompt=p.chunks.replace(it.rnd.prompt,it.rnd).trim()
				it.prompts.push(prompt)

				let jobid=it.rnd.id || jobidx
				it.jobs.push(jobid)

				console.log("job "+jobid+" "+(i+1)+"/"+repeat)
			
				let r=await wally_work.tee( it.opts.dirname+"/ai/llama" , "-e", "-n",predict, "-p" , prompt )
				let a=r.split(prompt.trim())
				if( a.length>1 ) { r=a[1] }
				it.results.push(r.trim())
			}
			
			// reroll randoms
			it.rnd=await wally_work.random(it,it.ids)
			for(let n in it.redo) { it.rnd[n]=it.redo[n] } //redo all loaded values so far
		}
	}

	let csv=[]
	csv[0]=["prompt","result","job"]
	for(let i=0;i<it.prompts.length;i++)
	{
		csv[i+1]=[ it.prompts[i] , it.results[i] , it.jobs[i] ]
	}
	let csvs=csv_stringify(csv)
	
	if( it.outname )
	{
		await pfs.writeFile(it.outname, csvs )
	}
	else
	{
		console.log(csvs)
	}
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

wally_work.parse_csv=async function(it,path)
{
	let data=await pfs.readFile(path,"utf8")
	let csv=csv_parse(data,{relax_column_count:true,columns:true})
	return csv
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
		if(v.id)
		{
			let id=v.id.trim()
			let text=(v.text||"").trim()
			if(id)
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

wally_work.tee=function()
{
	let cmd=arguments[0]
	let args=Array.prototype.slice.call(arguments, 1)
	let opts={}
	
	let ret=[]
	let err=[]
	
	return new Promise(function(resolve,reject){	
		let ai=child_process.spawn(cmd,args,opts)
		
		ai.stdout.on('data', function(data){
			let s=data.toString()
			ret.push(s)
			process.stdout.write(s)
		})

		ai.stderr.on('data', function(data){
			let s=data.toString()
			err.push(s)
		})

		ai.on('error', function(code){
			reject(err.join("")+"\n")
		})

		ai.on('exit', function(code){
			process.stdout.write("\n\n")
			resolve(ret.join("")+"\n")
		})

	})
}


