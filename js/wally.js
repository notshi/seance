
const wally=exports

let args = require("minimist")(process.argv.slice(2),{boolean:true})

//console.log(args)

let cmd=args._[0] || "help"

if( cmd=="help" )
{
	console.log(`
wally will process input csv files creating templates for feeding into 
an AI generator and then save the results in an output csv file.

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
