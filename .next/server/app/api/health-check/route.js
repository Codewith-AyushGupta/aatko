"use strict";(()=>{var e={};e.id=4989,e.ids=[4989],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},5010:(e,a,t)=>{t.r(a),t.d(a,{headerHooks:()=>m,originalPathname:()=>g,patchFetch:()=>h,requestAsyncStorage:()=>E,routeModule:()=>p,serverHooks:()=>y,staticGenerationAsyncStorage:()=>_,staticGenerationBailout:()=>f});var n={};t.r(n),t.d(n,{GET:()=>u,dynamic:()=>d});var s=t(5419),i=t(9108),r=t(9678),l=t(8070),o=t(1494);let d="force-dynamic";function c(e){return e>=90?"good":e>=50?"warning":"critical"}async function u(){try{let e=await (0,o.N8)();if(!e)return l.Z.json({overall:{score:0,status:"critical",message:"Database not found. Run ingest command first."},metrics:[],lastSync:{metadata:null,recordCounts:null,utilization:null,audit:null},recommendations:["Run: npm run ingest -- --path ./force-app/main/default"]});try{let a=[],t=[],n=e.exec(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN a.metric_value IS NOT NULL THEN 1 ELSE 0 END) as with_counts
        FROM nodes n
        LEFT JOIN analytics a ON n.id = a.node_id AND a.metric_type = 'record_count'
        WHERE n.type = 'Object'
      `),s=n[0]?.values[0]?.[0]||0,i=n[0]?.values[0]?.[1]||0,r=s>0?Math.round(i/s*100):0;a.push({name:"Objects with Record Counts",total:s,complete:i,percentage:r,status:c(r)}),r<90&&t.push("Sync record counts: npm run -w @aa-smi/indexer sync record-counts");let o=e.exec(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN a.metric_value IS NOT NULL THEN 1 ELSE 0 END) as with_rates
        FROM nodes n
        LEFT JOIN analytics a ON n.id = a.node_id AND a.metric_type = 'population_rate'
        WHERE n.type = 'Field'
      `),d=o[0]?.values[0]?.[0]||0,u=o[0]?.values[0]?.[1]||0,p=d>0?Math.round(u/d*100):0;a.push({name:"Fields with Utilization Data",total:d,complete:u,percentage:p,status:c(p)}),p<90&&t.push("Sync field utilization: npm run -w @aa-smi/indexer sync utilization");let E=e.exec(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN sf_created_date IS NOT NULL OR sf_last_modified_date IS NOT NULL THEN 1 ELSE 0 END) as with_audit
        FROM nodes
        WHERE type IN ('Object', 'Field', 'Flow', 'ApexClass', 'ApexTrigger')
      `),_=E[0]?.values[0]?.[0]||0,y=E[0]?.values[0]?.[1]||0,m=_>0?Math.round(y/_*100):0;a.push({name:"Nodes with Audit Data",total:_,complete:y,percentage:m,status:c(m)}),m<90&&t.push("Sync audit data: npm run -w @aa-smi/indexer sync audit");let f=e.exec("SELECT COUNT(*) FROM nodes WHERE type = 'Flow'"),g=f[0]?.values[0]?.[0]||0;a.push({name:"Flows Indexed",total:g,complete:g,percentage:g>0?100:0,status:g>0?"good":"warning"});let h=e.exec("SELECT COUNT(*) FROM nodes WHERE type = 'ApexClass'"),R=h[0]?.values[0]?.[0]||0;a.push({name:"Apex Classes Indexed",total:R,complete:R,percentage:R>0?100:0,status:R>0?"good":"warning"});let S=e.exec("SELECT COUNT(*) FROM edges"),N=S[0]?.values[0]?.[0]||0;a.push({name:"Relationships Mapped",total:N,complete:N,percentage:N>0?100:0,status:N>0?"good":"warning"});let O=a.filter(e=>e.total>0),x=O.length>0?Math.round(O.reduce((e,a)=>e+a.percentage,0)/O.length):0,w=c(x),T="";return T="good"===w?"Data is complete and ready for analysis.":"warning"===w?"Some data is missing. Run sync commands for complete analysis.":"Critical data missing. Sync required before analysis.",l.Z.json({overall:{score:x,status:w,message:T},metrics:a,lastSync:{metadata:s>0?"Available":null,recordCounts:i>0?"Available":null,utilization:u>0?"Available":null,audit:y>0?"Available":null},recommendations:t})}finally{e.close()}}catch(e){return console.error("Error running health check:",e),l.Z.json({error:"Failed to run health check"},{status:500})}}let p=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/health-check/route",pathname:"/api/health-check",filename:"route",bundlePath:"app/api/health-check/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\health-check\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:E,staticGenerationAsyncStorage:_,serverHooks:y,headerHooks:m,staticGenerationBailout:f}=p,g="/api/health-check/route";function h(){return(0,r.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:_})}},1494:(e,a,t)=>{t.d(a,{Fu:()=>h,Lw:()=>_,N8:()=>u,YE:()=>m,_P:()=>y,dV:()=>g,fy:()=>p,rZ:()=>f});var n=t(1017),s=t.n(n),i=t(7147),r=t.n(i);let l=(()=>{let e=s().resolve(__dirname,"..","..","..","..");if(r().existsSync(s().join(e,"packages","indexer","data")))return e;let a=process.cwd();return a.endsWith("apps/web")||a.endsWith("apps\\web")?s().resolve(a,"..",".."):r().existsSync(s().join(a,"packages","indexer","data"))?a:s().resolve(a,"..","..")})(),o=s().join(l,"packages","indexer","data","metadata.db"),d=null;async function c(){if(!d){let e=t(470),a=s().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=r().readFileSync(a);d=await e({wasmBinary:n})}return d}async function u(){if(!r().existsSync(o))return console.log("Database not found at:",o),null;let e=await c(),a=r().readFileSync(o);return new e.Database(a)}async function p(){let e=await u();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let a=a=>{let t=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${a}'`);return t[0]?.values[0]?.[0]||0};return{objects:a("Object"),fields:a("Field"),flows:a("Flow"),apexClasses:a("ApexClass"),apexTriggers:a("ApexTrigger"),lwc:a("LWC"),layouts:a("Layout"),permissionSets:a("PermissionSet"),profiles:a("Profile"),flexiPages:a("FlexiPage"),validationRules:a("ValidationRule"),quickActions:a("QuickAction"),recordTypes:a("RecordType")}}finally{e.close()}}function E(e){if(!e||0===e.length)return[];let a=e[0].columns;return e[0].values.map(e=>{let t={};return a.forEach((a,n)=>{t[a]=e[n]}),t})}async function _(e,a){let t=await u();if(!t)return null;try{let n=e.replace(/'/g,"''"),s=a.replace(/'/g,"''"),i=t.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${s}'`);return E(i)[0]||null}finally{t.close()}}async function y(e){let a=await u();if(!a)return[];try{let t=a.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return E(t)}finally{a.close()}}async function m(e){let a=await u();if(!a)return[];try{let t=a.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return E(t)}finally{a.close()}}async function f(e){let a=await u();if(!a)return[];try{let t=a.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return E(t)}finally{a.close()}}async function g(e,a=50,t){let n=await u();if(!n)return[];try{let s=e.replace(/'/g,"''"),i=t?.replace(/'/g,"''"),r="";e&&t?r=`WHERE (api_name LIKE '%${s}%' OR label LIKE '%${s}%') AND type = '${i}'`:e?r=`WHERE api_name LIKE '%${s}%' OR label LIKE '%${s}%'`:t&&(r=`WHERE type = '${i}'`);let l=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${r}
      ORDER BY
        CASE WHEN api_name LIKE '${s}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${a}
    `);return E(l)}finally{n.close()}}async function h(e,a=2){let t=await u();if(!t)return{nodes:[],edges:[]};try{let n=new Set,s=[],i=[],r=(e,l)=>{if(n.has(e)||l>a)return;n.add(e);let o=t.exec(`SELECT * FROM nodes WHERE id = ${e}`),d=E(o);if(d[0]){let e=d[0];s.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let c=t.exec(`SELECT * FROM edges WHERE source_id = ${e}`),u=t.exec(`SELECT * FROM edges WHERE target_id = ${e}`),p=E(c),_=E(u);for(let a of[...p,..._]){i.push({id:`${a.source_id}-${a.target_id}-${a.edge_type}`,source:String(a.source_id),target:String(a.target_id),label:a.edge_type.replace(/_/g," "),animated:a.edge_type.includes("FLOW")});let t=a.source_id===e?a.target_id:a.source_id;r(t,l+1)}};r(e,0);let l=Array.from(new Map(i.map(e=>[e.id,e])).values());return{nodes:s,edges:l}}finally{t.close()}}}};var a=require("../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),n=a.X(0,[1638,6206],()=>t(5010));module.exports=n})();