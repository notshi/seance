
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
	
	let csv=[]
	csv.push(["id","text"])

	let p=plated.create({})
	let jobidx=0
	
	it.redo={}
	it.rnd=await wally_work.random(it,it.ids)
	for(let ci in it.cmd)
	{
		let v=it.cmd[ci]
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
				let prefix=p.chunks.replace("{prefix||}",it.rnd).trim()
				let pprompt=prompt // prompt + prefix
				if( prefix != "" ) // special prefix
				{
					pprompt=prompt+" "+prefix
				}

				let jobid=it.rnd.id || jobidx

				console.log("job "+ci+"/"+it.cmd.length+" "+jobid+" "+(i+1)+"/"+repeat)
			
				let r=await wally_work.tee( it.opts.dirname+"/ai/llama" , "-e", "-c",2048, "--keep",-1, "-n",predict, "-p" , pprompt )
				let a=r.split(prompt.trim())
				if( a.length>1 ) { r=a[1] }

				csv.push( [ jobid , r.trim() ] )

				// reroll randoms
				it.rnd=await wally_work.random(it,it.ids)
				for(let n in it.redo) { it.rnd[n]=it.redo[n] } //redo all loaded values so far

				if( it.outname ) // save as we go in case of crash
				{
					let csvs=csv_stringify(csv)
					await pfs.writeFile(it.outname, csvs )
				}

			}			
		}
	}

	
	if( !it.outname )
	{
		let csvs=csv_stringify(csv)
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
			process.stdout.write(s)
			err.push(s)
		})

		ai.on('error', function(code){
			reject(err.join("")+"\n")
		})

		ai.on('exit', function(code){
			process.stdout.write("\n\n")
			if(err.length>9999) // maybe best to ignore
			{
				reject(err.join("")+"\n")
			}
			else
			{
				resolve(ret.join("")+"\n")
			}
		})

	})
}


