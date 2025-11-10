import {MovReader} from '../src/js/MovReader.js';
import {readFileSync} from 'fs';


for (const arg of process.argv.slice(2)) {
    console.log(arg);
    const data = readFileSync(arg);
    console.log(`data file is ${data.length} bytes`);
    //console.log({'header': String.fromCharCode(...Array.from(data).slice(0, 16))});
    const options = {};
    const reader = new MovReader({
        //
    });
    reader.appendData(data);
}
