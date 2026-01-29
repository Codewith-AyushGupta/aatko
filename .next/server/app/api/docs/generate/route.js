"use strict";(()=>{var e={};e.id=4817,e.ids=[4817],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},1113:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>E,originalPathname:()=>g,patchFetch:()=>m,requestAsyncStorage:()=>u,routeModule:()=>c,serverHooks:()=>y,staticGenerationAsyncStorage:()=>_,staticGenerationBailout:()=>f});var n={};a.r(n),a.d(n,{POST:()=>p,dynamic:()=>d});var i=a(5419),r=a(9108),s=a(9678),l=a(8070),o=a(1494);let d="force-dynamic";async function p(e){try{let t=(await e.json()).nodeIds||[];if(!t.length)return l.Z.json({error:"No nodes selected"},{status:400});let a=await (0,o.N8)();if(!a)return l.Z.json({error:"Database not available"},{status:500});let n=[];for(let e of t){let t=a.exec(`
        SELECT id, api_name, label, type, file_path, metadata_json
        FROM nodes
        WHERE id = ${e}
      `);if(!t[0]?.values?.length)continue;let i=t[0].values[0],r=i[5],s={},l=null;if(r)try{l=(s=JSON.parse(r)).description||s.Description||null}catch{}let o=a.exec(`
        SELECT id, api_name, label, type, metadata_json
        FROM nodes
        WHERE parent_id = ${e}
        ORDER BY type, api_name
      `),d=(o[0]?.values||[]).map(e=>{let t=null;if(e[4])try{let a=JSON.parse(e[4]);t=a.description||a.inlineHelpText||null}catch{}return{id:e[0],apiName:e[1],label:e[2],type:e[3],description:t}}),p=a.exec(`
        SELECT e.edge_type, n.id, n.api_name, n.label, n.type
        FROM edges e
        JOIN nodes n ON e.source_id = n.id
        WHERE e.target_id = ${e}
        ORDER BY e.edge_type, n.api_name
      `),c=a.exec(`
        SELECT e.edge_type, n.id, n.api_name, n.label, n.type
        FROM edges e
        JOIN nodes n ON e.target_id = n.id
        WHERE e.source_id = ${e}
        ORDER BY e.edge_type, n.api_name
      `),u=[];(p[0]?.values||[]).forEach(e=>{u.push({direction:"incoming",edgeType:e[0],nodeId:e[1],apiName:e[2],label:e[3],nodeType:e[4]})}),(c[0]?.values||[]).forEach(e=>{u.push({direction:"outgoing",edgeType:e[0],nodeId:e[1],apiName:e[2],label:e[3],nodeType:e[4]})});let _=a.exec(`
        SELECT metric_type, metric_value
        FROM analytics
        WHERE node_id = ${e}
      `),y={};(_[0]?.values||[]).forEach(e=>{"record_count"===e[0]&&(y.recordCount=e[1]),"population_rate"===e[0]&&(y.populationRate=e[1])}),n.push({id:i[0],apiName:i[1],label:i[2],type:i[3],description:l,filePath:i[4],metadata:s,children:d,relationships:u,analytics:y})}a.close();let i={},r=0,s=0;n.forEach(e=>{i[e.type]=(i[e.type]||0)+1,r+=e.relationships.length,s+=e.children.length});let d={items:n,generatedAt:new Date().toISOString(),summary:{totalItems:n.length,itemsByType:i,totalRelationships:r,totalChildren:s}};return l.Z.json(d)}catch(e){return console.error("Error generating documentation:",e),l.Z.json({error:"Failed to generate documentation"},{status:500})}}let c=new i.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/docs/generate/route",pathname:"/api/docs/generate",filename:"route",bundlePath:"app/api/docs/generate/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\docs\\generate\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:u,staticGenerationAsyncStorage:_,serverHooks:y,headerHooks:E,staticGenerationBailout:f}=c,g="/api/docs/generate/route";function m(){return(0,s.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:_})}},1494:(e,t,a)=>{a.d(t,{Fu:()=>R,Lw:()=>y,N8:()=>c,YE:()=>f,_P:()=>E,dV:()=>m,fy:()=>u,rZ:()=>g});var n=a(1017),i=a.n(n),r=a(7147),s=a.n(r);let l=(()=>{let e=i().resolve(__dirname,"..","..","..","..");if(s().existsSync(i().join(e,"packages","indexer","data")))return e;let t=process.cwd();return t.endsWith("apps/web")||t.endsWith("apps\\web")?i().resolve(t,"..",".."):s().existsSync(i().join(t,"packages","indexer","data"))?t:i().resolve(t,"..","..")})(),o=i().join(l,"packages","indexer","data","metadata.db"),d=null;async function p(){if(!d){let e=a(470),t=i().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=s().readFileSync(t);d=await e({wasmBinary:n})}return d}async function c(){if(!s().existsSync(o))return console.log("Database not found at:",o),null;let e=await p(),t=s().readFileSync(o);return new e.Database(t)}async function u(){let e=await c();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let t=t=>{let a=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${t}'`);return a[0]?.values[0]?.[0]||0};return{objects:t("Object"),fields:t("Field"),flows:t("Flow"),apexClasses:t("ApexClass"),apexTriggers:t("ApexTrigger"),lwc:t("LWC"),layouts:t("Layout"),permissionSets:t("PermissionSet"),profiles:t("Profile"),flexiPages:t("FlexiPage"),validationRules:t("ValidationRule"),quickActions:t("QuickAction"),recordTypes:t("RecordType")}}finally{e.close()}}function _(e){if(!e||0===e.length)return[];let t=e[0].columns;return e[0].values.map(e=>{let a={};return t.forEach((t,n)=>{a[t]=e[n]}),a})}async function y(e,t){let a=await c();if(!a)return null;try{let n=e.replace(/'/g,"''"),i=t.replace(/'/g,"''"),r=a.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${i}'`);return _(r)[0]||null}finally{a.close()}}async function E(e){let t=await c();if(!t)return[];try{let a=t.exec(`
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
    `);return _(a)}finally{t.close()}}async function m(e,t=50,a){let n=await c();if(!n)return[];try{let i=e.replace(/'/g,"''"),r=a?.replace(/'/g,"''"),s="";e&&a?s=`WHERE (api_name LIKE '%${i}%' OR label LIKE '%${i}%') AND type = '${r}'`:e?s=`WHERE api_name LIKE '%${i}%' OR label LIKE '%${i}%'`:a&&(s=`WHERE type = '${r}'`);let l=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${s}
      ORDER BY
        CASE WHEN api_name LIKE '${i}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${t}
    `);return _(l)}finally{n.close()}}async function R(e,t=2){let a=await c();if(!a)return{nodes:[],edges:[]};try{let n=new Set,i=[],r=[],s=(e,l)=>{if(n.has(e)||l>t)return;n.add(e);let o=a.exec(`SELECT * FROM nodes WHERE id = ${e}`),d=_(o);if(d[0]){let e=d[0];i.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let p=a.exec(`SELECT * FROM edges WHERE source_id = ${e}`),c=a.exec(`SELECT * FROM edges WHERE target_id = ${e}`),u=_(p),y=_(c);for(let t of[...u,...y]){r.push({id:`${t.source_id}-${t.target_id}-${t.edge_type}`,source:String(t.source_id),target:String(t.target_id),label:t.edge_type.replace(/_/g," "),animated:t.edge_type.includes("FLOW")});let a=t.source_id===e?t.target_id:t.source_id;s(a,l+1)}};s(e,0);let l=Array.from(new Map(r.map(e=>[e.id,e])).values());return{nodes:i,edges:l}}finally{a.close()}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),n=t.X(0,[1638,6206],()=>a(1113));module.exports=n})();