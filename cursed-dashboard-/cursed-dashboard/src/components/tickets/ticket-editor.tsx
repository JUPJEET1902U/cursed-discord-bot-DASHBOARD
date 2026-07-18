"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Headphones, Plus, Send, Trash2 } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ServerErrorBanner } from "@/components/dashboard/editor-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { TicketCategory, TicketConfig, TicketPanel, TicketsData } from "@/types/tickets";

const inputClass = "mt-1.5 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-fog outline-none focus:border-violet-bright/60";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-violet-bright/40 bg-violet-bright/10 px-3 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-bright/20 disabled:opacity-50";

function defaultCategories(): TicketCategory[] {
  return [
    ["general", "General Support", "💬", "Questions and general help", "normal"],
    ["billing", "Billing", "💳", "Purchases and payments", "high"],
    ["report", "Report User", "🚩", "Report a member safely", "high"],
    ["appeal", "Appeals", "🛡️", "Appeal a moderation action", "normal"],
    ["partnership", "Partnership", "🤝", "Community and business requests", "normal"],
  ].map(([id,label,emoji,description,priority]) => ({
    id, label, emoji, description, priority: priority as TicketCategory["priority"], categoryId:null, supportRoleIds:[],
    questions:[
      { id:"subject", label:"What do you need help with?", placeholder:"Give staff a short summary", style:"short", required:true },
      { id:"details", label:"Explain the issue", placeholder:"Include all relevant details", style:"paragraph", required:true },
    ],
  }));
}

function defaultPanel(): Omit<TicketPanel,"_id"> {
  return { name:"Main Support Panel", title:"✦ CURSED Support Center", description:"Choose the category that best matches your request. A private support channel will be created for you.", color:"#8B5CF6", imageUrl:null, footer:"Powered by CURSED Support • Private • Secure", style:"buttons", channelId:null, messageId:null, categories:defaultCategories(), enabled:true };
}

