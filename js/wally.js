
const wally=exports

let args = require("minimist")(process.argv.slice(2),{boolean:true})

//console.log(args)

let cmd=args._[0] || "help"

if( cmd=="help" )
{
	console.log(`
wally
	Feed input csv files and templates into an AI generator and record 
	results in an output csv file. 

wally work
	Do some work.

wally help
	Print this help message.
`)
}
else
if( cmd=="work" )
{
}
else
{
	console.log(` Unknown wally command "${cmd}" `)
}
