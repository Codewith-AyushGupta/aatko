"use strict";(()=>{var e={};e.id=5711,e.ids=[5711],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},8980:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>f,originalPathname:()=>g,patchFetch:()=>x,requestAsyncStorage:()=>_,routeModule:()=>u,serverHooks:()=>E,staticGenerationAsyncStorage:()=>y,staticGenerationBailout:()=>m});var n={};a.r(n),a.d(n,{GET:()=>d,dynamic:()=>p});var r=a(5419),s=a(9108),i=a(9678),o=a(8070),l=a(1494);let p="force-dynamic";async function d(e){let t=e.nextUrl.searchParams,a=t.get("format")||"csv",n=t.get("types")?.split(",")||["all"],r="false"!==t.get("relationships");try{let e;let t=await (0,l.N8)();if(!t)return o.Z.json({error:"Database not loaded. Please sync metadata first."},{status:400});if("json"===a)return e=function(e,t,a){let n=t.includes("all")?"":`WHERE type IN (${t.map(e=>`'${e}'`).join(",")})`,r=e.exec(`
    SELECT id, api_name, type, label, metadata_json
    FROM nodes
    ${n}
    ORDER BY type, api_name
  `),s={nodes:(r[0]?.values||[]).map(e=>({id:e[0],apiName:e[1],type:e[2],label:e[3]||e[1],metadata:e[4]?JSON.parse(e[4]):{}})),exportDate:new Date().toISOString()};if(a){let t=e.exec(`
      SELECT
        s.api_name as source, s.type as source_type,
        t.api_name as target, t.type as target_type,
        e.relation_type
      FROM edges e
      JOIN nodes s ON e.source_id = s.id
      JOIN nodes t ON e.target_id = t.id
    `);s.relationships=(t[0]?.values||[]).map(e=>({source:e[0],sourceType:e[1],target:e[2],targetType:e[3],relationshipType:e[4]}))}return s}(t,n,r),o.Z.json(e,{headers:{"Content-Disposition":'attachment; filename="salesforce-metadata-export.json"'}});return e=function(e,t,a){let n=t.includes("all")?"":`WHERE type IN (${t.map(e=>`'${e}'`).join(",")})`,r=e.exec(`
    SELECT id, api_name, type, label
    FROM nodes
    ${n}
    ORDER BY type, api_name
  `),s=["Id,API Name,Type,Label"];if((r[0]?.values||[]).forEach(e=>{let t=e[0],a=c(e[1]),n=e[2],r=c(e[3]||e[1]);s.push(`${t},${a},${n},${r}`)}),a){s.push(""),s.push("--- RELATIONSHIPS ---"),s.push("Source,Source Type,Target,Target Type,Relationship");let t=e.exec(`
      SELECT
        s.api_name as source, s.type as source_type,
        t.api_name as target, t.type as target_type,
        e.relation_type
      FROM edges e
      JOIN nodes s ON e.source_id = s.id
      JOIN nodes t ON e.target_id = t.id
    `);(t[0]?.values||[]).forEach(e=>{s.push(`${c(e[0])},${e[1]},${c(e[2])},${e[3]},${e[4]}`)})}return s.join("\n")}(t,n,r),new o.Z(e,{headers:{"Content-Type":"text/csv","Content-Disposition":'attachment; filename="salesforce-metadata-export.csv"'}})}catch(t){console.error("Export error:",t);let e=t instanceof Error?t.message:"Export failed";return o.Z.json({error:e},{status:500})}}function c(e){return e?e.includes(",")||e.includes('"')||e.includes("\n")?`"${e.replace(/"/g,'""')}"`:e:""}let u=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/export/route",pathname:"/api/export",filename:"route",bundlePath:"app/api/export/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\export\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:_,staticGenerationAsyncStorage:y,serverHooks:E,headerHooks:f,staticGenerationBailout:m}=u,g="/api/export/route";function x(){return(0,i.patchFetch)({serverHooks:E,staticGenerationAsyncStorage:y})}},1494:(e,t,a)=>{a.d(t,{Fu:()=>x,Lw:()=>y,N8:()=>c,YE:()=>f,_P:()=>E,dV:()=>g,fy:()=>u,rZ:()=>m});var n=a(1017),r=a.n(n),s=a(7147),i=a.n(s);let o=(()=>{let e=r().resolve(__dirname,"..","..","..","..");if(i().existsSync(r().join(e,"packages","indexer","data")))return e;let t=process.cwd();return t.endsWith("apps/web")||t.endsWith("apps\\web")?r().resolve(t,"..",".."):i().existsSync(r().join(t,"packages","indexer","data"))?t:r().resolve(t,"..","..")})(),l=r().join(o,"packages","indexer","data","metadata.db"),p=null;async function d(){if(!p){let e=a(470),t=r().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=i().readFileSync(t);p=await e({wasmBinary:n})}return p}async function c(){if(!i().existsSync(l))return console.log("Database not found at:",l),null;let e=await d(),t=i().readFileSync(l);return new e.Database(t)}async function u(){let e=await c();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let t=t=>{let a=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${t}'`);return a[0]?.values[0]?.[0]||0};return{objects:t("Object"),fields:t("Field"),flows:t("Flow"),apexClasses:t("ApexClass"),apexTriggers:t("ApexTrigger"),lwc:t("LWC"),layouts:t("Layout"),permissionSets:t("PermissionSet"),profiles:t("Profile"),flexiPages:t("FlexiPage"),validationRules:t("ValidationRule"),quickActions:t("QuickAction"),recordTypes:t("RecordType")}}finally{e.close()}}function _(e){if(!e||0===e.length)return[];let t=e[0].columns;return e[0].values.map(e=>{let a={};return t.forEach((t,n)=>{a[t]=e[n]}),a})}async function y(e,t){let a=await c();if(!a)return null;try{let n=e.replace(/'/g,"''"),r=t.replace(/'/g,"''"),s=a.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${r}'`);return _(s)[0]||null}finally{a.close()}}async function E(e){let t=await c();if(!t)return[];try{let a=t.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return _(a)}finally{t.close()}}async function f(e){let t=await c();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(a)}finally{t.close()}}async function m(e){let t=await c();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(a)}finally{t.close()}}async function g(e,t=50,a){let n=await c();if(!n)return[];try{let r=e.replace(/'/g,"''"),s=a?.replace(/'/g,"''"),i="";e&&a?i=`WHERE (api_name LIKE '%${r}%' OR label LIKE '%${r}%') AND type = '${s}'`:e?i=`WHERE api_name LIKE '%${r}%' OR label LIKE '%${r}%'`:a&&(i=`WHERE type = '${s}'`);let o=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${i}
      ORDER BY
        CASE WHEN api_name LIKE '${r}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${t}
    `);return _(o)}finally{n.close()}}async function x(e,t=2){let a=await c();if(!a)return{nodes:[],edges:[]};try{let n=new Set,r=[],s=[],i=(e,o)=>{if(n.has(e)||o>t)return;n.add(e);let l=a.exec(`SELECT * FROM nodes WHERE id = ${e}`),p=_(l);if(p[0]){let e=p[0];r.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let d=a.exec(`SELECT * FROM edges WHERE source_id = ${e}`),c=a.exec(`SELECT * FROM edges WHERE target_id = ${e}`),u=_(d),y=_(c);for(let t of[...u,...y]){s.push({id:`${t.source_id}-${t.target_id}-${t.edge_type}`,source:String(t.source_id),target:String(t.target_id),label:t.edge_type.replace(/_/g," "),animated:t.edge_type.includes("FLOW")});let a=t.source_id===e?t.target_id:t.source_id;i(a,o+1)}};i(e,0);let o=Array.from(new Map(s.map(e=>[e.id,e])).values());return{nodes:r,edges:o}}finally{a.close()}}}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),n=t.X(0,[1638,6206],()=>a(8980));module.exports=n})();