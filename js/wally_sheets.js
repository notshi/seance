
const wally_sheets={}
export default wally_sheets


import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';


import { parse as csv_parse } from "csv-parse/sync"
import { stringify as csv_stringify } from "csv-stringify/sync"
import pfs from "node:fs/promises"
import path from "path"


let load_csv=async function(path)
{
	let data=await pfs.readFile(path,"utf8")
	let csv=csv_parse(data,{relax_column_count:true,columns:true})
	return csv
}
let save_csv=async function(path,rows)
{
	let csvs=csv_stringify( rows )
	await pfs.writeFile( path , csvs )
}


wally_sheets.load_doc=async function(id)
{
	// Initialize auth - see https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
	const serviceAccountAuth = new JWT({
	  // env var values here are copied from service account credentials generated by google
	  // see "Authentication" section in docs for more info
	  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
	  key: process.env.GOOGLE_PRIVATE_KEY,
	  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
	});

// console.log( process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL )
// console.log( process.env.GOOGLE_PRIVATE_KEY )

	// sheet must be shared with process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL for this to work
	const doc = new GoogleSpreadsheet(id, serviceAccountAuth);

	await doc.loadInfo(); // loads document properties and worksheets

	return doc
}


wally_sheets.load_sheet=async function(sheet)
{
	await sheet.loadCells()
	let maxy=0
	let rows=[]
	for( let yidx=0 ; yidx<sheet.rowCount ; yidx++ )
	{
		let row=[]
		let maxx=0
		for( let xidx=0 ; xidx<sheet.columnCount ; xidx++ )
		{
			let cell=sheet.getCell(yidx,xidx)
			if( typeof cell.value != "object" ) // empty check
			{
				row[xidx]=cell.value // may be string or number or bool
				maxx=xidx+1
			}
		}
		for( let xidx=0 ; xidx<maxx ; xidx++ ) { if(!row[xidx]) { row[xidx]=[] } } //fill holes
		if( maxx>0 )
		{
			rows[yidx]=row
			maxy=yidx+1
		}
	}
	for( let yidx=0 ; yidx<maxy ; yidx++ ) { if(!rows[yidx]) { rows[yidx]=[] } } //fill holes
	return rows
}

wally_sheets.merge_sheet=async function(sheet,rows)
{
	let base=wally_sheets.load_sheet(sheet)

	// find first match
	let find=function(row)
	{
		for(let i=1;i<base.length;i++)
		{
			let a=base[i]
			if( a[0]==row[0] && a[1]==row[1] )
			{
				return a
			}
		}
		return null
	}

	let addrows=[]
	for(let ai=1;ai<rows.length;ai++)
	{
		let row=rows[ai]
		let idx=find(row)
		if( !idx ) // add new lines
		{
			addrows[addrows.length]=row
		}
		else // update old line
		{
			for(let i=2;i<row.length;i++)
			{
				let cell=sheet.getCell(idx,i)
				cell.value=row[i]
			}
		}
	}
	await sheet.saveUpdatedCells();
	if(addrows.length>0)
	{
		sheet.addRows(addrows)
	}
}

wally_sheets.start=async function(opts)
{
	let doc=await wally_sheets.load_doc("12rsvB81cRoE5n7mdCpvCjj38OqTFjBSVzJNOfL4ApPY")
	for(let page of ["text","letter"])
	{
		let sheet=doc.sheetsByTitle[page]
		let rows=await wally_sheets.load_sheet(sheet)
		await save_csv( opts.dirname+"/csv/sheets/"+page+".csv" , rows )
	}
}

