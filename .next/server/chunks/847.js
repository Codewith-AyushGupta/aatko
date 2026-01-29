"use strict";exports.id=847,exports.ids=[847],exports.modules={1494:(e,t,n)=>{n.d(t,{Fu:()=>I,Lw:()=>u,N8:()=>_,YE:()=>N,_P:()=>p,dV:()=>R,fy:()=>T,rZ:()=>g});var i=n(1017),s=n.n(i),a=n(7147),r=n.n(a);let E=(()=>{let e=s().resolve(__dirname,"..","..","..","..");if(r().existsSync(s().join(e,"packages","indexer","data")))return e;let t=process.cwd();return t.endsWith("apps/web")||t.endsWith("apps\\web")?s().resolve(t,"..",".."):r().existsSync(s().join(t,"packages","indexer","data"))?t:s().resolve(t,"..","..")})(),o=s().join(E,"packages","indexer","data","metadata.db"),c=null;async function d(){if(!c){let e=n(470),t=s().join(process.cwd(),"public","wasm","sql-wasm.wasm"),i=r().readFileSync(t);c=await e({wasmBinary:i})}return c}async function _(){if(!r().existsSync(o))return console.log("Database not found at:",o),null;let e=await d(),t=r().readFileSync(o);return new e.Database(t)}async function T(){let e=await _();if(!e)return{objects:0,fields:0,flows:0,apexClasses:0,apexTriggers:0,lwc:0,layouts:0,permissionSets:0,profiles:0,flexiPages:0,validationRules:0,quickActions:0,recordTypes:0};try{let t=t=>{let n=e.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${t}'`);return n[0]?.values[0]?.[0]||0};return{objects:t("Object"),fields:t("Field"),flows:t("Flow"),apexClasses:t("ApexClass"),apexTriggers:t("ApexTrigger"),lwc:t("LWC"),layouts:t("Layout"),permissionSets:t("PermissionSet"),profiles:t("Profile"),flexiPages:t("FlexiPage"),validationRules:t("ValidationRule"),quickActions:t("QuickAction"),recordTypes:t("RecordType")}}finally{e.close()}}function l(e){if(!e||0===e.length)return[];let t=e[0].columns;return e[0].values.map(e=>{let n={};return t.forEach((t,i)=>{n[t]=e[i]}),n})}async function u(e,t){let n=await _();if(!n)return null;try{let i=e.replace(/'/g,"''"),s=t.replace(/'/g,"''"),a=n.exec(`SELECT * FROM nodes WHERE api_name = '${i}' AND type = '${s}'`);return l(a)[0]||null}finally{n.close()}}async function p(e){let t=await _();if(!t)return[];try{let n=t.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${e}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);return l(n)}finally{t.close()}}async function N(e){let t=await _();if(!t)return[];try{let n=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return l(n)}finally{t.close()}}async function g(e){let t=await _();if(!t)return[];try{let n=t.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${e}
      ORDER BY e.edge_type, n.api_name
    `);return l(n)}finally{t.close()}}async function R(e,t=50,n){let i=await _();if(!i)return[];try{let s=e.replace(/'/g,"''"),a=n?.replace(/'/g,"''"),r="";e&&n?r=`WHERE (api_name LIKE '%${s}%' OR label LIKE '%${s}%') AND type = '${a}'`:e?r=`WHERE api_name LIKE '%${s}%' OR label LIKE '%${s}%'`:n&&(r=`WHERE type = '${a}'`);let E=i.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${r}
      ORDER BY
        CASE WHEN api_name LIKE '${s}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${t}
    `);return l(E)}finally{i.close()}}async function I(e,t=2){let n=await _();if(!n)return{nodes:[],edges:[]};try{let i=new Set,s=[],a=[],r=(e,E)=>{if(i.has(e)||E>t)return;i.add(e);let o=n.exec(`SELECT * FROM nodes WHERE id = ${e}`),c=l(o);if(c[0]){let e=c[0];s.push({id:String(e.id),type:e.type.toLowerCase(),data:{label:e.api_name,nodeType:e.type},position:{x:0,y:0}})}let d=n.exec(`SELECT * FROM edges WHERE source_id = ${e}`),_=n.exec(`SELECT * FROM edges WHERE target_id = ${e}`),T=l(d),u=l(_);for(let t of[...T,...u]){a.push({id:`${t.source_id}-${t.target_id}-${t.edge_type}`,source:String(t.source_id),target:String(t.target_id),label:t.edge_type.replace(/_/g," "),animated:t.edge_type.includes("FLOW")});let n=t.source_id===e?t.target_id:t.source_id;r(n,E+1)}};r(e,0);let E=Array.from(new Map(a.map(e=>[e.id,e])).values());return{nodes:s,edges:E}}finally{n.close()}}},847:(e,t,n)=>{n.d(t,{o0:()=>d});var i=n(651),s=n(3966);async function a(e){try{let t=e.exec("SELECT version FROM schema_migrations ORDER BY version");if(t.length>0)return t[0].values.map(e=>e[0])}catch{}return[]}async function r(e){let t=[],n=0;try{let r=await a(e);for(let a of(n=r.length>0?Math.max(...r):0,s.kg.info("Starting migrations",{currentVersion:n,targetVersion:i.bI,pendingCount:i.cF.filter(e=>!r.includes(e.version)).length}),i.cF)){if(r.includes(a.version)){s.kg.debug(`Migration ${a.version} already applied, skipping`);continue}s.kg.info(`Applying migration ${a.version}: ${a.name}`);try{e.run(a.up),e.run("INSERT INTO schema_migrations (version, name) VALUES (?, ?)",[a.version,a.name]),t.push(a.version),n=a.version,s.kg.info(`Migration ${a.version} applied successfully`)}catch(e){throw s.kg.error(`Migration ${a.version} failed`,{error:e.message}),e}}return s.kg.info("Migrations completed",{appliedCount:t.length,currentVersion:n}),{success:!0,appliedMigrations:t,currentVersion:n}}catch(e){return s.kg.error("Migration failed",{error:e.message}),{success:!1,appliedMigrations:t,currentVersion:n,error:e.message}}}n(3900);var E=n(1494);let o=!1;async function c(){if(o)return;let e=await (0,E.N8)();if(!e){s.kg.warn("Database not available, skipping multi-client initialization");return}try{let t=await r(e);t.success?(s.kg.info("Multi-client database initialized",{version:t.currentVersion,migrationsApplied:t.appliedMigrations.length}),o=!0):s.kg.error("Multi-client database initialization failed",{error:t.error})}finally{e.close()}}async function d(){let e=await (0,E.N8)();return e?(o||await c(),{db:e,repos:{clients:new(await Promise.resolve().then(n.bind(n,3900))).ClientWorkspaceRepository(e),orgs:new(await Promise.resolve().then(n.bind(n,3900))).OrgConnectionRepository(e),snapshots:new(await Promise.resolve().then(n.bind(n,3900))).SnapshotRunRepository(e),audit:new(await Promise.resolve().then(n.bind(n,3900))).AuditEventRepository(e)},close:()=>e.close()}):null}},3900:(e,t,n)=>{n.r(t),n.d(t,{AuditEventRepository:()=>d,ClientWorkspaceRepository:()=>E,OrgConnectionRepository:()=>o,SnapshotRunRepository:()=>c,createRepositories:()=>_});var i=n(651),s=n(3966);function a(e){if(!e||0===e.length)return[];let t=e[0].columns;return e[0].values.map(e=>{let n={};return t.forEach((t,i)=>{t.startsWith("is_")&&"number"==typeof e[i]?n[t]=1===e[i]:n[t]=e[i]}),n})}function r(e){return a(e)[0]||null}class E{constructor(e){this.db=e}async create(e){let t=e.slug||(0,i.Uu)(e.name);if(!(0,i.L$)(t))throw Error(`Invalid slug: ${t}`);let n=JSON.stringify(e.settings||{});this.db.run(`INSERT INTO client_workspaces (slug, name, description, created_by, settings_json)
       VALUES (?, ?, ?, ?, ?)`,[t,e.name,e.description||null,e.created_by||null,n]);let a=r(this.db.exec("SELECT * FROM client_workspaces WHERE slug = ?",[t]));if(!a)throw Error("Failed to create client workspace");return s.kg.info("Client workspace created",{clientId:a.id,slug:a.slug}),a}async findById(e){return r(this.db.exec("SELECT * FROM client_workspaces WHERE id = ?",[e]))}async findBySlug(e){return r(this.db.exec("SELECT * FROM client_workspaces WHERE slug = ?",[e]))}async findAll(e=!1){return a(this.db.exec(e?"SELECT * FROM client_workspaces ORDER BY name":"SELECT * FROM client_workspaces WHERE is_active = 1 ORDER BY name"))}async update(e,t){let n=[],i=[];return void 0!==t.name&&(n.push("name = ?"),i.push(t.name)),void 0!==t.description&&(n.push("description = ?"),i.push(t.description)),void 0!==t.is_active&&(n.push("is_active = ?"),i.push(t.is_active?1:0)),void 0!==t.settings&&(n.push("settings_json = ?"),i.push(JSON.stringify(t.settings))),0===n.length||(n.push("updated_at = datetime('now')"),i.push(e),this.db.run(`UPDATE client_workspaces SET ${n.join(", ")} WHERE id = ?`,i)),this.findById(e)}async delete(e){return this.db.run("DELETE FROM client_workspaces WHERE id = ?",[e]),!0}async count(){let e=this.db.exec("SELECT COUNT(*) as count FROM client_workspaces WHERE is_active = 1");return e[0]?.values[0]?.[0]||0}}class o{constructor(e){this.db=e}async create(e){let t=JSON.stringify(e.metadata||{});this.db.run(`INSERT INTO org_connections
       (client_id, alias, org_id, instance_url, environment, auth_type, created_by, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,[e.client_id,e.alias,e.org_id||null,e.instance_url||null,e.environment,e.auth_type,e.created_by||null,t]);let n=r(this.db.exec("SELECT * FROM org_connections WHERE client_id = ? AND alias = ?",[e.client_id,e.alias]));if(!n)throw Error("Failed to create org connection");return s.kg.info("Org connection created",{orgId:n.id,alias:n.alias,clientId:n.client_id}),n}async findById(e){return r(this.db.exec("SELECT * FROM org_connections WHERE id = ?",[e]))}async findByClientId(e,t=!1){return a(this.db.exec(t?"SELECT * FROM org_connections WHERE client_id = ? ORDER BY is_default DESC, alias":"SELECT * FROM org_connections WHERE client_id = ? AND is_active = 1 ORDER BY is_default DESC, alias",[e]))}async findDefault(e){return r(this.db.exec("SELECT * FROM org_connections WHERE client_id = ? AND is_default = 1 AND is_active = 1",[e]))}async update(e,t){let n=[],i=[];return void 0!==t.alias&&(n.push("alias = ?"),i.push(t.alias)),void 0!==t.org_id&&(n.push("org_id = ?"),i.push(t.org_id)),void 0!==t.instance_url&&(n.push("instance_url = ?"),i.push(t.instance_url)),void 0!==t.environment&&(n.push("environment = ?"),i.push(t.environment)),void 0!==t.auth_type&&(n.push("auth_type = ?"),i.push(t.auth_type)),void 0!==t.is_active&&(n.push("is_active = ?"),i.push(t.is_active?1:0)),void 0!==t.is_default&&(n.push("is_default = ?"),i.push(t.is_default?1:0)),void 0!==t.connection_status&&(n.push("connection_status = ?"),i.push(t.connection_status)),void 0!==t.metadata&&(n.push("metadata_json = ?"),i.push(JSON.stringify(t.metadata))),0===n.length||(n.push("updated_at = datetime('now')"),i.push(e),this.db.run(`UPDATE org_connections SET ${n.join(", ")} WHERE id = ?`,i)),this.findById(e)}async setDefault(e,t){this.db.run("UPDATE org_connections SET is_default = 0 WHERE client_id = ?",[e]),this.db.run("UPDATE org_connections SET is_default = 1 WHERE id = ? AND client_id = ?",[t,e])}async updateLastSync(e){this.db.run("UPDATE org_connections SET last_sync_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",[e])}async updateConnectionStatus(e,t){this.db.run("UPDATE org_connections SET connection_status = ?, last_connected_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",[t,e])}async delete(e){return this.db.run("DELETE FROM org_connections WHERE id = ?",[e]),!0}}class c{constructor(e){this.db=e}async create(e){this.db.run(`INSERT INTO snapshot_runs (client_id, org_connection_id, triggered_by, trigger_type)
       VALUES (?, ?, ?, ?)`,[e.client_id,e.org_connection_id,e.triggered_by||null,e.trigger_type||"manual"]);let t=r(this.db.exec("SELECT * FROM snapshot_runs WHERE id = last_insert_rowid()"));if(!t)throw Error("Failed to create snapshot run");return s.kg.info("Snapshot run created",{snapshotId:t.id,clientId:t.client_id}),t}async findById(e){return r(this.db.exec("SELECT * FROM snapshot_runs WHERE id = ?",[e]))}async findByClientId(e,t=20){return a(this.db.exec("SELECT * FROM snapshot_runs WHERE client_id = ? ORDER BY created_at DESC LIMIT ?",[e,t]))}async findByOrgId(e,t=20){return a(this.db.exec("SELECT * FROM snapshot_runs WHERE org_connection_id = ? ORDER BY created_at DESC LIMIT ?",[e,t]))}async findRunning(){return a(this.db.exec("SELECT * FROM snapshot_runs WHERE status IN ('pending', 'running')"))}async update(e,t){let n=[],i=[];return void 0!==t.status&&(n.push("status = ?"),i.push(t.status),"running"===t.status?n.push("started_at = datetime('now')"):["completed","failed","cancelled"].includes(t.status)&&n.push("completed_at = datetime('now')")),void 0!==t.progress&&(n.push("progress = ?"),i.push(t.progress)),void 0!==t.progress_message&&(n.push("progress_message = ?"),i.push(t.progress_message)),void 0!==t.error_message&&(n.push("error_message = ?"),i.push(t.error_message)),void 0!==t.stats&&(n.push("stats_json = ?"),i.push(JSON.stringify(t.stats))),0===n.length||(i.push(e),this.db.run(`UPDATE snapshot_runs SET ${n.join(", ")} WHERE id = ?`,i)),this.findById(e)}}class d{constructor(e){this.db=e}async create(e){let t=JSON.stringify(e.details||{});this.db.run(`INSERT INTO audit_events
       (client_id, org_connection_id, event_type, event_category, actor, actor_type,
        resource_type, resource_id, details_json, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[e.client_id||null,e.org_connection_id||null,e.event_type,e.event_category,e.actor||null,e.actor_type||"user",e.resource_type||null,e.resource_id||null,t,e.ip_address||null,e.user_agent||null]);let n=r(this.db.exec("SELECT * FROM audit_events WHERE id = last_insert_rowid()"));if(!n)throw Error("Failed to create audit event");return n}async findByClientId(e,t=100){return a(this.db.exec("SELECT * FROM audit_events WHERE client_id = ? ORDER BY created_at DESC LIMIT ?",[e,t]))}async findByCategory(e,t,n=100){return t?a(this.db.exec("SELECT * FROM audit_events WHERE event_category = ? AND client_id = ? ORDER BY created_at DESC LIMIT ?",[e,t,n])):a(this.db.exec("SELECT * FROM audit_events WHERE event_category = ? ORDER BY created_at DESC LIMIT ?",[e,n]))}async findRecent(e=50){return a(this.db.exec("SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?",[e]))}}function _(e){return{clients:new E(e),orgs:new o(e),snapshots:new c(e),audit:new d(e)}}},651:(e,t,n)=>{n.d(t,{L$:()=>r,Uu:()=>a,bI:()=>i,cF:()=>s});let i=1,s=[{version:1,name:"create_multi_client_tables",up:`
      -- Schema version tracking
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      );

      -- Client Workspaces (top-level data isolation)
      CREATE TABLE IF NOT EXISTS client_workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        created_by TEXT,
        settings_json TEXT DEFAULT '{}'
      );
      CREATE INDEX IF NOT EXISTS idx_client_workspaces_slug ON client_workspaces(slug);
      CREATE INDEX IF NOT EXISTS idx_client_workspaces_active ON client_workspaces(is_active);

      -- Org Connections (Salesforce orgs per client)
      CREATE TABLE IF NOT EXISTS org_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES client_workspaces(id) ON DELETE CASCADE,
        alias TEXT NOT NULL,
        org_id TEXT,
        instance_url TEXT,
        environment TEXT NOT NULL CHECK (environment IN ('production', 'sandbox', 'scratch', 'developer')),
        auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth', 'jwt', 'cli')),
        is_active INTEGER DEFAULT 1,
        is_default INTEGER DEFAULT 0,
        last_connected_at TEXT,
        last_sync_at TEXT,
        connection_status TEXT DEFAULT 'disconnected',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        created_by TEXT,
        metadata_json TEXT DEFAULT '{}',
        UNIQUE(client_id, alias)
      );
      CREATE INDEX IF NOT EXISTS idx_org_connections_client ON org_connections(client_id);
      CREATE INDEX IF NOT EXISTS idx_org_connections_active ON org_connections(is_active);
      CREATE INDEX IF NOT EXISTS idx_org_connections_env ON org_connections(environment);

      -- Snapshot Runs (metadata extraction jobs)
      CREATE TABLE IF NOT EXISTS snapshot_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES client_workspaces(id) ON DELETE CASCADE,
        org_connection_id INTEGER NOT NULL REFERENCES org_connections(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        progress INTEGER DEFAULT 0,
        progress_message TEXT,
        started_at TEXT,
        completed_at TEXT,
        triggered_by TEXT,
        trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'webhook')),
        error_message TEXT,
        stats_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_snapshot_runs_client ON snapshot_runs(client_id);
      CREATE INDEX IF NOT EXISTS idx_snapshot_runs_org ON snapshot_runs(org_connection_id);
      CREATE INDEX IF NOT EXISTS idx_snapshot_runs_status ON snapshot_runs(status);
      CREATE INDEX IF NOT EXISTS idx_snapshot_runs_created ON snapshot_runs(created_at);

      -- Artifacts (generated outputs with versioning)
      CREATE TABLE IF NOT EXISTS artifacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES client_workspaces(id) ON DELETE CASCADE,
        org_connection_id INTEGER NOT NULL REFERENCES org_connections(id) ON DELETE CASCADE,
        snapshot_run_id INTEGER REFERENCES snapshot_runs(id) ON DELETE SET NULL,
        artifact_type TEXT NOT NULL CHECK (artifact_type IN ('description', 'analysis', 'report', 'retirement_package', 'export_bundle')),
        name TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
        storage_key TEXT,
        content_type TEXT DEFAULT 'application/json',
        size_bytes INTEGER,
        checksum TEXT,
        metadata_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        created_by TEXT,
        approved_by TEXT,
        approved_at TEXT,
        UNIQUE(client_id, org_connection_id, artifact_type, name, version)
      );
      CREATE INDEX IF NOT EXISTS idx_artifacts_client ON artifacts(client_id);
      CREATE INDEX IF NOT EXISTS idx_artifacts_org ON artifacts(org_connection_id);
      CREATE INDEX IF NOT EXISTS idx_artifacts_snapshot ON artifacts(snapshot_run_id);
      CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(artifact_type);
      CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts(status);

      -- Export Runs (GitHub export attempts)
      CREATE TABLE IF NOT EXISTS export_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES client_workspaces(id) ON DELETE CASCADE,
        org_connection_id INTEGER NOT NULL REFERENCES org_connections(id) ON DELETE CASCADE,
        snapshot_run_id INTEGER REFERENCES snapshot_runs(id) ON DELETE SET NULL,
        artifact_id INTEGER REFERENCES artifacts(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        export_type TEXT NOT NULL DEFAULT 'github_pr' CHECK (export_type IN ('github_pr', 'download', 's3')),
        branch_name TEXT,
        pr_url TEXT,
        pr_number INTEGER,
        commit_sha TEXT,
        manifest_json TEXT,
        error_message TEXT,
        started_at TEXT,
        completed_at TEXT,
        triggered_by TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_export_runs_client ON export_runs(client_id);
      CREATE INDEX IF NOT EXISTS idx_export_runs_org ON export_runs(org_connection_id);
      CREATE INDEX IF NOT EXISTS idx_export_runs_status ON export_runs(status);

      -- Audit Events (append-only log)
      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER REFERENCES client_workspaces(id) ON DELETE SET NULL,
        org_connection_id INTEGER REFERENCES org_connections(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL,
        event_category TEXT NOT NULL CHECK (event_category IN ('auth', 'client', 'org', 'snapshot', 'artifact', 'export', 'system')),
        actor TEXT,
        actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'webhook')),
        resource_type TEXT,
        resource_id TEXT,
        details_json TEXT DEFAULT '{}',
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_audit_events_client ON audit_events(client_id);
      CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events(event_category);
      CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor);

      -- User Roles (RBAC - simple version for MVP)
      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER REFERENCES client_workspaces(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'approver', 'viewer')),
        granted_at TEXT DEFAULT (datetime('now')),
        granted_by TEXT,
        is_active INTEGER DEFAULT 1,
        UNIQUE(client_id, user_email)
      );
      CREATE INDEX IF NOT EXISTS idx_user_roles_client ON user_roles(client_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(user_email);

      -- App Settings (key-value store for app-wide settings)
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (datetime('now')),
        updated_by TEXT
      );
    `,down:`
      DROP TABLE IF EXISTS app_settings;
      DROP TABLE IF EXISTS user_roles;
      DROP TABLE IF EXISTS audit_events;
      DROP TABLE IF EXISTS export_runs;
      DROP TABLE IF EXISTS artifacts;
      DROP TABLE IF EXISTS snapshot_runs;
      DROP TABLE IF EXISTS org_connections;
      DROP TABLE IF EXISTS client_workspaces;
      DROP TABLE IF EXISTS schema_migrations;
    `}];function a(e){return e.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").substring(0,50)}function r(e){return/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e)&&e.length<=50}},3966:(e,t,n)=>{n.d(t,{Zl:()=>c,Zy:()=>d,kg:()=>o});let i=new(n(852)).AsyncLocalStorage,s=[/password/i,/secret/i,/token/i,/apikey/i,/api_key/i,/authorization/i,/bearer/i,/credential/i,/private_key/i,/access_token/i,/refresh_token/i,/client_secret/i,/session_id/i],a="[REDACTED]",r={debug:0,info:1,warn:2,error:3};function E(e,t,n,E){if(!function(e){let t=function(){let e=(process.env.LOG_LEVEL||"info").toLowerCase();return["debug","info","warn","error"].includes(e)?e:"info"}();return r[e]>=r[t]}(e))return;let o={timestamp:new Date().toISOString(),level:e,message:t,correlationId:i.getStore(),context:n};E&&(o.error={name:E.name,message:E.message,stack:E.stack});let c=JSON.stringify({...o,context:function e(t,n=0){if(n>10)return"[MAX_DEPTH]";if(null==t)return t;if("string"==typeof t)return t.length>20&&/^[A-Za-z0-9+/=_-]+$/.test(t)?a:t;if(Array.isArray(t))return t.map(t=>e(t,n+1));if("object"==typeof t){let i={};for(let[r,E]of Object.entries(t))s.some(e=>e.test(r))?i[r]=a:i[r]=e(E,n+1);return i}return t}(o.context)});switch(e){case"error":console.error(c);break;case"warn":console.warn(c);break;default:console.log(c)}}let o={debug:(e,t)=>E("debug",e,t),info:(e,t)=>E("info",e,t),warn:(e,t,n)=>E("warn",e,t,n),error:(e,t,n)=>E("error",e,t,n),exception:(e,t,n)=>E("error",e,n,t)};function c(){return`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`}async function d(e,t){return i.run(e,t)}}};