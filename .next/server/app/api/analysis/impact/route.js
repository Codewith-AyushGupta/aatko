"use strict";(()=>{var e={};e.id=3585,e.ids=[3585],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},3745:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>E,originalPathname:()=>g,patchFetch:()=>m,requestAsyncStorage:()=>u,routeModule:()=>c,serverHooks:()=>_,staticGenerationAsyncStorage:()=>y,staticGenerationBailout:()=>f});var n={};a.r(n),a.d(n,{GET:()=>p,dynamic:()=>d});var i=a(5419),r=a(9108),s=a(9678),l=a(8070),o=a(1494);let d="force-dynamic";async function p(e){let t=e.nextUrl.searchParams,a=t.get("nodeId"),n=parseInt(t.get("depth")||"2");if(!a)return l.Z.json({error:"nodeId is required"},{status:400});try{let e;let t=await (0,o.N8)();if(!t)return l.Z.json({error:"Database not available"},{status:500});let i=t.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      WHERE id = ${a}
    `);if(!i[0]?.values?.length)return t.close(),l.Z.json({error:"Node not found"},{status:404});let r=i[0].values[0],s={id:r[0],apiName:r[1],label:r[2],type:r[3]},d=[],p=new Set,c=parseInt(a),u=(e,a)=>{if(a>n||0===e.length)return;let i=e.join(","),r=t.exec(`
        SELECT DISTINCT n.id, n.api_name, n.label, n.type, e.edge_type
        FROM edges e
        JOIN nodes n ON e.source_id = n.id
        WHERE e.target_id IN (${i})
          AND e.source_id != ${c}
      `),s=[];(r[0]?.values||[]).forEach(e=>{let t=e[0];p.has(t)||(p.add(t),d.push({id:t,apiName:e[1],label:e[2],type:e[3],edgeType:e[4],depth:a}),s.push(t))}),s.length>0&&u(s,a+1)},y=[],_=new Set,E=(e,a)=>{if(a>n||0===e.length)return;let i=e.join(","),r=t.exec(`
        SELECT DISTINCT n.id, n.api_name, n.label, n.type, e.edge_type
        FROM edges e
        JOIN nodes n ON e.target_id = n.id
        WHERE e.source_id IN (${i})
          AND e.target_id != ${c}
      `),s=[];(r[0]?.values||[]).forEach(e=>{let t=e[0];_.has(t)||(_.add(t),y.push({id:t,apiName:e[1],label:e[2],type:e[3],edgeType:e[4],depth:a}),s.push(t))}),s.length>0&&E(s,a+1)};u([c],1),E([c],1),t.close();let f={},g={};d.forEach(e=>{f[e.type]=(f[e.type]||0)+1}),y.forEach(e=>{g[e.type]=(g[e.type]||0)+1});let m=["Flow","ApexClass","ApexTrigger","LWC"],h=d.filter(e=>1===e.depth&&m.includes(e.type)).map(e=>`${e.type}: ${e.apiName}`),R=0,x=d.filter(e=>1===e.depth).length;R+=Math.min(10*x,40)+Math.min(15*h.length,30)+Math.min(2*d.length,20),"Object"===s.type&&(R+=10),("ApexClass"===s.type||"ApexTrigger"===s.type)&&(R+=5),e=(R=Math.min(R,100))>=75?"critical":R>=50?"high":R>=25?"medium":"low";let N={item:s,dependents:d,dependencies:y,riskScore:R,riskLevel:e,summary:{totalDependents:d.length,totalDependencies:y.length,dependentsByType:f,dependenciesByType:g,criticalDependents:h}};return l.Z.json(N)}catch(e){return console.error("Error analyzing impact:",e),l.Z.json({error:"Failed to analyze impact"},{status:500})}}let c=new i.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/analysis/impact/route",pathname:"/api/analysis/impact",filename:"route",bundlePath:"app/api/analysis/impact/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\analysis\\impact\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:u,staticGenerationAsyncStorage:y,serverHooks:_,headerHooks:E,staticGenerationBailout:f}=c,g="/api/analysis/impact/route";function m(){return(0,s.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:y})}},1494:(e,t,a)=>{a.d(t,{Fu:()=>h,Lw:()=>_,N8:()=>c,YE:()=>f,_P:()=>E,dV:()=>m,fy:()=>u,rZ:()=>g});var n=a(1017),i=a.n(n),r=a(7147),s=a.n(r);let l=(()=>{let e=i().resolve(__dirname,"..","..","..","..");if(s().existsSync(i().join(e,"packages","indexer","data")))return e;let t=process.cwd();return t.endsWith("apps/web")||t.endsWith("apps\\web")?i().resolve(t,"..",".."):s().existsSync(i().join(t,"packages","indexer","data"))?t:i().resolve(t,"..","..")})(),o=i().join(l,"packages","indexer","data","metadata.db"),d=null;async function p(){if(!d){let e=a(470),t=i().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=s().readFileSync(t);d=await e({wasmBinary:n})}return d}async function c(){if(!s().existsSync(o))return console.log("Database not found at:",o),null;let e=await p(),t=s().readFileSync(o);return new e.Database(t)}async function u(){let e=await c();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let t=t=>{let a=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${t}'`);return a[0]?.values[0]?.[0]||0};return{objects:t("Object"),fields:t("Field"),flows:t("Flow"),apexClasses:t("ApexClass"),apexTriggers:t("ApexTrigger"),lwc:t("LWC"),layouts:t("Layout"),permissionSets:t("PermissionSet"),profiles:t("Profile"),flexiPages:t("FlexiPage"),validationRules:t("ValidationRule"),quickActions:t("QuickAction"),recordTypes:t("RecordType")}}finally{e.close()}}function y(e){if(!e||0===e.length)return[];let t=e[0].columns;return e[0].values.map(e=>{let a={};return t.forEach((t,n)=>{a[t]=e[n]}),a})}async function _(e,t){let a=await c();if(!a)return null;try{let n=e.replace(/'/g,"''"),i=t.replace(/'/g,"''"),r=a.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${i}'`);return y(r)[0]||null}finally{a.close()}}async function E(e){let t=await c();if(!t)return[];try{let a=t.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return y(a)}finally{t.close()}}async function f(e){let t=await c();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return y(a)}finally{t.close()}}async function g(e){let t=await c();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return y(a)}finally{t.close()}}async function m(e,t=50,a){let n=await c();if(!n)return[];try{let i=e.replace(/'/g,"''"),r=a?.replace(/'/g,"''"),s="";e&&a?s=`WHERE (api_name LIKE '%${i}%' OR label LIKE '%${i}%') AND type = '${r}'`:e?s=`WHERE api_name LIKE '%${i}%' OR label LIKE '%${i}%'`:a&&(s=`WHERE type = '${r}'`);let l=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${s}
      ORDER BY
        CASE WHEN api_name LIKE '${i}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${t}
    `);return y(l)}finally{n.close()}}async function h(e,t=2){let a=await c();if(!a)return{nodes:[],edges:[]};try{let n=new Set,i=[],r=[],s=(e,l)=>{if(n.has(e)||l>t)return;n.add(e);let o=a.exec(`SELECT * FROM nodes WHERE id = ${e}`),d=y(o);if(d[0]){let e=d[0];i.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let p=a.exec(`SELECT * FROM edges WHERE source_id = ${e}`),c=a.exec(`SELECT * FROM edges WHERE target_id = ${e}`),u=y(p),_=y(c);for(let t of[...u,..._]){r.push({id:`${t.source_id}-${t.target_id}-${t.edge_type}`,source:String(t.source_id),target:String(t.target_id),label:t.edge_type.replace(/_/g," "),animated:t.edge_type.includes("FLOW")});let a=t.source_id===e?t.target_id:t.source_id;s(a,l+1)}};s(e,0);let l=Array.from(new Map(r.map(e=>[e.id,e])).values());return{nodes:i,edges:l}}finally{a.close()}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),n=t.X(0,[1638,6206],()=>a(3745));module.exports=n})();