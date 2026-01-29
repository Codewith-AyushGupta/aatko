"use strict";(()=>{var e={};e.id=8541,e.ids=[8541],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},5263:(e,a,t)=>{t.r(a),t.d(a,{headerHooks:()=>E,originalPathname:()=>m,patchFetch:()=>g,requestAsyncStorage:()=>_,routeModule:()=>p,serverHooks:()=>y,staticGenerationAsyncStorage:()=>u,staticGenerationBailout:()=>f});var n={};t.r(n),t.d(n,{GET:()=>c,dynamic:()=>d});var i=t(5419),r=t(9108),s=t(9678),o=t(8070),l=t(1494);let d="force-dynamic";async function c(){try{let e=await (0,l.N8)();if(!e)return o.Z.json({objects:[]});try{let a=e.exec(`
        SELECT
          n.id,
          n.api_name,
          n.label,
          n.metadata_json,
          COUNT(f.id) as field_count,
          MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
          MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate,
          n.sf_created_date,
          n.sf_created_by_name,
          n.sf_last_modified_date,
          n.sf_last_modified_by_name
        FROM nodes n
        LEFT JOIN nodes f ON f.parent_id = n.id AND f.type = 'Field'
        LEFT JOIN analytics a ON n.id = a.node_id
        WHERE n.type = 'Object'
        GROUP BY n.id
        ORDER BY n.api_name
      `),t=a.length>0?a[0].values.map(e=>({id:e[0],api_name:e[1],label:e[2]||e[1],metadata:e[3]?JSON.parse(e[3]):{},field_count:e[4]||0,record_count:e[5],population_rate:e[6],created_date:e[7],created_by:e[8],last_modified_date:e[9],last_modified_by:e[10]})):[];return o.Z.json({objects:t})}finally{e.close()}}catch(e){return console.error("Error fetching objects:",e),o.Z.json({error:"Failed to fetch objects"},{status:500})}}let p=new i.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/objects/route",pathname:"/api/objects",filename:"route",bundlePath:"app/api/objects/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\objects\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:_,staticGenerationAsyncStorage:u,serverHooks:y,headerHooks:E,staticGenerationBailout:f}=p,m="/api/objects/route";function g(){return(0,s.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:u})}},1494:(e,a,t)=>{t.d(a,{Fu:()=>R,Lw:()=>y,N8:()=>p,YE:()=>f,_P:()=>E,dV:()=>g,fy:()=>_,rZ:()=>m});var n=t(1017),i=t.n(n),r=t(7147),s=t.n(r);let o=(()=>{let e=i().resolve(__dirname,"..","..","..","..");if(s().existsSync(i().join(e,"packages","indexer","data")))return e;let a=process.cwd();return a.endsWith("apps/web")||a.endsWith("apps\\web")?i().resolve(a,"..",".."):s().existsSync(i().join(a,"packages","indexer","data"))?a:i().resolve(a,"..","..")})(),l=i().join(o,"packages","indexer","data","metadata.db"),d=null;async function c(){if(!d){let e=t(470),a=i().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=s().readFileSync(a);d=await e({wasmBinary:n})}return d}async function p(){if(!s().existsSync(l))return console.log("Database not found at:",l),null;let e=await c(),a=s().readFileSync(l);return new e.Database(a)}async function _(){let e=await p();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let a=a=>{let t=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${a}'`);return t[0]?.values[0]?.[0]||0};return{objects:a("Object"),fields:a("Field"),flows:a("Flow"),apexClasses:a("ApexClass"),apexTriggers:a("ApexTrigger"),lwc:a("LWC"),layouts:a("Layout"),permissionSets:a("PermissionSet"),profiles:a("Profile"),flexiPages:a("FlexiPage"),validationRules:a("ValidationRule"),quickActions:a("QuickAction"),recordTypes:a("RecordType")}}finally{e.close()}}function u(e){if(!e||0===e.length)return[];let a=e[0].columns;return e[0].values.map(e=>{let t={};return a.forEach((a,n)=>{t[a]=e[n]}),t})}async function y(e,a){let t=await p();if(!t)return null;try{let n=e.replace(/'/g,"''"),i=a.replace(/'/g,"''"),r=t.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${i}'`);return u(r)[0]||null}finally{t.close()}}async function E(e){let a=await p();if(!a)return[];try{let t=a.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return u(t)}finally{a.close()}}async function f(e){let a=await p();if(!a)return[];try{let t=a.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return u(t)}finally{a.close()}}async function m(e){let a=await p();if(!a)return[];try{let t=a.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return u(t)}finally{a.close()}}async function g(e,a=50,t){let n=await p();if(!n)return[];try{let i=e.replace(/'/g,"''"),r=t?.replace(/'/g,"''"),s="";e&&t?s=`WHERE (api_name LIKE '%${i}%' OR label LIKE '%${i}%') AND type = '${r}'`:e?s=`WHERE api_name LIKE '%${i}%' OR label LIKE '%${i}%'`:t&&(s=`WHERE type = '${r}'`);let o=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${s}
      ORDER BY
        CASE WHEN api_name LIKE '${i}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${a}
    `);return u(o)}finally{n.close()}}async function R(e,a=2){let t=await p();if(!t)return{nodes:[],edges:[]};try{let n=new Set,i=[],r=[],s=(e,o)=>{if(n.has(e)||o>a)return;n.add(e);let l=t.exec(`SELECT * FROM nodes WHERE id = ${e}`),d=u(l);if(d[0]){let e=d[0];i.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let c=t.exec(`SELECT * FROM edges WHERE source_id = ${e}`),p=t.exec(`SELECT * FROM edges WHERE target_id = ${e}`),_=u(c),y=u(p);for(let a of[..._,...y]){r.push({id:`${a.source_id}-${a.target_id}-${a.edge_type}`,source:String(a.source_id),target:String(a.target_id),label:a.edge_type.replace(/_/g," "),animated:a.edge_type.includes("FLOW")});let t=a.source_id===e?a.target_id:a.source_id;s(t,o+1)}};s(e,0);let o=Array.from(new Map(r.map(e=>[e.id,e])).values());return{nodes:i,edges:o}}finally{t.close()}}}};var a=require("../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),n=a.X(0,[1638,6206],()=>t(5263));module.exports=n})();