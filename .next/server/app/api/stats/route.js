"use strict";(()=>{var e={};e.id=2961,e.ids=[2961],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},6791:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>E,originalPathname:()=>m,patchFetch:()=>g,requestAsyncStorage:()=>u,routeModule:()=>p,serverHooks:()=>y,staticGenerationAsyncStorage:()=>_,staticGenerationBailout:()=>f});var n={};a.r(n),a.d(n,{GET:()=>c,dynamic:()=>d});var r=a(5419),i=a(9108),s=a(9678),l=a(8070),o=a(1494);let d="force-dynamic";async function c(){try{let e=await (0,o.fy)();return l.Z.json(e)}catch(e){return console.error("Stats error:",e),l.Z.json({error:"Failed to get stats"},{status:500})}}let p=new r.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/stats/route",pathname:"/api/stats",filename:"route",bundlePath:"app/api/stats/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\stats\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:u,staticGenerationAsyncStorage:_,serverHooks:y,headerHooks:E,staticGenerationBailout:f}=p,m="/api/stats/route";function g(){return(0,s.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:_})}},1494:(e,t,a)=>{a.d(t,{Fu:()=>R,Lw:()=>y,N8:()=>p,YE:()=>f,_P:()=>E,dV:()=>g,fy:()=>u,rZ:()=>m});var n=a(1017),r=a.n(n),i=a(7147),s=a.n(i);let l=(()=>{let e=r().resolve(__dirname,"..","..","..","..");if(s().existsSync(r().join(e,"packages","indexer","data")))return e;let t=process.cwd();return t.endsWith("apps/web")||t.endsWith("apps\\web")?r().resolve(t,"..",".."):s().existsSync(r().join(t,"packages","indexer","data"))?t:r().resolve(t,"..","..")})(),o=r().join(l,"packages","indexer","data","metadata.db"),d=null;async function c(){if(!d){let e=a(470),t=r().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=s().readFileSync(t);d=await e({wasmBinary:n})}return d}async function p(){if(!s().existsSync(o))return console.log("Database not found at:",o),null;let e=await c(),t=s().readFileSync(o);return new e.Database(t)}async function u(){let e=await p();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let t=t=>{let a=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${t}'`);return a[0]?.values[0]?.[0]||0};return{objects:t("Object"),fields:t("Field"),flows:t("Flow"),apexClasses:t("ApexClass"),apexTriggers:t("ApexTrigger"),lwc:t("LWC"),layouts:t("Layout"),permissionSets:t("PermissionSet"),profiles:t("Profile"),flexiPages:t("FlexiPage"),validationRules:t("ValidationRule"),quickActions:t("QuickAction"),recordTypes:t("RecordType")}}finally{e.close()}}function _(e){if(!e||0===e.length)return[];let t=e[0].columns;return e[0].values.map(e=>{let a={};return t.forEach((t,n)=>{a[t]=e[n]}),a})}async function y(e,t){let a=await p();if(!a)return null;try{let n=e.replace(/'/g,"''"),r=t.replace(/'/g,"''"),i=a.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${r}'`);return _(i)[0]||null}finally{a.close()}}async function E(e){let t=await p();if(!t)return[];try{let a=t.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return _(a)}finally{t.close()}}async function f(e){let t=await p();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(a)}finally{t.close()}}async function m(e){let t=await p();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(a)}finally{t.close()}}async function g(e,t=50,a){let n=await p();if(!n)return[];try{let r=e.replace(/'/g,"''"),i=a?.replace(/'/g,"''"),s="";e&&a?s=`WHERE (api_name LIKE '%${r}%' OR label LIKE '%${r}%') AND type = '${i}'`:e?s=`WHERE api_name LIKE '%${r}%' OR label LIKE '%${r}%'`:a&&(s=`WHERE type = '${i}'`);let l=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${s}
      ORDER BY
        CASE WHEN api_name LIKE '${r}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${t}
    `);return _(l)}finally{n.close()}}async function R(e,t=2){let a=await p();if(!a)return{nodes:[],edges:[]};try{let n=new Set,r=[],i=[],s=(e,l)=>{if(n.has(e)||l>t)return;n.add(e);let o=a.exec(`SELECT * FROM nodes WHERE id = ${e}`),d=_(o);if(d[0]){let e=d[0];r.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let c=a.exec(`SELECT * FROM edges WHERE source_id = ${e}`),p=a.exec(`SELECT * FROM edges WHERE target_id = ${e}`),u=_(c),y=_(p);for(let t of[...u,...y]){i.push({id:`${t.source_id}-${t.target_id}-${t.edge_type}`,source:String(t.source_id),target:String(t.target_id),label:t.edge_type.replace(/_/g," "),animated:t.edge_type.includes("FLOW")});let a=t.source_id===e?t.target_id:t.source_id;s(a,l+1)}};s(e,0);let l=Array.from(new Map(i.map(e=>[e.id,e])).values());return{nodes:r,edges:l}}finally{a.close()}}}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),n=t.X(0,[1638,6206],()=>a(6791));module.exports=n})();