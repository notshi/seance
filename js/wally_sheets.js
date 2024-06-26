
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

let load_sheet=async function(path)
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
const doc = new GoogleSpreadsheet('12rsvB81cRoE5n7mdCpvCjj38OqTFjBSVzJNOfL4ApPY', serviceAccountAuth);

await doc.loadInfo(); // loads document properties and worksheets

	let aaa=[] // array array array of sheets rows columns
	for( let zidx=0 ; zidx<doc.sheetCount ; zidx++ )
	{
		let sheet=doc.sheetsByIndex[zidx]
		await sheet.loadCells()
		let aa=[]
		aaa[zidx]=aa
		for( let yidx=0 ; yidx<sheet.rowCount ; yidx++ )
		{
			let a=[]
			let a_not_empty=false
			for( let xidx=0 ; xidx<sheet.columnCount ; xidx++ )
			{
				let cell=await sheet.getCell(yidx,xidx)
				if( typeof cell.value != "object" )
				{
					a[xidx]=cell.value
					a_not_empty=true
				}
			}
			if( a_not_empty )
			{
				aa[yidx]=a
			}
		}
	}

	return aaa
}

let save_csv=async function(path,rows)
{
	let csvs=csv_stringify( rows )
	await pfs.writeFile( path , csvs )
}

wally_sheets.start=async function(opts)
{
	let rows=await load_sheet("")
	console.log(rows)
}

