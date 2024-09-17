cd `dirname $0`

rm -rf js/node_modules
npm --prefix js install
npm --prefix js update
