"use strict";(()=>{var e={};e.id=9750,e.ids=[9750],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},6837:(e,a,t)=>{t.r(a),t.d(a,{headerHooks:()=>y,originalPathname:()=>m,patchFetch:()=>g,requestAsyncStorage:()=>u,routeModule:()=>c,serverHooks:()=>f,staticGenerationAsyncStorage:()=>_,staticGenerationBailout:()=>E});var n={};t.r(n),t.d(n,{GET:()=>p,dynamic:()=>d});var i=t(5419),r=t(9108),s=t(9678),l=t(8070),o=t(1494);let d="force-dynamic";async function p(e,{params:a}){try{let e=decodeURIComponent(a.name),t=await (0,o.N8)();if(!t)return l.Z.json({error:"Database not available"},{status:500});try{let a=e.replace(/'/g,"''"),n=t.exec(`
        SELECT id, api_name, label, file_path, metadata_json
        FROM nodes
        WHERE api_name = '${a}' AND type = 'FlexiPage'
      `);if(!n[0]||!n[0].values[0])return t.close(),l.Z.json({error:"FlexiPage not found"},{status:404});let i=n[0].values[0],r=i[4]?JSON.parse(i[4]):{},s=null;if(r.sobjectType){let e=t.exec(`
          SELECT id, api_name, label
          FROM nodes
          WHERE api_name = '${r.sobjectType.replace(/'/g,"''")}' AND type = 'Object'
        `);if(e[0]&&e[0].values[0]){let a=e[0].values[0];s={id:a[0],api_name:a[1],label:a[2]||a[1]}}}return t.close(),l.Z.json({id:i[0],api_name:i[1],label:i[2]||i[1],file_path:i[3],metadata:r,relatedObject:s})}catch(e){throw t.close(),e}}catch(e){return console.error("Error fetching flexipage:",e),l.Z.json({error:"Failed to fetch flexipage"},{status:500})}}let c=new i.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/flexipages/[name]/route",pathname:"/api/flexipages/[name]",filename:"route",bundlePath:"app/api/flexipages/[name]/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\flexipages\\[name]\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:u,staticGenerationAsyncStorage:_,serverHooks:f,headerHooks:y,staticGenerationBailout:E}=c,m="/api/flexipages/[name]/route";function g(){return(0,s.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:_})}},1494:(e,a,t)=>{t.d(a,{Fu:()=>x,Lw:()=>f,N8:()=>c,YE:()=>E,_P:()=>y,dV:()=>g,fy:()=>u,rZ:()=>m});var n=t(1017),i=t.n(n),r=t(7147),s=t.n(r);let l=(()=>{let e=i().resolve(__dirname,"..","..","..","..");if(s().existsSync(i().join(e,"packages","indexer","data")))return e;let a=process.cwd();return a.endsWith("apps/web")||a.endsWith("apps\\web")?i().resolve(a,"..",".."):s().existsSync(i().join(a,"packages","indexer","data"))?a:i().resolve(a,"..","..")})(),o=i().join(l,"packages","indexer","data","metadata.db"),d=null;async function p(){if(!d){let e=t(470),a=i().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=s().readFileSync(a);d=await e({wasmBinary:n})}return d}async function c(){if(!s().existsSync(o))return console.log("Database not found at:",o),null;let e=await p(),a=s().readFileSync(o);return new e.Database(a)}async function u(){let e=await c();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let a=a=>{let t=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${a}'`);return t[0]?.values[0]?.[0]||0};return{objects:a("Object"),fields:a("Field"),flows:a("Flow"),apexClasses:a("ApexClass"),apexTriggers:a("ApexTrigger"),lwc:a("LWC"),layouts:a("Layout"),permissionSets:a("PermissionSet"),profiles:a("Profile"),flexiPages:a("FlexiPage"),validationRules:a("ValidationRule"),quickActions:a("QuickAction"),recordTypes:a("RecordType")}}finally{e.close()}}function _(e){if(!e||0===e.length)return[];let a=e[0].columns;return e[0].values.map(e=>{let t={};return a.forEach((a,n)=>{t[a]=e[n]}),t})}async function f(e,a){let t=await c();if(!t)return null;try{let n=e.replace(/'/g,"''"),i=a.replace(/'/g,"''"),r=t.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${i}'`);return _(r)[0]||null}finally{t.close()}}async function y(e){let a=await c();if(!a)return[];try{let t=a.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return _(t)}finally{a.close()}}async function E(e){let a=await c();if(!a)return[];try{let t=a.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(t)}finally{a.close()}}async function m(e){let a=await c();if(!a)return[];try{let t=a.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(t)}finally{a.close()}}async function g(e,a=50,t){let n=await c();if(!n)return[];try{let i=e.replace(/'/g,"''"),r=t?.replace(/'/g,"''"),s="";e&&t?s=`WHERE (api_name LIKE '%${i}%' OR label LIKE '%${i}%') AND type = '${r}'`:e?s=`WHERE api_name LIKE '%${i}%' OR label LIKE '%${i}%'`:t&&(s=`WHERE type = '${r}'`);let l=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${s}
      ORDER BY
        CASE WHEN api_name LIKE '${i}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${a}
    `);return _(l)}finally{n.close()}}async function x(e,a=2){let t=await c();if(!t)return{nodes:[],edges:[]};try{let n=new Set,i=[],r=[],s=(e,l)=>{if(n.has(e)||l>a)return;n.add(e);let o=t.exec(`SELECT * FROM nodes WHERE id = ${e}`),d=_(o);if(d[0]){let e=d[0];i.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let p=t.exec(`SELECT * FROM edges WHERE source_id = ${e}`),c=t.exec(`SELECT * FROM edges WHERE target_id = ${e}`),u=_(p),f=_(c);for(let a of[...u,...f]){r.push({id:`${a.source_id}-${a.target_id}-${a.edge_type}`,source:String(a.source_id),target:String(a.target_id),label:a.edge_type.replace(/_/g," "),animated:a.edge_type.includes("FLOW")});let t=a.source_id===e?a.target_id:a.source_id;s(t,l+1)}};s(e,0);let l=Array.from(new Map(r.map(e=>[e.id,e])).values());return{nodes:i,edges:l}}finally{t.close()}}}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),n=a.X(0,[1638,6206],()=>t(6837));module.exports=n})();