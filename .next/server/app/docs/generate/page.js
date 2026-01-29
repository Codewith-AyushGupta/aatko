(()=>{var e={};e.id=9968,e.ids=[9968],e.modules={7849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},5403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},4749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3146:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>m,originalPathname:()=>p,pages:()=>c,routeModule:()=>x,tree:()=>o});var a=s(482),i=s(9108),l=s(2563),n=s.n(l),r=s(8300),d={};for(let e in r)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>r[e]);s.d(t,d);let o=["",{children:["docs",{children:["generate",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,8885)),"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\docs\\generate\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,3538)),"D:\\New folder (5)\\apps\\apps\\web\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,9361,23)),"next/dist/client/components/not-found-error"]}],c=["D:\\New folder (5)\\apps\\apps\\web\\src\\app\\docs\\generate\\page.tsx"],p="/docs/generate/page",m={require:s,loadChunk:()=>Promise.resolve()},x=new a.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/generate/page",pathname:"/docs/generate",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:o}})},8896:(e,t,s)=>{Promise.resolve().then(s.bind(s,3906))},3906:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>d});var a=s(5344),i=s(3729),l=s(6506);let n={Object:"\uD83D\uDCE6",Field:"\uD83D\uDCCB",Flow:"⚡",ApexClass:"\uD83D\uDCBB",ApexTrigger:"\uD83C\uDFAF",LWC:"⚛️",Layout:"\uD83D\uDCD0",FlexiPage:"\uD83D\uDCF1",PermissionSet:"\uD83D\uDD10",Profile:"\uD83D\uDC64",ValidationRule:"✅",RecordType:"\uD83D\uDCC1"},r=[{id:"",label:"All Types"},{id:"Object",label:"Objects"},{id:"Field",label:"Fields"},{id:"Flow",label:"Flows"},{id:"ApexClass",label:"Apex Classes"},{id:"ApexTrigger",label:"Triggers"},{id:"LWC",label:"LWCs"},{id:"Layout",label:"Layouts"},{id:"FlexiPage",label:"Lightning Pages"},{id:"PermissionSet",label:"Permission Sets"},{id:"Profile",label:"Profiles"},{id:"ValidationRule",label:"Validation Rules"},{id:"RecordType",label:"Record Types"}];function d(){let[e,t]=(0,i.useState)(""),[s,d]=(0,i.useState)(""),[o,c]=(0,i.useState)([]),[p,m]=(0,i.useState)([]),[x,h]=(0,i.useState)(null),[g,u]=(0,i.useState)(!1),[y,f]=(0,i.useState)(!1),[b,j]=(0,i.useState)(new Set);(0,i.useEffect)(()=>{if(!e||e.length<2){c([]);return}let t=setTimeout(async()=>{u(!0);try{let t=`/api/search?q=${encodeURIComponent(e)}&limit=30`;s&&(t+=`&type=${encodeURIComponent(s)}`);let a=await fetch(t),i=await a.json();c(i.results||[])}catch(e){console.error("Search failed:",e)}finally{u(!1)}},300);return()=>clearTimeout(t)},[e,s]);let N=e=>{p.find(t=>t.id===e.id)||m([...p,e]),t(""),c([])},v=e=>{m(p.filter(t=>t.id!==e))},D=async()=>{if(p.length){f(!0);try{let e=await fetch("/api/docs/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nodeIds:p.map(e=>e.id)})}),t=await e.json();h(t),j(new Set(t.items.map(e=>e.id)))}catch(e){console.error("Failed to generate documentation:",e)}finally{f(!1)}}},C=e=>{let t=new Set(b);t.has(e)?t.delete(e):t.add(e),j(t)};return(0,a.jsxs)("div",{className:"space-y-6",children:[a.jsx("div",{className:"flex items-center justify-between",children:(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"flex items-center gap-2 text-sm text-gray-500 mb-1",children:[a.jsx(l.default,{href:"/",className:"hover:text-acs-blue",children:"Home"}),a.jsx("span",{children:"/"}),a.jsx("span",{children:"Documentation"})]}),a.jsx("h1",{className:"text-2xl font-bold text-acs-navy",style:{fontFamily:"Georgia, serif"},children:"Generate Documentation"}),a.jsx("p",{className:"text-sm text-gray-500 mt-1",children:"Create comprehensive documentation for selected metadata components"})]})}),(0,a.jsxs)("div",{className:"grid lg:grid-cols-3 gap-6",children:[(0,a.jsxs)("div",{className:"space-y-4",children:[(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow p-4",children:[a.jsx("h2",{className:"font-semibold mb-3",children:"Select Metadata to Document"}),a.jsx("select",{value:s,onChange:e=>d(e.target.value),className:"w-full px-3 py-2 border rounded-lg mb-2 text-sm",children:r.map(e=>a.jsx("option",{value:e.id,children:e.label},e.id))}),a.jsx("input",{type:"text",value:e,onChange:e=>t(e.target.value),placeholder:`Search ${s?r.find(e=>e.id===s)?.label.toLowerCase():"all metadata"}...`,className:"w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-acs-blue"}),g&&a.jsx("div",{className:"mt-3 text-center text-gray-500 text-sm",children:"Searching..."}),o.length>0&&a.jsx("div",{className:"mt-3 max-h-60 overflow-y-auto border rounded-lg divide-y",children:o.map(e=>(0,a.jsxs)("button",{onClick:()=>N(e),disabled:p.some(t=>t.id===e.id),className:`w-full text-left px-3 py-2 hover:bg-gray-50 ${p.some(t=>t.id===e.id)?"opacity-50":""}`,children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[a.jsx("span",{children:n[e.type]||"\uD83D\uDCC4"}),a.jsx("span",{className:"font-medium text-sm",children:e.api_name})]}),e.label&&a.jsx("div",{className:"text-xs text-gray-500 ml-6",children:e.label}),a.jsx("div",{className:"text-xs text-gray-400 ml-6",children:e.type})]},e.id))})]}),(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow p-4",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-3",children:[(0,a.jsxs)("h2",{className:"font-semibold",children:["Selected (",p.length,")"]}),p.length>0&&a.jsx("button",{onClick:()=>m([]),className:"text-xs text-red-600 hover:text-red-800",children:"Clear All"})]}),0===p.length?a.jsx("p",{className:"text-sm text-gray-500",children:"No items selected. Search and add metadata above."}):a.jsx("div",{className:"space-y-2 max-h-64 overflow-y-auto",children:p.map(e=>(0,a.jsxs)("div",{className:"flex items-center justify-between bg-gray-50 rounded px-3 py-2",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2 min-w-0",children:[a.jsx("span",{children:n[e.type]||"\uD83D\uDCC4"}),a.jsx("span",{className:"text-sm font-medium truncate",children:e.api_name})]}),a.jsx("button",{onClick:()=>v(e.id),className:"text-gray-400 hover:text-red-600 ml-2",children:"\xd7"})]},e.id))}),a.jsx("button",{onClick:D,disabled:0===p.length||y,className:"w-full mt-4 px-4 py-2 bg-acs-blue text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-acs-navy transition-colors",children:y?"Generating...":"Generate Documentation"})]})]}),a.jsx("div",{className:"lg:col-span-2",children:x?(0,a.jsxs)("div",{className:"space-y-4",children:[(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow p-4",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[a.jsx("h2",{className:"font-semibold",children:"Documentation Summary"}),(0,a.jsxs)("div",{className:"flex gap-2",children:[a.jsx("button",{onClick:()=>{if(!x)return;let e=`# Metadata Documentation

`;e+=`Generated: ${new Date(x.generatedAt).toLocaleString()}

## Summary

- **Total Items:** ${x.summary.totalItems}
- **Total Relationships:** ${x.summary.totalRelationships}
- **Total Children:** ${x.summary.totalChildren}

### Items by Type

`,Object.entries(x.summary.itemsByType).forEach(([t,s])=>{e+=`- ${t}: ${s}
`}),e+=`
---

`,x.items.forEach(t=>{if(e+=`## ${n[t.type]||"\uD83D\uDCC4"} ${t.apiName}

**Type:** ${t.type}

`,t.label&&(e+=`**Label:** ${t.label}

`),t.description&&(e+=`**Description:** ${t.description}

`),t.filePath&&(e+=`**File Path:** \`${t.filePath}\`

`),void 0!==t.analytics.recordCount&&(e+=`**Record Count:** ${t.analytics.recordCount.toLocaleString()}

`),void 0!==t.analytics.populationRate&&(e+=`**Population Rate:** ${(100*t.analytics.populationRate).toFixed(1)}%

`),t.children.length>0&&(e+=`### Children (${t.children.length})

| Type | API Name | Label | Description |
|------|----------|-------|-------------|
`,t.children.forEach(t=>{e+=`| ${t.type} | ${t.apiName} | ${t.label||"-"} | ${t.description||"-"} |
`}),e+=`
`),t.relationships.length>0){e+=`### Relationships (${t.relationships.length})

`;let s=t.relationships.filter(e=>"incoming"===e.direction),a=t.relationships.filter(e=>"outgoing"===e.direction);s.length>0&&(e+=`#### Referenced By (${s.length})

`,s.forEach(t=>{e+=`- ${n[t.nodeType]||"\uD83D\uDCC4"} **${t.apiName}** (${t.nodeType}) - ${t.edgeType.replace(/_/g," ")}
`}),e+=`
`),a.length>0&&(e+=`#### References (${a.length})

`,a.forEach(t=>{e+=`- ${n[t.nodeType]||"\uD83D\uDCC4"} **${t.apiName}** (${t.nodeType}) - ${t.edgeType.replace(/_/g," ")}
`}),e+=`
`)}e+=`---

`});let t=new Blob([e],{type:"text/markdown"}),s=URL.createObjectURL(t),a=document.createElement("a");a.href=s,a.download=`metadata-documentation-${new Date().toISOString().split("T")[0]}.md`,a.click(),URL.revokeObjectURL(s)},className:"px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded",children:"Export Markdown"}),a.jsx("button",{onClick:()=>{if(!x)return;let e=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Metadata Documentation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #002855; border-bottom: 2px solid #004bac; padding-bottom: 10px; }
    h2 { color: #004bac; margin-top: 40px; }
    h3 { color: #333; }
    .summary { background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .item { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .item-header { display: flex; align-items: center; gap: 10px; }
    .type-badge { background: #e3f2fd; color: #1565c0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f5f7fa; font-weight: 600; }
    .relationship { padding: 8px; margin: 5px 0; background: #fafafa; border-radius: 4px; }
    .incoming { border-left: 3px solid #4caf50; }
    .outgoing { border-left: 3px solid #2196f3; }
    .meta { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Metadata Documentation</h1>
  <p class="meta">Generated: ${new Date(x.generatedAt).toLocaleString()}</p>

  <div class="summary">
    <h3>Summary</h3>
    <ul>
      <li><strong>Total Items:</strong> ${x.summary.totalItems}</li>
      <li><strong>Total Relationships:</strong> ${x.summary.totalRelationships}</li>
      <li><strong>Total Children:</strong> ${x.summary.totalChildren}</li>
    </ul>
    <h4>Items by Type</h4>
    <ul>
      ${Object.entries(x.summary.itemsByType).map(([e,t])=>`<li>${e}: ${t}</li>`).join("")}
    </ul>
  </div>
`;x.items.forEach(t=>{if(e+=`
  <div class="item">
    <div class="item-header">
      <span style="font-size: 24px">${n[t.type]||"\uD83D\uDCC4"}</span>
      <h2 style="margin: 0">${t.apiName}</h2>
      <span class="type-badge">${t.type}</span>
    </div>
    ${t.label?`<p><strong>Label:</strong> ${t.label}</p>`:""}
    ${t.description?`<p><strong>Description:</strong> ${t.description}</p>`:""}
    ${t.filePath?`<p><strong>File Path:</strong> <code>${t.filePath}</code></p>`:""}
    ${void 0!==t.analytics.recordCount?`<p><strong>Record Count:</strong> ${t.analytics.recordCount.toLocaleString()}</p>`:""}
    ${void 0!==t.analytics.populationRate?`<p><strong>Population Rate:</strong> ${(100*t.analytics.populationRate).toFixed(1)}%</p>`:""}
`,t.children.length>0&&(e+=`
    <h3>Children (${t.children.length})</h3>
    <table>
      <thead>
        <tr><th>Type</th><th>API Name</th><th>Label</th><th>Description</th></tr>
      </thead>
      <tbody>
        ${t.children.map(e=>`
        <tr>
          <td>${e.type}</td>
          <td>${e.apiName}</td>
          <td>${e.label||"-"}</td>
          <td>${e.description||"-"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
`),t.relationships.length>0){let s=t.relationships.filter(e=>"incoming"===e.direction),a=t.relationships.filter(e=>"outgoing"===e.direction);e+=`<h3>Relationships (${t.relationships.length})</h3>`,s.length>0&&(e+=`<h4>Referenced By (${s.length})</h4>`,s.forEach(t=>{e+=`<div class="relationship incoming">${n[t.nodeType]||"\uD83D\uDCC4"} <strong>${t.apiName}</strong> (${t.nodeType}) - ${t.edgeType.replace(/_/g," ")}</div>`})),a.length>0&&(e+=`<h4>References (${a.length})</h4>`,a.forEach(t=>{e+=`<div class="relationship outgoing">${n[t.nodeType]||"\uD83D\uDCC4"} <strong>${t.apiName}</strong> (${t.nodeType}) - ${t.edgeType.replace(/_/g," ")}</div>`}))}e+="</div>"}),e+="</body></html>";let t=new Blob([e],{type:"text/html"}),s=URL.createObjectURL(t),a=document.createElement("a");a.href=s,a.download=`metadata-documentation-${new Date().toISOString().split("T")[0]}.html`,a.click(),URL.revokeObjectURL(s)},className:"px-3 py-1 text-sm bg-acs-blue text-white hover:bg-acs-navy rounded",children:"Export HTML"})]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-3 gap-4 text-center",children:[(0,a.jsxs)("div",{className:"bg-blue-50 rounded-lg p-3",children:[a.jsx("div",{className:"text-2xl font-bold text-blue-600",children:x.summary.totalItems}),a.jsx("div",{className:"text-xs text-gray-500",children:"Items"})]}),(0,a.jsxs)("div",{className:"bg-green-50 rounded-lg p-3",children:[a.jsx("div",{className:"text-2xl font-bold text-green-600",children:x.summary.totalChildren}),a.jsx("div",{className:"text-xs text-gray-500",children:"Children"})]}),(0,a.jsxs)("div",{className:"bg-purple-50 rounded-lg p-3",children:[a.jsx("div",{className:"text-2xl font-bold text-purple-600",children:x.summary.totalRelationships}),a.jsx("div",{className:"text-xs text-gray-500",children:"Relationships"})]})]}),a.jsx("div",{className:"mt-4 flex flex-wrap gap-2",children:Object.entries(x.summary.itemsByType).map(([e,t])=>(0,a.jsxs)("span",{className:"px-2 py-1 text-xs bg-gray-100 rounded-full",children:[n[e]||"\uD83D\uDCC4"," ",e,": ",t]},e))})]}),x.items.map(e=>(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow overflow-hidden",children:[(0,a.jsxs)("button",{onClick:()=>C(e.id),className:"w-full flex items-center justify-between p-4 hover:bg-gray-50",children:[(0,a.jsxs)("div",{className:"flex items-center gap-3",children:[a.jsx("span",{className:"text-2xl",children:n[e.type]||"\uD83D\uDCC4"}),(0,a.jsxs)("div",{className:"text-left",children:[a.jsx("h3",{className:"font-semibold text-acs-navy",children:e.apiName}),(0,a.jsxs)("div",{className:"flex items-center gap-2 text-sm text-gray-500",children:[a.jsx("span",{className:"px-2 py-0.5 bg-gray-100 rounded text-xs",children:e.type}),e.label&&a.jsx("span",{children:e.label})]})]})]}),a.jsx("svg",{className:`w-5 h-5 text-gray-400 transition-transform ${b.has(e.id)?"rotate-180":""}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 9l-7 7-7-7"})})]}),b.has(e.id)&&(0,a.jsxs)("div",{className:"border-t px-4 py-4 space-y-4",children:[e.description&&(0,a.jsxs)("div",{children:[a.jsx("h4",{className:"text-sm font-medium text-gray-700 mb-1",children:"Description"}),a.jsx("p",{className:"text-sm text-gray-600",children:e.description})]}),(void 0!==e.analytics.recordCount||void 0!==e.analytics.populationRate)&&(0,a.jsxs)("div",{className:"flex gap-4",children:[void 0!==e.analytics.recordCount&&(0,a.jsxs)("div",{className:"bg-gray-50 rounded px-3 py-2",children:[a.jsx("div",{className:"text-lg font-semibold",children:e.analytics.recordCount.toLocaleString()}),a.jsx("div",{className:"text-xs text-gray-500",children:"Records"})]}),void 0!==e.analytics.populationRate&&(0,a.jsxs)("div",{className:"bg-gray-50 rounded px-3 py-2",children:[(0,a.jsxs)("div",{className:"text-lg font-semibold",children:[(100*e.analytics.populationRate).toFixed(1),"%"]}),a.jsx("div",{className:"text-xs text-gray-500",children:"Population Rate"})]})]}),e.children.length>0&&(0,a.jsxs)("div",{children:[(0,a.jsxs)("h4",{className:"text-sm font-medium text-gray-700 mb-2",children:["Children (",e.children.length,")"]}),a.jsx("div",{className:"overflow-x-auto",children:(0,a.jsxs)("table",{className:"w-full text-sm",children:[a.jsx("thead",{children:(0,a.jsxs)("tr",{className:"bg-gray-50",children:[a.jsx("th",{className:"px-3 py-2 text-left font-medium",children:"Type"}),a.jsx("th",{className:"px-3 py-2 text-left font-medium",children:"API Name"}),a.jsx("th",{className:"px-3 py-2 text-left font-medium",children:"Label"}),a.jsx("th",{className:"px-3 py-2 text-left font-medium",children:"Description"})]})}),a.jsx("tbody",{className:"divide-y",children:e.children.map(e=>(0,a.jsxs)("tr",{className:"hover:bg-gray-50",children:[(0,a.jsxs)("td",{className:"px-3 py-2",children:[n[e.type]||"\uD83D\uDCC4"," ",e.type]}),a.jsx("td",{className:"px-3 py-2 font-medium",children:e.apiName}),a.jsx("td",{className:"px-3 py-2 text-gray-600",children:e.label||"-"}),a.jsx("td",{className:"px-3 py-2 text-gray-500 text-xs",children:e.description||"-"})]},e.id))})]})})]}),e.relationships.length>0&&(0,a.jsxs)("div",{children:[(0,a.jsxs)("h4",{className:"text-sm font-medium text-gray-700 mb-2",children:["Relationships (",e.relationships.length,")"]}),(0,a.jsxs)("div",{className:"grid md:grid-cols-2 gap-4",children:[e.relationships.filter(e=>"incoming"===e.direction).length>0&&(0,a.jsxs)("div",{children:[(0,a.jsxs)("h5",{className:"text-xs font-medium text-green-700 mb-2 uppercase",children:["Referenced By (",e.relationships.filter(e=>"incoming"===e.direction).length,")"]}),(0,a.jsxs)("div",{className:"space-y-1",children:[e.relationships.filter(e=>"incoming"===e.direction).slice(0,10).map((e,t)=>(0,a.jsxs)(l.default,{href:`/analysis/impact?nodeId=${e.nodeId}`,className:"flex items-center gap-2 text-sm p-2 bg-green-50 rounded hover:bg-green-100",children:[a.jsx("span",{children:n[e.nodeType]||"\uD83D\uDCC4"}),a.jsx("span",{className:"font-medium",children:e.apiName}),a.jsx("span",{className:"text-xs text-gray-500",children:e.edgeType.replace(/_/g," ")})]},t)),e.relationships.filter(e=>"incoming"===e.direction).length>10&&(0,a.jsxs)("div",{className:"text-xs text-gray-500 p-2",children:["+",e.relationships.filter(e=>"incoming"===e.direction).length-10," more"]})]})]}),e.relationships.filter(e=>"outgoing"===e.direction).length>0&&(0,a.jsxs)("div",{children:[(0,a.jsxs)("h5",{className:"text-xs font-medium text-blue-700 mb-2 uppercase",children:["References (",e.relationships.filter(e=>"outgoing"===e.direction).length,")"]}),(0,a.jsxs)("div",{className:"space-y-1",children:[e.relationships.filter(e=>"outgoing"===e.direction).slice(0,10).map((e,t)=>(0,a.jsxs)(l.default,{href:`/analysis/impact?nodeId=${e.nodeId}`,className:"flex items-center gap-2 text-sm p-2 bg-blue-50 rounded hover:bg-blue-100",children:[a.jsx("span",{children:n[e.nodeType]||"\uD83D\uDCC4"}),a.jsx("span",{className:"font-medium",children:e.apiName}),a.jsx("span",{className:"text-xs text-gray-500",children:e.edgeType.replace(/_/g," ")})]},t)),e.relationships.filter(e=>"outgoing"===e.direction).length>10&&(0,a.jsxs)("div",{className:"text-xs text-gray-500 p-2",children:["+",e.relationships.filter(e=>"outgoing"===e.direction).length-10," more"]})]})]})]})]}),e.filePath&&(0,a.jsxs)("div",{className:"text-xs text-gray-400",children:[a.jsx("span",{className:"font-medium",children:"Source:"})," ",e.filePath]})]})]},e.id))]}):(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow p-8 text-center",children:[a.jsx("div",{className:"text-6xl mb-4",children:"\uD83D\uDCDD"}),a.jsx("h2",{className:"text-xl font-semibold text-gray-700 mb-2",children:"Ready to Generate"}),a.jsx("p",{className:"text-gray-500",children:'Select metadata items from the left panel and click "Generate Documentation" to create comprehensive documentation.'})]})})]})]})}},8885:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>l,__esModule:()=>i,default:()=>n});let a=(0,s(6843).createProxy)(String.raw`D:\New folder (5)\apps\apps\web\src\app\docs\generate\page.tsx`),{__esModule:i,$$typeof:l}=a,n=a.default}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),a=t.X(0,[1638,7173,5543],()=>s(3146));module.exports=a})();