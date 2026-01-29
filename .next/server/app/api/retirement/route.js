"use strict";(()=>{var e={};e.id=1742,e.ids=[1742],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},470:e=>{e.exports=require("sql.js")},7147:e=>{e.exports=require("fs")},1017:e=>{e.exports=require("path")},8961:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>y,originalPathname:()=>m,patchFetch:()=>g,requestAsyncStorage:()=>c,routeModule:()=>u,serverHooks:()=>E,staticGenerationAsyncStorage:()=>_,staticGenerationBailout:()=>f});var n={};a.r(n),a.d(n,{GET:()=>p,dynamic:()=>d});var i=a(5419),r=a(9108),s=a(9678),l=a(8070),o=a(1494);let d="force-dynamic";async function p(e){let t=e.nextUrl.searchParams,a=t.get("type")||"",n=parseFloat(t.get("minPopulationRate")||"0"),i=parseFloat(t.get("maxPopulationRate")||"0.1"),r="true"===t.get("includeWithDependents");try{let e=await (0,o.N8)();if(!e)return l.Z.json({error:"Database not available"},{status:500});let t=[],s="";s=a?`AND n.type = '${a}'`:"AND n.type IN ('Field', 'Object', 'Flow', 'ApexClass', 'ValidationRule')";let d=e.exec(`
      SELECT
        n.id,
        n.api_name,
        n.label,
        n.type,
        n.parent_id,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE 1=1 ${s}
      GROUP BY n.id
      ORDER BY
        COALESCE(MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END), 0) ASC,
        n.type, n.api_name
      LIMIT 500
    `),p=new Map,u=new Set;if((d[0]?.values||[]).forEach(e=>{e[4]&&u.add(e[4])}),u.size>0){let t=e.exec(`
        SELECT id, api_name FROM nodes WHERE id IN (${Array.from(u).join(",")})
      `);(t[0]?.values||[]).forEach(e=>{p.set(e[0],e[1])})}for(let a of d[0]?.values||[]){let s=a[0],l=a[1],o=a[2],d=a[3],u=a[4],c=a[5],_=a[6];if("Field"===d&&!l.endsWith("__c")||null!==_&&(_<n||_>i))continue;let E=e.exec(`
        SELECT COUNT(DISTINCT source_id) as count
        FROM edges
        WHERE target_id = ${s}
      `),y=E[0]?.values[0]?.[0]||0;if(!r&&y>0)continue;let f=[];if(null!==_&&0===_?f.push("No data (0% population)"):null!==_&&_<.01?f.push("Very low usage (<1% population)"):null!==_&&_<.05?f.push("Low usage (<5% population)"):null!==_&&_<.1&&f.push("Below threshold (<10% population)"),0===c&&f.push("No records"),0===y&&f.push("No dependencies"),0===f.length)continue;let m="safe";y>5?m="high":y>2?m="medium":y>0&&(m="low"),t.push({id:s,apiName:l,label:o,type:d,parentName:u?p.get(u):void 0,reason:f,riskLevel:m,dependentCount:y,recordCount:c??void 0,populationRate:_??void 0})}e.close();let c={},_={safe:0,low:0,medium:0,high:0};t.forEach(e=>{c[e.type]=(c[e.type]||0)+1,_[e.riskLevel]++});let E={candidates:t,summary:{total:t.length,byType:c,byRisk:_,safeToRemove:_.safe}};return l.Z.json(E)}catch(e){return console.error("Retirement analysis error:",e),l.Z.json({error:"Failed to analyze retirement candidates"},{status:500})}}let u=new i.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/retirement/route",pathname:"/api/retirement",filename:"route",bundlePath:"app/api/retirement/route"},resolvedPagePath:"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\api\\retirement\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:c,staticGenerationAsyncStorage:_,serverHooks:E,headerHooks:y,staticGenerationBailout:f}=u,m="/api/retirement/route";function g(){return(0,s.patchFetch)({serverHooks:E,staticGenerationAsyncStorage:_})}},1494:(e,t,a)=>{a.d(t,{Fu:()=>R,Lw:()=>E,N8:()=>u,YE:()=>f,_P:()=>y,dV:()=>g,fy:()=>c,rZ:()=>m});var n=a(1017),i=a.n(n),r=a(7147),s=a.n(r);let l=(()=>{let e=i().resolve(__dirname,"..","..","..","..");if(s().existsSync(i().join(e,"packages","indexer","data")))return e;let t=process.cwd();return t.endsWith("apps/web")||t.endsWith("apps\\web")?i().resolve(t,"..",".."):s().existsSync(i().join(t,"packages","indexer","data"))?t:i().resolve(t,"..","..")})(),o=i().join(l,"packages","indexer","data","metadata.db"),d=null;async function p(){if(!d){let e=a(470),t=i().join(process.cwd(),"public","wasm","sql-wasm.wasm"),n=s().readFileSync(t);d=await e({wasmBinary:n})}return d}async function u(){if(!s().existsSync(o))return console.log("Database not found at:",o),null;let e=await p(),t=s().readFileSync(o);return new e.Database(t)}async function c(){let e=await u();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let t=t=>{let a=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${t}'`);return a[0]?.values[0]?.[0]||0};return{objects:t("Object"),fields:t("Field"),flows:t("Flow"),apexClasses:t("ApexClass"),apexTriggers:t("ApexTrigger"),lwc:t("LWC"),layouts:t("Layout"),permissionSets:t("PermissionSet"),profiles:t("Profile"),flexiPages:t("FlexiPage"),validationRules:t("ValidationRule"),quickActions:t("QuickAction"),recordTypes:t("RecordType")}}finally{e.close()}}function _(e){if(!e||0===e.length)return[];let t=e[0].columns;return e[0].values.map(e=>{let a={};return t.forEach((t,n)=>{a[t]=e[n]}),a})}async function E(e,t){let a=await u();if(!a)return null;try{let n=e.replace(/'/g,"''"),i=t.replace(/'/g,"''"),r=a.exec(`SELECT * FROM nodes WHERE api_name = '${n}' AND type = '${i}'`);return _(r)[0]||null}finally{a.close()}}async function y(e){let t=await u();if(!t)return[];try{let a=t.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return _(a)}finally{t.close()}}async function f(e){let t=await u();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(a)}finally{t.close()}}async function m(e){let t=await u();if(!t)return[];try{let a=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return _(a)}finally{t.close()}}async function g(e,t=50,a){let n=await u();if(!n)return[];try{let i=e.replace(/'/g,"''"),r=a?.replace(/'/g,"''"),s="";e&&a?s=`WHERE (api_name LIKE '%${i}%' OR label LIKE '%${i}%') AND type = '${r}'`:e?s=`WHERE api_name LIKE '%${i}%' OR label LIKE '%${i}%'`:a&&(s=`WHERE type = '${r}'`);let l=n.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${s}
      ORDER BY
        CASE WHEN api_name LIKE '${i}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${t}
    `);return _(l)}finally{n.close()}}async function R(e,t=2){let a=await u();if(!a)return{nodes:[],edges:[]};try{let n=new Set,i=[],r=[],s=(e,l)=>{if(n.has(e)||l>t)return;n.add(e);let o=a.exec(`SELECT * FROM nodes WHERE id = ${e}`),d=_(o);if(d[0]){let e=d[0];i.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let p=a.exec(`SELECT * FROM edges WHERE source_id = ${e}`),u=a.exec(`SELECT * FROM edges WHERE target_id = ${e}`),c=_(p),E=_(u);for(let t of[...c,...E]){r.push({id:`${t.source_id}-${t.target_id}-${t.edge_type}`,source:String(t.source_id),target:String(t.target_id),label:t.edge_type.replace(/_/g," "),animated:t.edge_type.includes("FLOW")});let a=t.source_id===e?t.target_id:t.source_id;s(a,l+1)}};s(e,0);let l=Array.from(new Map(r.map(e=>[e.id,e])).values());return{nodes:i,edges:l}}finally{a.close()}}}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),n=t.X(0,[1638,6206],()=>a(8961));module.exports=n})();