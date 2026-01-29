"use strict";(()=>{var e={};e.id=5888,e.ids=[5888],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},9811:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>f,originalPathname:()=>m,patchFetch:()=>h,requestAsyncStorage:()=>u,routeModule:()=>p,serverHooks:()=>E,staticGenerationAsyncStorage:()=>y,staticGenerationBailout:()=>_});var s={};a.r(s),a.d(s,{GET:()=>c,dynamic:()=>d});var i=a(5419),n=a(9108),r=a(9678),l=a(8070),o=a(1494);let d="force-dynamic";async function c(){try{let e=await (0,o.N8)();if(!e)return l.Z.json({error:"Database not available"},{status:500});let t={profilesWithModifyAll:0,permissionSetsWithModifyAll:0,flowsRunAsSystem:0,apexWithoutSharing:0,publicObjects:0,fieldsWithoutFLS:0,totalProfiles:0,totalPermissionSets:0,totalFlows:0,totalApexClasses:0,totalObjects:0,details:{highPrivilegeProfiles:[],highPrivilegePermSets:[],systemFlows:[],unsecureApex:[]}},a=e.exec(`
      SELECT type, COUNT(*) as count FROM nodes
      WHERE type IN ('Profile', 'PermissionSet', 'Flow', 'ApexClass', 'Object')
      GROUP BY type
    `);(a[0]?.values||[]).forEach(e=>{let a=e[0],s=e[1];"Profile"===a&&(t.totalProfiles=s),"PermissionSet"===a&&(t.totalPermissionSets=s),"Flow"===a&&(t.totalFlows=s),"ApexClass"===a&&(t.totalApexClasses=s),"Object"===a&&(t.totalObjects=s)});let s=e.exec(`
      SELECT api_name, metadata_json FROM nodes WHERE type = 'Profile'
    `);(s[0]?.values||[]).forEach(e=>{let a=e[0],s=e[1];if(s)try{let e=JSON.parse(s);e.userPermissions&&e.userPermissions.some(e=>("ModifyAllData"===e.name||"ViewAllData"===e.name)&&e.enabled)&&(t.profilesWithModifyAll++,t.details.highPrivilegeProfiles.push(a))}catch{}});let i=e.exec(`
      SELECT api_name, metadata_json FROM nodes WHERE type = 'PermissionSet'
    `);(i[0]?.values||[]).forEach(e=>{let a=e[0],s=e[1];if(s)try{let e=JSON.parse(s);e.userPermissions&&e.userPermissions.some(e=>("ModifyAllData"===e.name||"ViewAllData"===e.name)&&e.enabled)&&(t.permissionSetsWithModifyAll++,t.details.highPrivilegePermSets.push(a))}catch{}});let n=e.exec(`
      SELECT api_name, metadata_json FROM nodes WHERE type = 'Flow'
    `);(n[0]?.values||[]).forEach(e=>{let a=e[0],s=e[1];if(s)try{let e=JSON.parse(s);("SystemModeWithoutSharing"===e.runInMode||"SystemModeWithSharing"===e.runInMode)&&(t.flowsRunAsSystem++,t.details.systemFlows.push(a))}catch{}});let r=e.exec(`
      SELECT api_name, metadata_json FROM nodes WHERE type = 'ApexClass'
    `);(r[0]?.values||[]).forEach(e=>{let a=e[0],s=e[1];if(s)try{let e=JSON.parse(s);(e.body?.toLowerCase().includes("without sharing")||"WithoutSharing"===e.sharingModel)&&(t.apexWithoutSharing++,t.details.unsecureApex.push(a))}catch{}});let d=e.exec(`
      SELECT api_name, metadata_json FROM nodes WHERE type = 'Object'
    `);return(d[0]?.values||[]).forEach(e=>{let a=e[1];if(a)try{let e=JSON.parse(a);("ReadWrite"===e.sharingModel||"Read"===e.sharingModel||"ReadWrite"===e.externalSharingModel)&&t.publicObjects++}catch{}}),e.close(),l.Z.json(t)}catch(e){return console.error("Security check error:",e),l.Z.json({error:"Failed to run security check"},{status:500})}}let p=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/health/security/route",pathname:"/api/health/security",filename:"route",bundlePath:"app/api/health/security/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\health\\security\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:u,staticGenerationAsyncStorage:y,serverHooks:E,headerHooks:f,staticGenerationBailout:_}=p,m="/api/health/security/route";function h(){return(0,r.patchFetch)({serverHooks:E,staticGenerationAsyncStorage:y})}},1494:(e,t,a)=>{a.d(t,{Fu:()=>g,Lw:()=>E,N8:()=>p,YE:()=>_,_P:()=>f,dV:()=>h,fy:()=>u,rZ:()=>m});var s=a(1017),i=a.n(s),n=a(7147),r=a.n(n);let l=(()=>{let e=i().resolve(__dirname,"..","..","..","..");if(r().existsSync(i().join(e,"packages","indexer","data")))return e;let t=process.cwd();return t.endsWith("apps/web")||t.endsWith("apps\\web")?i().resolve(t,"..",".."):r().existsSync(i().join(t,"packages","indexer","data"))?t:i().resolve(t,"..","..")})(),o=i().join(l,"packages","indexer","data","metadata.db"),d=null;async function c(){if(!d){let e=a(470),t=i().join(process.cwd(),"public","wasm","sql-wasm.wasm"),s=r().readFileSync(t);d=await e({wasmBinary:s})}return d}async function p(){if(!r().existsSync(o))return console.log("Database not found at:",o),null;let e=await c(),t=r().readFileSync(o);return new e.Database(t)}async function u(){let e=await p();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let t=t=>{let a=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${t}'`);return a[0]?.values[0]?.[0]||0};return{objects:t("Object"),fields:t("Field"),flows:t("Flow"),apexClasses:t("ApexClass"),apexTriggers:t("ApexTrigger"),lwc:t("LWC"),layouts:t("Layout"),permissionSets:t("PermissionSet"),profiles:t("Profile"),flexiPages:t("FlexiPage"),validationRules:t("ValidationRule"),quickActions:t("QuickAction"),recordTypes:t("RecordType")}}finally{e.close()}}function y(e){if(!e||0===e.length)return[];let t=e[0].columns;return e[0].values.map(e=>{let a={};return t.forEach((t,s)=>{a[t]=e[s]}),a})}async function E(e,t){let a=await p();if(!a)return null;try{let s=e.replace(/'/g,"''"),i=t.replace(/'/g,"''"),n=a.exec(`SELECT * FROM nodes WHERE api_name = '${s}' AND type = '${i}'`);return y(n)[0]||null}finally{a.close()}}async function f(e){let t=await p();if(!t)return[];try{let a=t.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return y(a)}finally{t.close()}}async function _(e){let t=await p();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return y(a)}finally{t.close()}}async function m(e){let t=await p();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return y(a)}finally{t.close()}}async function h(e,t=50,a){let s=await p();if(!s)return[];try{let i=e.replace(/'/g,"''"),n=a?.replace(/'/g,"''"),r="";e&&a?r=`WHERE (api_name LIKE '%${i}%' OR label LIKE '%${i}%') AND type = '${n}'`:e?r=`WHERE api_name LIKE '%${i}%' OR label LIKE '%${i}%'`:a&&(r=`WHERE type = '${n}'`);let l=s.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${r}
      ORDER BY
        CASE WHEN api_name LIKE '${i}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${t}
    `);return y(l)}finally{s.close()}}async function g(e,t=2){let a=await p();if(!a)return{nodes:[],edges:[]};try{let s=new Set,i=[],n=[],r=(e,l)=>{if(s.has(e)||l>t)return;s.add(e);let o=a.exec(`SELECT * FROM nodes WHERE id = ${e}`),d=y(o);if(d[0]){let e=d[0];i.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let c=a.exec(`SELECT * FROM edges WHERE source_id = ${e}`),p=a.exec(`SELECT * FROM edges WHERE target_id = ${e}`),u=y(c),E=y(p);for(let t of[...u,...E]){n.push({id:`${t.source_id}-${t.target_id}-${t.edge_type}`,source:String(t.source_id),target:String(t.target_id),label:t.edge_type.replace(/_/g," "),animated:t.edge_type.includes("FLOW")});let a=t.source_id===e?t.target_id:t.source_id;r(a,l+1)}};r(e,0);let l=Array.from(new Map(n.map(e=>[e.id,e])).values());return{nodes:i,edges:l}}finally{a.close()}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),s=t.X(0,[1638,6206],()=>a(9811));module.exports=s})();