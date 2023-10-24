
const seance={}
export default seance

import { default as plated_module } from "plated"


seance.start=function(opts)
{
	console.log(plated_module)
	let plated=plated_module.create({})
		
	console.log("SEE YANCE")
	console.log(plated.chunks)
}
