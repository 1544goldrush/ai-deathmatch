const GITHUB_PAGE = "https://raw.githubusercontent.com/1544goldrush/ai-deathmatch/main/index.html";
const GROQ = "https://api.groq.com/openai/v1";
export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  const headers = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
  if (request.method === "OPTIONS") return new Response(null,{headers});
  if (url.pathname === "/api/models") {
   if (!env.GROQ_API_KEY) return Response.json({error:"GROQ_API_KEY secret is not configured in this Worker."},{status:500,headers});
   const r = await fetch(GROQ + "/models",{headers:{Authorization:"Bearer "+env.GROQ_API_KEY}});
   return new Response(await r.text(),{status:r.status,headers:{...headers,"Content-Type":"application/json"}});
  }
  if (url.pathname === "/api/chat" && request.method === "POST") {
   if (!env.GROQ_API_KEY) return Response.json({error:"GROQ_API_KEY secret is not configured in this Worker."},{status:500,headers});
   let body;
   try { body = await request.json(); } catch(e) { return Response.json({error:"Invalid JSON request."},{status:400,headers}); }
   if (!body || !body.model || !Array.isArray(body.messages)) return Response.json({error:"A model and messages are required."},{status:400,headers});
   const payload = {model:body.model,messages:body.messages,temperature:typeof body.temperature==="number"?body.temperature:0.7,max_tokens:Math.min(4000,Math.max(64,Number(body.max_tokens)||700))};
   const r = await fetch(GROQ + "/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+env.GROQ_API_KEY,"Content-Type":"application/json"},body:JSON.stringify(payload)});
   return new Response(await r.text(),{status:r.status,headers:{...headers,"Content-Type":"application/json"}});
  }
  if (url.pathname === "/api/health") return Response.json({ok:true,service:"AI DEATHMATCH"}, {headers});
  const page = await fetch(GITHUB_PAGE,{cf:{cacheTtl:60,cacheEverything:true}});
  if (!page.ok) return new Response("AI DEATHMATCH interface could not be loaded from GitHub. Check that index.html exists on the main branch.",{status:502,headers});
  return new Response(page.body,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
 }
};