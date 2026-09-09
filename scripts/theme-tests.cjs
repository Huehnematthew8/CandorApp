const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const h=fs.readFileSync(path.join(__dirname,'..','app.html'),'utf8');const code=h.slice(h.indexOf('/* ---------------- Theme ---------------- */'),h.indexOf('/* ---------------- Init ---------------- */'));
let passes=0;
for(const [initial,expected] of [[null,'light'],['light','light'],['dark','dark'],['invalid','light']]){
 const data=new Map(initial===null?[]:[['candor.appearance.v1',initial]]),nodes={};const ctx=vm.createContext({document:{documentElement:{dataset:{}}},localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},$:k=>nodes[k]||(nodes[k]={}),toast:()=>{}});
 vm.runInContext(code+';applyTheme(savedTheme());',ctx);assert.equal(ctx.document.documentElement.dataset.theme,expected);
 vm.runInContext('toggleTheme();',ctx);assert.equal(data.get('candor.appearance.v1'),expected==='dark'?'light':'dark');vm.runInContext('applyTheme(savedTheme());',ctx);assert.equal(ctx.document.documentElement.dataset.theme,data.get('candor.appearance.v1'));assert.equal(data.size,1);passes++;
}
const msgs=[],ctx=vm.createContext({document:{documentElement:{dataset:{theme:'light'}}},localStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},$:()=>null,toast:x=>msgs.push(x)});vm.runInContext(code+';applyTheme(savedTheme());toggleTheme();',ctx);assert.equal(ctx.document.documentElement.dataset.theme,'dark');assert(msgs[0].includes('could not save'));passes++;
assert(!h.includes("applyTheme(prefersDark"));console.log(passes+' appearance preference checks passed.');
