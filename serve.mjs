import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';

const root=fileURLToPath(new URL('./dist/',import.meta.url));
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
const server=createServer(async(request,response)=>{
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{Allow:'GET, HEAD'});response.end();return;}
  try{
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const filename=resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if(!filename.startsWith(resolve(root)+sep)){response.writeHead(403);response.end('Forbidden');return;}
    const info=await stat(filename);
    if(!info.isFile()){response.writeHead(404);response.end('Not found');return;}
    response.writeHead(200,{'Content-Type':types[extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Content-Length':info.size});
    response.end(request.method==='HEAD'?undefined:await readFile(filename));
  }catch(error){response.writeHead(error instanceof URIError?400:404);response.end('Not found');}
});
server.on('error',error=>{console.error(`미리보기를 시작할 수 없습니다: ${error.message}`);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`AFM Lab: http://127.0.0.1:${port}/`));
