"use strict";(()=>{var e={};e.id=9299,e.ids=[9299],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},4649:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>E,originalPathname:()=>f,patchFetch:()=>g,requestAsyncStorage:()=>u,routeModule:()=>c,serverHooks:()=>y,staticGenerationAsyncStorage:()=>_,staticGenerationBailout:()=>m});var n={};a.r(n),a.d(n,{GET:()=>d,dynamic:()=>p});var s=a(5419),r=a(9108),i=a(9678),o=a(8070),l=a(1494);let p="force-dynamic";async function d(e){let t=e.nextUrl.searchParams,a=t.get("type")||"objects";t.get("format");try{let e,t;let n=await (0,l.N8)();switch(a){case"objects":e=function(e){let t=e.exec(`
    SELECT api_name, label, metadata_json
    FROM nodes
    WHERE type = 'CustomObject'
    ORDER BY api_name
  `),a=e.exec(`
    SELECT
      e.source_id, e.target_id, e.relation_type,
      s.api_name as source_name, s.type as source_type,
      t.api_name as target_name, t.type as target_type
    FROM edges e
    JOIN nodes s ON e.source_id = s.id
    JOIN nodes t ON e.target_id = t.id
    WHERE e.relation_type IN ('Lookup', 'MasterDetail', 'Hierarchy')
    ORDER BY s.api_name
  `),n=["Shape Type,Name,Label,Field Count,Connects From,Connects To,Relationship Type"];return(t[0]?.values||[]).forEach(e=>{let t=e[0],a=e[1]||t,s=(e[2]?JSON.parse(e[2]):{}).fieldCount||0;n.push(`Entity,${t},${a},${s},,`)}),(a[0]?.values||[]).forEach(e=>{let t=e[3],a=e[5],s=e[2];n.push(`Relationship,${t} -> ${a},,${s},${t},${a},${s}`)}),n.join("\n")}(n),t="salesforce-objects-erd.csv";break;case"dependencies":e=function(e){let t=e.exec(`
    SELECT
      s.api_name as source_name, s.type as source_type,
      t.api_name as target_name, t.type as target_type,
      e.relation_type
    FROM edges e
    JOIN nodes s ON e.source_id = s.id
    JOIN nodes t ON e.target_id = t.id
    ORDER BY s.type, s.api_name
  `),a=["Source Name,Source Type,Target Name,Target Type,Relationship"];return(t[0]?.values||[]).forEach(e=>{a.push(`${e[0]},${e[1]},${e[2]},${e[3]},${e[4]}`)}),a.join("\n")}(n),t="salesforce-dependencies.csv";break;case"automation":e=function(e){let t=e.exec(`
    SELECT api_name, type, label, metadata_json
    FROM nodes
    WHERE type IN ('Flow', 'ApexTrigger', 'ProcessBuilder', 'WorkflowRule')
    ORDER BY type, api_name
  `),a=e.exec(`
    SELECT
      s.api_name as automation_name, s.type as automation_type,
      t.api_name as object_name
    FROM edges e
    JOIN nodes s ON e.source_id = s.id
    JOIN nodes t ON e.target_id = t.id
    WHERE s.type IN ('Flow', 'ApexTrigger', 'ProcessBuilder', 'WorkflowRule')
      AND t.type = 'CustomObject'
  `),n=["Automation Name,Type,Label,Status,Target Object,Process Type"],s=t[0]?.values||[],r=a[0]?.values||[],i={};return r.forEach(e=>{let t=e[0],a=e[2];i[t]||(i[t]=[]),i[t].push(a)}),s.forEach(e=>{let t=e[0],a=e[1],s=e[2]||t,r=e[3]?JSON.parse(e[3]):{},o=r.status||"Unknown",l=r.processType||"",p=i[t]?.join("; ")||"";n.push(`${t},${a},${s},${o},${p},${l}`)}),n.join("\n")}(n),t="salesforce-automation.csv";break;case"all":e=function(e){let t=e.exec(`
    SELECT id, api_name, type, label
    FROM nodes
    ORDER BY type, api_name
  `),a=e.exec(`
    SELECT
      s.api_name as source, s.type as source_type,
      t.api_name as target, t.type as target_type,
      e.relation_type
    FROM edges e
    JOIN nodes s ON e.source_id = s.id
    JOIN nodes t ON e.target_id = t.id
  `),n=["Id,Name,Type,Label,Shape"];return(t[0]?.values||[]).forEach(e=>{let t=e[0],a=e[1],s=e[2],r=e[3]||a;n.push(`${t},"${a}","${s}","${r}","${{CustomObject:"Rectangle",CustomField:"RoundedRectangle",Flow:"Diamond",ApexClass:"Parallelogram",ApexTrigger:"Hexagon",LWC:"Circle",Layout:"Document",PermissionSet:"Pentagon"}[s]||"Rectangle"}"`)}),n.push(""),n.push("Source,Target,Relationship,Line Style"),(a[0]?.values||[]).forEach(e=>{let t=e[0],a=e[2],s=e[4];n.push(`"${t}","${a}","${s}","${{Lookup:"Dashed",MasterDetail:"Solid",References:"Dotted",Uses:"Solid"}[s]||"Solid"}"`)}),n.join("\n")}(n),t="salesforce-metadata-complete.csv";break;default:return o.Z.json({error:"Invalid export type"},{status:400})}return new o.Z(e,{headers:{"Content-Type":"text/csv","Content-Disposition":`attachment; filename="${t}"`}})}catch(e){return console.error("Export error:",e),o.Z.json({error:"Export failed"},{status:500})}}let c=new s.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/export/lucidchart/route",pathname:"/api/export/lucidchart",filename:"route",bundlePath:"app/api/export/lucidchart/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\export\\lucidchart\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:u,staticGenerationAsyncStorage:_,serverHooks:y,headerHooks:E,staticGenerationBailout:m}=c,f="/api/export/lucidchart/route";function g(){return(0,i.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:_})}},1494:(e,t,a)=>{a.d(t,{Fu:()=>R,Lw:()=>y,N8:()=>c,YE:()=>m,_P:()=>E,dV:()=>g,fy:()=>u,rZ:()=>f});var n=a(1017),s=a.n(n),r=a(7147),i=a.n(r);let o=(()=>{let e=s().resolve(__dirname,"..","..","..","..");if(i().existsSync(s().join(e,"packages","indexer","data")))return e;let t=process.cwd();return t.endsWith("apps/web")||t.endsWith("apps\\web")?s().resolve(t,"..",".."):i().existsSync(s().join(t,"packages","indexer","data"))?t:s().resolve(t,"..","..")})(),l=s().join(o,"packages","indexer","data","metadata.db"),p=null;async function d(){if(!p){let e=a(470),t=s().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=i().readFileSync(t);p=await e({wasmBinary:n})}return p}async function c(){if(!i().existsSync(l))return console.log("Database not found at:",l),null;let e=await d(),t=i().readFileSync(l);return new e.Database(t)}async function u(){let e=await c();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let t=t=>{let a=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${t}'`);return a[0]?.values[0]?.[0]||0};return{objects:t("Object"),fields:t("Field"),flows:t("Flow"),apexClasses:t("ApexClass"),apexTriggers:t("ApexTrigger"),lwc:t("LWC"),layouts:t("Layout"),permissionSets:t("PermissionSet"),profiles:t("Profile"),flexiPages:t("FlexiPage"),validationRules:t("ValidationRule"),quickActions:t("QuickAction"),recordTypes:t("RecordType")}}finally{e.close()}}function _(e){if(!e||0===e.length)return[];let t=e[0].columns;return e[0].values.map(e=>{let a={};return t.forEach((t,n)=>{a[t]=e[n]}),a})}async function y(e,t){let a=await c();if(!a)return null;try{let n=e.replace(/'/g,"''"),s=t.replace(/'/g,"''"),r=a.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${s}'`);return _(r)[0]||null}finally{a.close()}}async function E(e){let t=await c();if(!t)return[];try{let a=t.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return _(a)}finally{t.close()}}async function m(e){let t=await c();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(a)}finally{t.close()}}async function f(e){let t=await c();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(a)}finally{t.close()}}async function g(e,t=50,a){let n=await c();if(!n)return[];try{let s=e.replace(/'/g,"''"),r=a?.replace(/'/g,"''"),i="";e&&a?i=`WHERE (api_name LIKE '%${s}%' OR label LIKE '%${s}%') AND type = '${r}'`:e?i=`WHERE api_name LIKE '%${s}%' OR label LIKE '%${s}%'`:a&&(i=`WHERE type = '${r}'`);let o=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${i}
      ORDER BY
        CASE WHEN api_name LIKE '${s}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${t}
    `);return _(o)}finally{n.close()}}async function R(e,t=2){let a=await c();if(!a)return{nodes:[],edges:[]};try{let n=new Set,s=[],r=[],i=(e,o)=>{if(n.has(e)||o>t)return;n.add(e);let l=a.exec(`SELECT * FROM nodes WHERE id = ${e}`),p=_(l);if(p[0]){let e=p[0];s.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let d=a.exec(`SELECT * FROM edges WHERE source_id = ${e}`),c=a.exec(`SELECT * FROM edges WHERE target_id = ${e}`),u=_(d),y=_(c);for(let t of[...u,...y]){r.push({id:`${t.source_id}-${t.target_id}-${t.edge_type}`,source:String(t.source_id),target:String(t.target_id),label:t.edge_type.replace(/_/g," "),animated:t.edge_type.includes("FLOW")});let a=t.source_id===e?t.target_id:t.source_id;i(a,o+1)}};i(e,0);let o=Array.from(new Map(r.map(e=>[e.id,e])).values());return{nodes:s,edges:o}}finally{a.close()}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),n=t.X(0,[1638,6206],()=>a(4649));module.exports=n})();