export function TicketEditor({ guildId, initialData }: { guildId:string; initialData:TicketsData }) {
  const { toast } = useToast();
  const [data,setData] = useState(initialData);
  const [config,setConfig] = useState<TicketConfig>(initialData.config);
  const [panel,setPanel] = useState<TicketPanel | Omit<TicketPanel,"_id">>(initialData.panels[0] ?? defaultPanel());
  const [publishChannel,setPublishChannel] = useState(initialData.panels[0]?.channelId ?? "");
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const [success,setSuccess] = useState<string|null>(null);
  const textChannels = useMemo(()=>data.channels.filter(c=>c.type===0||c.type===5),[data.channels]);
  const categories = useMemo(()=>data.channels.filter(c=>c.type===4),[data.channels]);

  async function json(url:string, init?:RequestInit) {
    const response = await fetch(url,init);
    const body = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(body.error ?? "Request failed.");
    return body;
  }

  async function saveSettings(){setSaving(true);setError(null);setSuccess(null);try{const next=await json(`/api/guilds/${guildId}/tickets`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(config)}) as TicketsData;setData(next);setConfig(next.config);setSuccess("The live CURSED bot is using these ticket settings.");toast({title:"Ticket settings saved",description:"MongoDB and the live bot are updated.",variant:"success"})}catch(e){setError(e instanceof Error?e.message:"Save failed.")}finally{setSaving(false)}}
  async function savePanel(){setSaving(true);setError(null);try{const hasId="_id" in panel;await json(hasId?`/api/guilds/${guildId}/tickets/panels/${panel._id}`:`/api/guilds/${guildId}/tickets/panels`,{method:hasId?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(panel)});toast({title:"Panel saved",description:"The CURSED panel builder is updated.",variant:"success"});window.location.reload()}catch(e){setError(e instanceof Error?e.message:"Panel save failed.")}finally{setSaving(false)}}
  async function publishPanel(){if(!("_id" in panel))return setError("Save the panel before publishing it.");if(!publishChannel)return setError("Choose a panel channel.");setSaving(true);try{await json(`/api/guilds/${guildId}/tickets/panels/${panel._id}/publish`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({channelId:publishChannel})});toast({title:"Panel published",description:"The premium CURSED support panel is live in Discord.",variant:"success"});window.location.reload()}catch(e){setError(e instanceof Error?e.message:"Publish failed.")}finally{setSaving(false)}}
  async function deletePanel(){if(!("_id" in panel))return;setSaving(true);try{await json(`/api/guilds/${guildId}/tickets/panels/${panel._id}`,{method:"DELETE"});window.location.reload()}catch(e){setError(e instanceof Error?e.message:"Delete failed.")}finally{setSaving(false)}}
  async function ticketAction(id:string, action:string, extra:Record<string,unknown>={}){try{const next=await json(`/api/guilds/${guildId}/tickets/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...extra})}) as TicketsData;setData(next);toast({title:"Ticket updated",description:`Action: ${action}`,variant:"success"})}catch(e){setError(e instanceof Error?e.message:"Ticket action failed.")}}
  const toggleRole=(id:string)=>setConfig(c=>({...c,supportRoleIds:c.supportRoleIds.includes(id)?c.supportRoleIds.filter(x=>x!==id):[...c.supportRoleIds,id]}));
  const updateCategory=(index:number,patch:Partial<TicketCategory>)=>setPanel(p=>({...p,categories:p.categories.map((c,i)=>i===index?{...c,...patch}:c)}));

  return <div className="space-y-6">
    <ServerErrorBanner message={error}/>
    {success?<div className="flex gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4"/>{success}</div>:null}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["Open tickets",data.analytics.open],["Total tickets",data.analytics.total],["Avg response",data.analytics.avgFirstResponseMinutes==null?"—":`${data.analytics.avgFirstResponseMinutes}m`],["Rating",data.analytics.ratingsAverage==null?"—":`${data.analytics.ratingsAverage}/5`]].map(([label,value])=><div key={label} className="rounded-xl border border-violet-bright/20 bg-gradient-to-br from-violet-bright/[0.09] to-black/20 p-4"><div className="text-xs text-ash">{label}</div><div className="mt-1 text-2xl font-semibold text-fog">{value}</div></div>)}
    </div>

    <DashboardCard title="Ticket system" description="Private support channels, transcripts, feedback, automation, and abuse protection." action={<Headphones className="h-5 w-5 text-violet-bright"/>}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-white/[0.08] p-3"><div><Label>Enable CURSED Tickets</Label><p className="text-xs text-ash">Keep disabled until channels and roles are ready.</p></div><Switch checked={config.enabled} onCheckedChange={enabled=>setConfig(c=>({...c,enabled}))}/></div>
        <label><Label>Ticket category</Label><select className={inputClass} value={config.defaultCategoryId??""} onChange={e=>setConfig(c=>({...c,defaultCategoryId:e.target.value||null}))}><option value="">No category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label><Label>Archive category</Label><select className={inputClass} value={config.archiveCategoryId??""} onChange={e=>setConfig(c=>({...c,archiveCategoryId:e.target.value||null}))}><option value="">Keep in place</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label><Label>Ticket log channel</Label><select className={inputClass} value={config.logChannelId??""} onChange={e=>setConfig(c=>({...c,logChannelId:e.target.value||null}))}><option value="">Disabled</option>{textChannels.map(c=><option key={c.id} value={c.id}>#{c.name}</option>)}</select></label>
        <label><Label>Transcript channel</Label><select className={inputClass} value={config.transcriptChannelId??""} onChange={e=>setConfig(c=>({...c,transcriptChannelId:e.target.value||null}))}><option value="">Use ticket channel</option>{textChannels.map(c=><option key={c.id} value={c.id}>#{c.name}</option>)}</select></label>
        <label><Label>Max open per user</Label><Input className="mt-1.5" type="number" min={1} max={10} value={config.maxOpenPerUser} onChange={e=>setConfig(c=>({...c,maxOpenPerUser:Number(e.target.value)}))}/></label>
        <label><Label>Auto-close inactive (hours)</Label><Input className="mt-1.5" type="number" min={0} value={config.autoCloseHours} onChange={e=>setConfig(c=>({...c,autoCloseHours:Number(e.target.value)}))}/></label>
        <label><Label>First-response SLA (minutes)</Label><Input className="mt-1.5" type="number" min={0} value={config.firstResponseSlaMinutes} onChange={e=>setConfig(c=>({...c,firstResponseSlaMinutes:Number(e.target.value)}))}/></label>
        <label><Label>Delete after close (minutes)</Label><Input className="mt-1.5" type="number" min={0} value={config.deleteAfterCloseMinutes} onChange={e=>setConfig(c=>({...c,deleteAfterCloseMinutes:Number(e.target.value)}))}/></label>
        <label><Label>Channel naming</Label><Input className="mt-1.5" value={config.namingTemplate} onChange={e=>setConfig(c=>({...c,namingTemplate:e.target.value}))}/><p className="mt-1 text-xs text-ash">Use {"{number}"}, {"{user}"}, and {"{category}"}.</p></label>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{[["allowCreatorClose","Creator can close"],["requireCloseReason","Require close reason"],["transcriptOnClose","Transcript on close"],["dmOnClose","DM when closed"],["feedbackEnabled","Request 1-5 rating"]].map(([key,label])=><div key={key} className="flex items-center justify-between rounded-lg border border-white/[0.07] px-3 py-2"><span className="text-sm text-fog">{label}</span><Switch checked={Boolean(config[key as keyof TicketConfig])} onCheckedChange={v=>setConfig(c=>({...c,[key]:v}))}/></div>)}</div>
      <div className="mt-5"><Label>Support roles</Label><div className="mt-2 grid max-h-44 gap-2 overflow-auto rounded-lg border border-white/[0.08] p-3 sm:grid-cols-2">{data.roles.map(r=><label key={r.id} className="flex items-center gap-2 text-sm text-fog"><input type="checkbox" checked={config.supportRoleIds.includes(r.id)} onChange={()=>toggleRole(r.id)}/>{r.name}</label>)}</div></div>
      <div className="mt-5 flex justify-end"><button className={buttonClass} onClick={saveSettings} disabled={saving}>Save ticket settings</button></div>
    </DashboardCard>

    <DashboardCard title="Premium panel builder" description="Dark-purple CURSED panel with category routing and modal questions.">
      <div className="grid gap-4 md:grid-cols-2">
        <label><Label>Panel name</Label><Input className="mt-1.5" value={panel.name} onChange={e=>setPanel(p=>({...p,name:e.target.value}))}/></label>
        <label><Label>Embed title</Label><Input className="mt-1.5" value={panel.title} onChange={e=>setPanel(p=>({...p,title:e.target.value}))}/></label>
        <label className="md:col-span-2"><Label>Description</Label><Textarea className="mt-1.5" value={panel.description} onChange={e=>setPanel(p=>({...p,description:e.target.value}))}/></label>
        <label><Label>Accent color</Label><Input className="mt-1.5" type="color" value={panel.color} onChange={e=>setPanel(p=>({...p,color:e.target.value}))}/></label>
        <label><Label>Panel controls</Label><select className={inputClass} value={panel.style} onChange={e=>setPanel(p=>({...p,style:e.target.value as "buttons"|"select"}))}><option value="buttons">Buttons (up to 5)</option><option value="select">Dropdown (up to 25)</option></select></label>
      </div>
      <div className="mt-5 space-y-3">{panel.categories.map((category,index)=><div key={`${category.id}-${index}`} className="rounded-xl border border-violet-bright/15 bg-violet-bright/[0.03] p-3"><div className="grid gap-2 md:grid-cols-5"><Input value={category.emoji} onChange={e=>updateCategory(index,{emoji:e.target.value})}/><Input className="md:col-span-2" value={category.label} onChange={e=>updateCategory(index,{label:e.target.value,id:e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,"-")})}/><select className={inputClass.replace("mt-1.5 ","")} value={category.priority} onChange={e=>updateCategory(index,{priority:e.target.value as TicketCategory["priority"]})}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select><button className="rounded-lg border border-red-400/30 text-red-300" onClick={()=>setPanel(p=>({...p,categories:p.categories.filter((_,i)=>i!==index)}))}>Remove</button></div><Input className="mt-2" value={category.description??""} onChange={e=>updateCategory(index,{description:e.target.value})}/><select className={inputClass} value={category.categoryId??""} onChange={e=>updateCategory(index,{categoryId:e.target.value||null})}><option value="">Default ticket category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>)}</div>
      <div className="mt-4 flex flex-wrap gap-2"><button className={buttonClass} onClick={()=>setPanel(p=>({...p,categories:[...p.categories,{id:`category-${p.categories.length+1}`,label:"New Category",description:"Describe this department",emoji:"🎫",categoryId:null,supportRoleIds:[],priority:"normal",questions:[{id:"details",label:"Explain your request",placeholder:"Include relevant details",style:"paragraph",required:true}]}]}))}><Plus className="h-4 w-4"/>Add category</button><button className={buttonClass} onClick={savePanel} disabled={saving}>Save panel</button>{"_id" in panel?<button className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-sm text-red-300" onClick={deletePanel}><Trash2 className="h-4 w-4"/>Delete panel</button>:null}</div>
      <div className="mt-5 flex flex-col gap-2 rounded-xl border border-white/[0.08] p-4 sm:flex-row"><select className={inputClass.replace("mt-1.5 ","")} value={publishChannel} onChange={e=>setPublishChannel(e.target.value)}><option value="">Choose panel channel</option>{textChannels.map(c=><option key={c.id} value={c.id}>#{c.name}</option>)}</select><button className={buttonClass} onClick={publishPanel} disabled={saving}><Send className="h-4 w-4"/>Publish to Discord</button></div>
    </DashboardCard>

    <DashboardCard title="Live ticket queue" description="Review ticket state, priority, ownership, and recovery actions.">
      <div className="space-y-2">{data.tickets.length?data.tickets.map(ticket=><div key={ticket._id} className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3 lg:flex-row lg:items-center lg:justify-between"><div><div className="font-medium text-fog">#{ticket.ticketNumber} • {ticket.categoryLabel}</div><div className="text-xs text-ash">{ticket.creatorTag} • {ticket.status} • {ticket.priority}{ticket.claimedByTag?` • ${ticket.claimedByTag}`:""}</div></div><div className="flex flex-wrap gap-2"><select className="rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1.5 text-xs" value={ticket.priority} onChange={e=>ticketAction(ticket._id,"priority",{priority:e.target.value})}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>{ticket.status==="closed"?<button className={buttonClass} onClick={()=>ticketAction(ticket._id,"reopen")}>Reopen</button>:<button className={buttonClass} onClick={()=>ticketAction(ticket._id,"close",{reason:"Closed from CURSED dashboard"})}>Close</button>}<button className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-300" onClick={()=>ticketAction(ticket._id,"delete")}>Delete</button></div></div>):<p className="text-sm text-ash">No tickets yet. Publish the panel to begin.</p>}</div>
    </DashboardCard>
  </div>;
}
