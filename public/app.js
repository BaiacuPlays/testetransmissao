const $=id=>document.getElementById(id);
const state={peer:null,call:null,stream:null,role:null,room:null};

function render(){
$("app").innerHTML=`<div class="app">
<aside class="servers"><div class="server active">SC</div><div class="server">+</div></aside>
<aside class="side"><div class="brand">ScreenCord</div><div class="room"><span id="roomName">Nenhuma sala</span><button id="copy">⧉</button></div>
<div class="label">TRANSMISSÃO</div><div class="channel active">▣ &nbsp; Tela</div>
<div class="label">USUÁRIOS</div><div class="user"><i class="avatar">VC</i><span id="role">Você</span></div>
<div class="me"><i class="avatar">VC</i><div><b>Você</b><small id="conn">Desconectado</small></div><button id="leave">↪</button></div></aside>
<main><header><div><h1><span>#</span> tela</h1><small id="status">Crie ou entre em uma sala.</small></div><div class="actions"><button id="create" class="primary">Criar sala</button><button id="join">Entrar</button></div></header>
<section id="welcome" class="welcome"><div class="bigicon">▣</div><h2>Compartilhe sua tela</h2><p>Uma sala simples para transmitir sua tela para outras pessoas.</p>
<div class="joinbox"><input id="quickRoom" maxlength="32" placeholder="Código da sala"><button id="quickJoin" class="primary">Entrar na sala</button></div>
<div class="privacy"><b>🔒 Áudio desativado</b><span>O navegador não é solicitado a capturar áudio. O áudio do Discord fica separado.</span></div></section>
<section id="stage" class="stage hidden"><div class="video"><video id="screen" autoplay playsinline></video><div id="empty" class="empty"><strong>Aguardando transmissão</strong><small>O transmissor ainda não começou.</small></div><div id="live" class="live">● AO VIVO</div></div>
<div id="controls" class="controls hidden"><button id="share" class="primary">Compartilhar tela</button><button id="stop" class="danger hidden">Parar transmissão</button><span>🎙 Sem captura de áudio</span></div></section></main></div>
<div id="modal" class="modal hidden"><div class="card"><h2 id="mtitle">Entrar</h2><p id="mtext">Código da sala:</p><input id="mroom" maxlength="32" placeholder="sala-123"><div class="buttons"><button id="cancel">Cancelar</button><button id="ok" class="primary">Continuar</button></div></div></div>`;
bind();
}

function status(x){$("status").textContent=x}
function modal(role){$("modal").classList.remove("hidden");$("mroom").value="";$("mroom").focus();$("ok").dataset.role=role;$("mtitle").textContent=role==="host"?"Criar uma sala":"Entrar em uma sala";$("mtext").textContent=role==="host"?"Escolha um código para sua sala.":"Digite o código da sala."}
function makeId(room){return "screencord-"+room.toLowerCase().replace(/[^a-z0-9_-]/g,"-").slice(0,45)}
function showStage(){ $("welcome").classList.add("hidden");$("stage").classList.remove("hidden");$("roomName").textContent=state.room;$("role").textContent=state.role==="host"?"Você · transmissor":"Você · espectador";$("conn").textContent="Conectado" }

function connect(room,role){
 state.room=room.trim();state.role=role;if(!state.room)return;
 showStage();status(role==="host"?"Sala criada. Clique em Compartilhar tela.":"Conectando ao transmissor...");
 const id=makeId(state.room);
 state.peer=new Peer(role==="host"?id:undefined,{debug:0});
 state.peer.on("open",()=>{
   $("conn").textContent="Conectado";
   if(role==="viewer") callHost(id);
 });
 state.peer.on("error",e=>{
   console.error(e);
   if(e.type==="unavailable-id") status("Esse código de sala já está em uso.");
   else status("Não foi possível conectar. Tente outro código.");
 });
 if(role==="host"){
   state.peer.on("call",call=>{
     if(!state.stream){call.close();return}
     state.call=call;call.answer(state.stream);
     call.on("close",()=>{});
   });
   $("controls").classList.remove("hidden");
 }
}
function callHost(id){
 const call=state.peer.call(id,new MediaStream());
 if(!call){status("Transmissor não encontrado.");return}
 state.call=call;
 call.on("stream",stream=>{const v=$("screen");v.srcObject=stream;v.style.display="block";$("empty").style.display="none";$("live").style.display="block";status("Transmissão ao vivo.")});
 call.on("close",()=>remoteStop());
 call.on("error",()=>status("Conexão encerrada."));
}
async function share(){
 try{
   // No audio track is requested. Discord/system audio is not captured.
   state.stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:60,max:60}},audio:false});
   state.stream.getVideoTracks()[0].onended=stop;
   const v=$("screen");v.srcObject=state.stream;v.style.display="block";$("empty").style.display="none";$("live").style.display="block";
   $("share").classList.add("hidden");$("stop").classList.remove("hidden");status("Transmitindo sua tela. Áudio não está sendo capturado.");
 }catch(e){status("A captura de tela foi cancelada.")}
}
function stop(){
 state.stream?.getTracks().forEach(t=>t.stop());state.stream=null;
 state.call?.close();state.call=null;
 const v=$("screen");v.srcObject=null;v.style.display="none";$("empty").style.display="flex";$("live").style.display="none";
 $("share")?.classList.remove("hidden");$("stop")?.classList.add("hidden");status("Transmissão encerrada.");
}
function remoteStop(){state.call=null;const v=$("screen");v.srcObject=null;v.style.display="none";$("empty").style.display="flex";$("live").style.display="none";status("Transmissão encerrada pelo transmissor.")}
function bind(){
 $("create").onclick=()=>modal("host");$("join").onclick=()=>modal("viewer");$("cancel").onclick=()=>$("modal").classList.add("hidden");
 $("ok").onclick=()=>{const v=$("mroom").value.trim();if(v){$("modal").classList.add("hidden");connect(v,$("ok").dataset.role)}};
 $("mroom").onkeydown=e=>e.key==="Enter"&&$("ok").click();
 $("quickJoin").onclick=()=>{const v=$("quickRoom").value.trim();if(v)connect(v,"viewer")};
 $("share").onclick=share;$("stop").onclick=stop;
 $("copy").onclick=async()=>{if(state.room){await navigator.clipboard.writeText(location.origin+"?room="+encodeURIComponent(state.room));status("Link da sala copiado.")}};
 $("leave").onclick=()=>{stop();state.peer?.destroy();location.reload()};
 const room=new URLSearchParams(location.search).get("room");if(room)$("quickRoom").value=room;
}
render();

const qs=new URLSearchParams(location.search);
if(qs.get("room")) status("Link de sala detectado. Clique em Entrar para assistir.");
