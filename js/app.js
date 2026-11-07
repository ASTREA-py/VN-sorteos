import {secureRandomInt} from './random.js';
const $ = id => document.getElementById(id);
const STORAGE_KEY='vn-sorteos-v2';
const OLD_KEY='gira-sorteos-v1';
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
const saved=load();
let old={};if(!saved.text){try{old=JSON.parse(localStorage.getItem(OLD_KEY)||'{}')}catch{}}
const state={text:typeof saved.text==='string'?saved.text:(typeof old.text==='string'?old.text:''),target:validCount(saved.target,1),duration:validCount(saved.duration,6),exclude:saved.exclude!==false,dedupe:saved.dedupe!==false,series:1,results:[],used:new Set(),busy:false,screen:'setup'};
const samples=['@evevargas96','@_jazzmincr','@vvargas1107','@kevin','@mateo','@daniel','@sofia','@luna','@elena','@maria','@lucas','@sol'];
function validCount(v,fallback){const n=Number(v);return Number.isInteger(n)&&n>=1&&n<=500? n:fallback}
function parse(text){const a=text.split(/[\r\n,;\t]+/).map(x=>x.trim()).filter(Boolean);return state.dedupe?[...new Map(a.map(x=>[x.toLocaleLowerCase('es'),x])).values()]:a}
function pool(){return parse(state.text).map((name,index)=>({name,id:index})).filter(t=>!state.exclude||!state.used.has(t.id))}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({text:state.text,target:state.target,duration:state.duration,exclude:state.exclude,dedupe:state.dedupe}))}catch{}}
function labelItem(name,active=false){const el=document.createElement('div');el.className='ticker-item'+(active?' active':'');const label=document.createElement('span');label.textContent=name;label.title=name;el.append(label);return el}
function setStill(name){const track=$('tickerTrack');track.replaceChildren();const entries=Array.from({length:7},(_,i)=>i===3?name:(pool().length?pool()[secureRandomInt(pool().length)].name:name));entries.forEach((entry,i)=>track.append(labelItem(entry,i===3)));track.style.transition='none';track.style.transform=`translateY(${135-3*94}px)`}
function renderSetup(){const n=parse(state.text).length;$('listCount').textContent=`${n} nombre${n===1?'':'s'}`;$('startBtn').disabled=n<1||state.busy;$('setupAlert').textContent=n===0?'Agregá al menos un participante para continuar.':state.exclude&&state.target>n?`Solo hay ${n} participantes únicos disponibles para ${state.target} ganadores.`:'';persist()}
function renderDraw(){const available=pool().length;const finished=state.results.length>=state.target;const exhausted=available===0;const limitReached=state.exclude&&state.results.length+available<state.target;$('seriesLabel').textContent=`SERIE ${String(state.series).padStart(2,'0')}`;$('progressLabel').textContent=`${state.results.length} / ${state.target} GANADORES`;$('drawInfo').textContent=`${available} participante${available===1?'':'s'} disponible${available===1?'':'s'} · ${state.target} ganador${state.target===1?'':'es'} por serie`;$('drawBtn').disabled=state.busy||finished||exhausted||limitReached;$('drawBtn').innerHTML=finished?'SERIE FINALIZADA ✓':limitReached?'SIN PARTICIPANTES SUFICIENTES':state.results.length?'SIGUIENTE GANADOR <span>↗</span>':'SORTEAR <span>↗</span>';$('restartBtn').disabled=state.busy;$('backBtn').disabled=state.busy;$('exportBtn').disabled=!state.results.length||state.busy;$('drawStatus').textContent=state.busy?'Buscando ganador…':finished?'¡Serie completada! Podés iniciar una nueva serie.':limitReached?'No quedan suficientes participantes elegibles; iniciá otra serie o cambiá las reglas.':exhausted?'No quedan participantes disponibles.':'Presioná sortear para comenzar.';$('winnerArea').hidden=state.results.length===0;const last=state.results.at(-1);if(last){$('winnerName').textContent=last.name;}const list=$('resultsList');list.replaceChildren(...state.results.map((entry,i)=>{const li=document.createElement('li');const rank=document.createElement('span');rank.className='rank';rank.textContent=String(i+1).padStart(2,'0');const strong=document.createElement('strong');strong.textContent=entry.name;const small=document.createElement('small');small.textContent=new Date(entry.at).toLocaleTimeString('es-PY',{hour:'2-digit',minute:'2-digit'});li.append(rank,strong,small);return li}));$('emptyResults').hidden=state.results.length>0}
function show(which){state.screen=which;$('setupScreen').hidden=which!=='setup';$('drawScreen').hidden=which!=='draw';window.scrollTo(0,0);if(which==='draw'){renderDraw();if(state.results.length===0)setStill('¿Quién ganará?')}else renderSetup()}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function roll(winner,participants){const track=$('tickerTrack');const count=56;const names=Array.from({length:count},(_,i)=>i===count-1?winner.name:participants[secureRandomInt(participants.length)].name);track.replaceChildren(...names.map((name,i)=>labelItem(name,i===count-1)));track.style.transition='none';track.style.transform='translateY(135px)';void track.offsetHeight;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));track.style.transition=`transform ${state.duration}s cubic-bezier(.10,.65,.12,1)`;track.style.transform=`translateY(${135-(count-1)*94}px)`;await sleep(state.duration*1000+100);setStill(winner.name)}
function showWinnerModal(name){
 const finished=state.results.length>=state.target;
 $('modalName').textContent=name;
 $('modalCounter').textContent=`Ganador ${state.results.length} de ${state.target}${finished?' · ¡Serie completada!':''}`;
 $('modalNext').hidden=finished;
 $('modalFinish').hidden=!finished;
 $('winnerModal').hidden=false;
 document.body.classList.add('modal-open');
 (finished?$('modalFinish'):$('modalNext')).focus();
}
function closeWinnerModal(){
 $('winnerModal').hidden=true;
 document.body.classList.remove('modal-open');
 $('drawBtn').focus();
}
async function draw(){if(state.busy||state.results.length>=state.target)return;const active=pool();if(!active.length||state.exclude&&state.results.length+active.length<state.target)return;state.busy=true;renderDraw();const winner=active[secureRandomInt(active.length)];try{await roll(winner,active);state.results.push({name:winner.name,at:new Date().toISOString()});if(state.exclude)state.used.add(winner.id);showWinnerModal(winner.name)}catch(err){console.error(err);$('drawStatus').textContent='Ocurrió un error durante el sorteo.'}finally{state.busy=false;renderDraw()}}
function newSeries(){if(state.busy)return;state.series++;state.results=[];if(!pool().length)state.used.clear();setStill('¿Quién ganará?');renderDraw()}
function refreshAfterInput(){state.text=$('namesInput').value;renderSetup()}
$('namesInput').value=state.text;$('winnersInput').value=state.target;$('durationInput').value=Math.min(12,Math.max(3,state.duration));state.duration=Number($('durationInput').value);$('durationLabel').textContent=`${state.duration} s`;$('excludeInput').checked=state.exclude;$('dedupeInput').checked=state.dedupe;
$('namesInput').addEventListener('input',refreshAfterInput);$('sampleBtn').addEventListener('click',()=>{$('namesInput').value=samples.join('\n');refreshAfterInput()});$('clearBtn').addEventListener('click',()=>{if(state.text&&!confirm('¿Vaciar toda la lista?'))return;$('namesInput').value='';refreshAfterInput()});$('importBtn').addEventListener('click',()=>$('fileInput').click());$('fileInput').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2*1024*1024){alert('Máximo 2 MB por archivo.');e.target.value='';return}try{$('namesInput').value=await f.text();refreshAfterInput()}catch{alert('No se pudo abrir el archivo.')}e.target.value=''});
function updateTarget(n){state.target=Math.max(1,Math.min(500,Number.isFinite(n)?Math.trunc(n):1));$('winnersInput').value=state.target;renderSetup()}
$('plusWinners').addEventListener('click',()=>updateTarget(state.target+1));$('minusWinners').addEventListener('click',()=>updateTarget(state.target-1));$('winnersInput').addEventListener('change',e=>updateTarget(Number(e.target.value)));$('durationInput').addEventListener('input',e=>{state.duration=Number(e.target.value);$('durationLabel').textContent=`${state.duration} s`;persist()});$('excludeInput').addEventListener('change',e=>{state.exclude=e.target.checked;renderSetup()});$('dedupeInput').addEventListener('change',e=>{state.dedupe=e.target.checked;renderSetup()});$('startBtn').addEventListener('click',()=>{if(!parse(state.text).length)return;state.series=1;state.results=[];state.used.clear();show('draw')});$('backBtn').addEventListener('click',()=>show('setup'));$('drawBtn').addEventListener('click',draw);$('restartBtn').addEventListener('click',newSeries);
$('modalNext').addEventListener('click',()=>{closeWinnerModal();draw()});
$('modalFinish').addEventListener('click',closeWinnerModal);
$('modalClose').addEventListener('click',closeWinnerModal);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('winnerModal').hidden)closeWinnerModal()});
$('copyBtn').addEventListener('click',async()=>{const last=state.results.at(-1);if(!last)return;try{await navigator.clipboard.writeText(last.name);$('copyBtn').textContent='Copiado ✓';setTimeout(()=>$('copyBtn').textContent='Copiar',1400)}catch{alert('No se pudo copiar automáticamente.')}});
$('exportBtn').addEventListener('click',()=>{if(!state.results.length)return;const csv='Nº,Usuario,Fecha\r\n'+state.results.map((x,i)=>[i+1,x.name,new Date(x.at).toLocaleString('es-PY')].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`vn-sorteos-serie-${state.series}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('fullscreenBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{alert('No se pudo activar pantalla completa.')}});
renderSetup();
