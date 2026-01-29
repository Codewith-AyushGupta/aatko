"use strict";(()=>{var e={};e.id=5118,e.ids=[5118],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},2138:(e,a,t)=>{t.r(a),t.d(a,{headerHooks:()=>f,originalPathname:()=>m,patchFetch:()=>g,requestAsyncStorage:()=>u,routeModule:()=>c,serverHooks:()=>_,staticGenerationAsyncStorage:()=>E,staticGenerationBailout:()=>y});var n={};t.r(n),t.d(n,{GET:()=>d,dynamic:()=>p});var i=t(5419),r=t(9108),l=t(9678),s=t(8070),o=t(1494);let p="force-dynamic";async function d(e){let a=e.nextUrl.searchParams,t=a.get("object")||"",n=a.get("sortBy")||"population",i=a.get("sortOrder")||"asc";try{let e=await (0,o.N8)();if(!e)return s.Z.json({error:"Database not available"},{status:500});let a="";t&&(a=`AND parent.api_name = '${t.replace(/'/g,"''")}'`);let r=e.exec(`
      SELECT
        f.id,
        f.api_name as field_name,
        f.label as field_label,
        f.metadata_json,
        parent.api_name as object_name,
        parent.label as object_label,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count
      FROM nodes f
      JOIN nodes parent ON f.parent_id = parent.id
      LEFT JOIN analytics a ON f.id = a.node_id
      WHERE f.type = 'Field'
        AND f.api_name LIKE '%__c'
        ${a}
      GROUP BY f.id
      ORDER BY
        CASE WHEN '${n}' = 'population' AND '${i}' = 'asc' THEN COALESCE(MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END), 0) END ASC,
        CASE WHEN '${n}' = 'population' AND '${i}' = 'desc' THEN COALESCE(MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END), 0) END DESC,
        CASE WHEN '${n}' = 'name' AND '${i}' = 'asc' THEN f.api_name END ASC,
        CASE WHEN '${n}' = 'name' AND '${i}' = 'desc' THEN f.api_name END DESC,
        CASE WHEN '${n}' = 'object' AND '${i}' = 'asc' THEN parent.api_name END ASC,
        CASE WHEN '${n}' = 'object' AND '${i}' = 'desc' THEN parent.api_name END DESC,
        parent.api_name, f.api_name
      LIMIT 1000
    `),l=[],p={};for(let a of r[0]?.values||[]){let t=a[0],n=a[1],i=a[2],r=a[3],s=a[4],o=a[5],d=a[6],c=a[7],u=null,E=!1;if(r)try{let e=JSON.parse(r);u=e.type||null,E=!0===e.required}catch{}let _=e.exec(`
        SELECT COUNT(DISTINCT source_id) FROM edges WHERE target_id = ${t}
      `),f=_[0]?.values[0]?.[0]||0;l.push({id:t,fieldName:n,fieldLabel:i,objectName:s,objectLabel:o,populationRate:d,recordCount:c,dependentCount:f,isRequired:E,fieldType:u}),p[s]||(p[s]={total:0,empty:0,lowUsage:0}),p[s].total++,0===d?p[s].empty++:null!==d&&d<.1&&p[s].lowUsage++}e.close();let d=l.filter(e=>null!==e.populationRate&&e.populationRate>0).length,c=l.filter(e=>0===e.populationRate).length,u=l.filter(e=>null!==e.populationRate&&e.populationRate>0&&e.populationRate<.1).length,E=l.filter(e=>null!==e.populationRate).map(e=>e.populationRate),_=E.length>0?E.reduce((e,a)=>e+a,0)/E.length:0,f={fields:l,summary:{totalFields:l.length,fieldsWithData:d,emptyFields:c,lowUsageFields:u,averagePopulation:_,byObject:p}};return s.Z.json(f)}catch(e){return console.error("Field usage analysis error:",e),s.Z.json({error:"Failed to analyze field usage"},{status:500})}}let c=new i.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/tools/field-usage/route",pathname:"/api/tools/field-usage",filename:"route",bundlePath:"app/api/tools/field-usage/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\tools\\field-usage\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:u,staticGenerationAsyncStorage:E,serverHooks:_,headerHooks:f,staticGenerationBailout:y}=c,m="/api/tools/field-usage/route";function g(){return(0,l.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:E})}},1494:(e,a,t)=>{t.d(a,{Fu:()=>N,Lw:()=>_,N8:()=>c,YE:()=>y,_P:()=>f,dV:()=>g,fy:()=>u,rZ:()=>m});var n=t(1017),i=t.n(n),r=t(7147),l=t.n(r);let s=(()=>{let e=i().resolve(__dirname,"..","..","..","..");if(l().existsSync(i().join(e,"packages","indexer","data")))return e;let a=process.cwd();return a.endsWith("apps/web")||a.endsWith("apps\\web")?i().resolve(a,"..",".."):l().existsSync(i().join(a,"packages","indexer","data"))?a:i().resolve(a,"..","..")})(),o=i().join(s,"packages","indexer","data","metadata.db"),p=null;async function d(){if(!p){let e=t(470),a=i().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=l().readFileSync(a);p=await e({wasmBinary:n})}return p}async function c(){if(!l().existsSync(o))return console.log("Database not found at:",o),null;let e=await d(),a=l().readFileSync(o);return new e.Database(a)}async function u(){let e=await c();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let a=a=>{let t=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${a}'`);return t[0]?.values[0]?.[0]||0};return{objects:a("Object"),fields:a("Field"),flows:a("Flow"),apexClasses:a("ApexClass"),apexTriggers:a("ApexTrigger"),lwc:a("LWC"),layouts:a("Layout"),permissionSets:a("PermissionSet"),profiles:a("Profile"),flexiPages:a("FlexiPage"),validationRules:a("ValidationRule"),quickActions:a("QuickAction"),recordTypes:a("RecordType")}}finally{e.close()}}function E(e){if(!e||0===e.length)return[];let a=e[0].columns;return e[0].values.map(e=>{let t={};return a.forEach((a,n)=>{t[a]=e[n]}),t})}async function _(e,a){let t=await c();if(!t)return null;try{let n=e.replace(/'/g,"''"),i=a.replace(/'/g,"''"),r=t.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${i}'`);return E(r)[0]||null}finally{t.close()}}async function f(e){let a=await c();if(!a)return[];try{let t=a.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return E(t)}finally{a.close()}}async function y(e){let a=await c();if(!a)return[];try{let t=a.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return E(t)}finally{a.close()}}async function m(e){let a=await c();if(!a)return[];try{let t=a.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return E(t)}finally{a.close()}}async function g(e,a=50,t){let n=await c();if(!n)return[];try{let i=e.replace(/'/g,"''"),r=t?.replace(/'/g,"''"),l="";e&&t?l=`WHERE (api_name LIKE '%${i}%' OR label LIKE '%${i}%') AND type = '${r}'`:e?l=`WHERE api_name LIKE '%${i}%' OR label LIKE '%${i}%'`:t&&(l=`WHERE type = '${r}'`);let s=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${l}
      ORDER BY
        CASE WHEN api_name LIKE '${i}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${a}
    `);return E(s)}finally{n.close()}}async function N(e,a=2){let t=await c();if(!t)return{nodes:[],edges:[]};try{let n=new Set,i=[],r=[],l=(e,s)=>{if(n.has(e)||s>a)return;n.add(e);let o=t.exec(`SELECT * FROM nodes WHERE id = ${e}`),p=E(o);if(p[0]){let e=p[0];i.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let d=t.exec(`SELECT * FROM edges WHERE source_id = ${e}`),c=t.exec(`SELECT * FROM edges WHERE target_id = ${e}`),u=E(d),_=E(c);for(let a of[...u,..._]){r.push({id:`${a.source_id}-${a.target_id}-${a.edge_type}`,source:String(a.source_id),target:String(a.target_id),label:a.edge_type.replace(/_/g," "),animated:a.edge_type.includes("FLOW")});let t=a.source_id===e?a.target_id:a.source_id;l(t,s+1)}};l(e,0);let s=Array.from(new Map(r.map(e=>[e.id,e])).values());return{nodes:i,edges:s}}finally{t.close()}}}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),n=a.X(0,[1638,6206],()=>t(2138));module.exports=n})();