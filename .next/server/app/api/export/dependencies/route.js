"use strict";(()=>{var e={};e.id=6126,e.ids=[6126],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},162:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>E,originalPathname:()=>g,patchFetch:()=>m,requestAsyncStorage:()=>u,routeModule:()=>c,serverHooks:()=>y,staticGenerationAsyncStorage:()=>_,staticGenerationBailout:()=>f});var n={};a.r(n),a.d(n,{POST:()=>p,dynamic:()=>l});var r=a(5419),s=a(9108),i=a(9678),d=a(8070),o=a(1494);let l="force-dynamic";async function p(e){try{let{itemIds:t,depth:a=2}=await e.json();if(!t||!Array.isArray(t)||0===t.length)return d.Z.json({error:"itemIds array is required"},{status:400});let n=await (0,o.N8)();if(!n)return d.Z.json({items:[],relationships:[]});let r=new Set,s=[],i=[],l=(e,t)=>{if(t>a||0===e.length)return;let d=e.filter(e=>!r.has(e));if(0===d.length)return;d.forEach(e=>r.add(e));let o=d.join(","),p=n.exec(`
        SELECT id, api_name, label, type, metadata_json
        FROM nodes
        WHERE id IN (${o})
      `);(p[0]?.values||[]).forEach(e=>{s.push({id:e[0],apiName:e[1],label:e[2]||e[1],type:e[3],metadata:e[4]?JSON.parse(e[4]):{}})});let c=n.exec(`
        SELECT e.source_id, e.target_id, e.edge_type,
               t.api_name as target_name, t.type as target_type
        FROM edges e
        JOIN nodes t ON e.target_id = t.id
        WHERE e.source_id IN (${o})
      `),u=n.exec(`
        SELECT e.source_id, e.target_id, e.edge_type,
               s.api_name as source_name, s.type as source_type
        FROM edges e
        JOIN nodes s ON e.source_id = s.id
        WHERE e.target_id IN (${o})
      `),_=[];(c[0]?.values||[]).forEach(e=>{i.push({sourceId:e[0],targetId:e[1],edgeType:e[2],targetName:e[3],targetType:e[4]}),r.has(e[1])||_.push(e[1])}),(u[0]?.values||[]).forEach(e=>{i.push({sourceId:e[0],targetId:e[1],edgeType:e[2],sourceName:e[3],sourceType:e[4]}),r.has(e[0])||_.push(e[0])}),_.length>0&&l(Array.from(new Set(_)),t+1)};l(t,0),n.close();let p=Array.from(new Map(i.map(e=>[`${e.sourceId}-${e.targetId}-${e.edgeType}`,e])).values());return d.Z.json({items:s,relationships:p,summary:{totalItems:s.length,byType:s.reduce((e,t)=>(e[t.type]=(e[t.type]||0)+1,e),{})}})}catch(e){return console.error("Error expanding dependencies:",e),d.Z.json({error:"Failed to expand dependencies"},{status:500})}}let c=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/export/dependencies/route",pathname:"/api/export/dependencies",filename:"route",bundlePath:"app/api/export/dependencies/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\export\\dependencies\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:u,staticGenerationAsyncStorage:_,serverHooks:y,headerHooks:E,staticGenerationBailout:f}=c,g="/api/export/dependencies/route";function m(){return(0,i.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:_})}},1494:(e,t,a)=>{a.d(t,{Fu:()=>x,Lw:()=>y,N8:()=>c,YE:()=>f,_P:()=>E,dV:()=>m,fy:()=>u,rZ:()=>g});var n=a(1017),r=a.n(n),s=a(7147),i=a.n(s);let d=(()=>{let e=r().resolve(__dirname,"..","..","..","..");if(i().existsSync(r().join(e,"packages","indexer","data")))return e;let t=process.cwd();return t.endsWith("apps/web")||t.endsWith("apps\\web")?r().resolve(t,"..",".."):i().existsSync(r().join(t,"packages","indexer","data"))?t:r().resolve(t,"..","..")})(),o=r().join(d,"packages","indexer","data","metadata.db"),l=null;async function p(){if(!l){let e=a(470),t=r().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=i().readFileSync(t);l=await e({wasmBinary:n})}return l}async function c(){if(!i().existsSync(o))return console.log("Database not found at:",o),null;let e=await p(),t=i().readFileSync(o);return new e.Database(t)}async function u(){let e=await c();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let t=t=>{let a=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${t}'`);return a[0]?.values[0]?.[0]||0};return{objects:t("Object"),fields:t("Field"),flows:t("Flow"),apexClasses:t("ApexClass"),apexTriggers:t("ApexTrigger"),lwc:t("LWC"),layouts:t("Layout"),permissionSets:t("PermissionSet"),profiles:t("Profile"),flexiPages:t("FlexiPage"),validationRules:t("ValidationRule"),quickActions:t("QuickAction"),recordTypes:t("RecordType")}}finally{e.close()}}function _(e){if(!e||0===e.length)return[];let t=e[0].columns;return e[0].values.map(e=>{let a={};return t.forEach((t,n)=>{a[t]=e[n]}),a})}async function y(e,t){let a=await c();if(!a)return null;try{let n=e.replace(/'/g,"''"),r=t.replace(/'/g,"''"),s=a.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${r}'`);return _(s)[0]||null}finally{a.close()}}async function E(e){let t=await c();if(!t)return[];try{let a=t.exec(`
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
    `);return _(a)}finally{t.close()}}async function g(e){let t=await c();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(a)}finally{t.close()}}async function m(e,t=50,a){let n=await c();if(!n)return[];try{let r=e.replace(/'/g,"''"),s=a?.replace(/'/g,"''"),i="";e&&a?i=`WHERE (api_name LIKE '%${r}%' OR label LIKE '%${r}%') AND type = '${s}'`:e?i=`WHERE api_name LIKE '%${r}%' OR label LIKE '%${r}%'`:a&&(i=`WHERE type = '${s}'`);let d=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${i}
      ORDER BY
        CASE WHEN api_name LIKE '${r}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${t}
    `);return _(d)}finally{n.close()}}async function x(e,t=2){let a=await c();if(!a)return{nodes:[],edges:[]};try{let n=new Set,r=[],s=[],i=(e,d)=>{if(n.has(e)||d>t)return;n.add(e);let o=a.exec(`SELECT * FROM nodes WHERE id = ${e}`),l=_(o);if(l[0]){let e=l[0];r.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let p=a.exec(`SELECT * FROM edges WHERE source_id = ${e}`),c=a.exec(`SELECT * FROM edges WHERE target_id = ${e}`),u=_(p),y=_(c);for(let t of[...u,...y]){s.push({id:`${t.source_id}-${t.target_id}-${t.edge_type}`,source:String(t.source_id),target:String(t.target_id),label:t.edge_type.replace(/_/g," "),animated:t.edge_type.includes("FLOW")});let a=t.source_id===e?t.target_id:t.source_id;i(a,d+1)}};i(e,0);let d=Array.from(new Map(s.map(e=>[e.id,e])).values());return{nodes:r,edges:d}}finally{a.close()}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),n=t.X(0,[1638,6206],()=>a(162));module.exports=n})();