"use strict";(()=>{var e={};e.id=3025,e.ids=[3025],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},7328:(e,a,t)=>{t.r(a),t.d(a,{headerHooks:()=>E,originalPathname:()=>g,patchFetch:()=>m,requestAsyncStorage:()=>u,routeModule:()=>c,serverHooks:()=>y,staticGenerationAsyncStorage:()=>_,staticGenerationBailout:()=>f});var n={};t.r(n),t.d(n,{GET:()=>p,dynamic:()=>d});var r=t(5419),i=t(9108),s=t(9678),l=t(8070),o=t(1494);let d="force-dynamic";async function p(){try{let e=await (0,o.N8)();if(!e)return l.Z.json({triggers:[]});try{let a=e.exec(`
        SELECT id, api_name, label, file_path, metadata_json
        FROM nodes
        WHERE type = 'ApexTrigger'
        ORDER BY api_name
      `),t=a.length>0?a[0].values.map(e=>({id:e[0],api_name:e[1],label:e[2]||e[1],file_path:e[3],metadata:e[4]?JSON.parse(e[4]):{}})):[];return l.Z.json({triggers:t})}finally{e.close()}}catch(e){return console.error("Error fetching triggers:",e),l.Z.json({error:"Failed to fetch triggers"},{status:500})}}let c=new r.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/triggers/route",pathname:"/api/triggers",filename:"route",bundlePath:"app/api/triggers/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\triggers\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:u,staticGenerationAsyncStorage:_,serverHooks:y,headerHooks:E,staticGenerationBailout:f}=c,g="/api/triggers/route";function m(){return(0,s.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:_})}},1494:(e,a,t)=>{t.d(a,{Fu:()=>R,Lw:()=>y,N8:()=>c,YE:()=>f,_P:()=>E,dV:()=>m,fy:()=>u,rZ:()=>g});var n=t(1017),r=t.n(n),i=t(7147),s=t.n(i);let l=(()=>{let e=r().resolve(__dirname,"..","..","..","..");if(s().existsSync(r().join(e,"packages","indexer","data")))return e;let a=process.cwd();return a.endsWith("apps/web")||a.endsWith("apps\\web")?r().resolve(a,"..",".."):s().existsSync(r().join(a,"packages","indexer","data"))?a:r().resolve(a,"..","..")})(),o=r().join(l,"packages","indexer","data","metadata.db"),d=null;async function p(){if(!d){let e=t(470),a=r().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=s().readFileSync(a);d=await e({wasmBinary:n})}return d}async function c(){if(!s().existsSync(o))return console.log("Database not found at:",o),null;let e=await p(),a=s().readFileSync(o);return new e.Database(a)}async function u(){let e=await c();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let a=a=>{let t=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${a}'`);return t[0]?.values[0]?.[0]||0};return{objects:a("Object"),fields:a("Field"),flows:a("Flow"),apexClasses:a("ApexClass"),apexTriggers:a("ApexTrigger"),lwc:a("LWC"),layouts:a("Layout"),permissionSets:a("PermissionSet"),profiles:a("Profile"),flexiPages:a("FlexiPage"),validationRules:a("ValidationRule"),quickActions:a("QuickAction"),recordTypes:a("RecordType")}}finally{e.close()}}function _(e){if(!e||0===e.length)return[];let a=e[0].columns;return e[0].values.map(e=>{let t={};return a.forEach((a,n)=>{t[a]=e[n]}),t})}async function y(e,a){let t=await c();if(!t)return null;try{let n=e.replace(/'/g,"''"),r=a.replace(/'/g,"''"),i=t.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${r}'`);return _(i)[0]||null}finally{t.close()}}async function E(e){let a=await c();if(!a)return[];try{let t=a.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return _(t)}finally{a.close()}}async function f(e){let a=await c();if(!a)return[];try{let t=a.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(t)}finally{a.close()}}async function g(e){let a=await c();if(!a)return[];try{let t=a.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(t)}finally{a.close()}}async function m(e,a=50,t){let n=await c();if(!n)return[];try{let r=e.replace(/'/g,"''"),i=t?.replace(/'/g,"''"),s="";e&&t?s=`WHERE (api_name LIKE '%${r}%' OR label LIKE '%${r}%') AND type = '${i}'`:e?s=`WHERE api_name LIKE '%${r}%' OR label LIKE '%${r}%'`:t&&(s=`WHERE type = '${i}'`);let l=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${s}
      ORDER BY
        CASE WHEN api_name LIKE '${r}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${a}
    `);return _(l)}finally{n.close()}}async function R(e,a=2){let t=await c();if(!t)return{nodes:[],edges:[]};try{let n=new Set,r=[],i=[],s=(e,l)=>{if(n.has(e)||l>a)return;n.add(e);let o=t.exec(`SELECT * FROM nodes WHERE id = ${e}`),d=_(o);if(d[0]){let e=d[0];r.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let p=t.exec(`SELECT * FROM edges WHERE source_id = ${e}`),c=t.exec(`SELECT * FROM edges WHERE target_id = ${e}`),u=_(p),y=_(c);for(let a of[...u,...y]){i.push({id:`${a.source_id}-${a.target_id}-${a.edge_type}`,source:String(a.source_id),target:String(a.target_id),label:a.edge_type.replace(/_/g," "),animated:a.edge_type.includes("FLOW")});let t=a.source_id===e?a.target_id:a.source_id;s(t,l+1)}};s(e,0);let l=Array.from(new Map(i.map(e=>[e.id,e])).values());return{nodes:r,edges:l}}finally{t.close()}}}};var a=require("../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),n=a.X(0,[1638,6206],()=>t(7328));module.exports=n})();