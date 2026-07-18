import { redirect } from "next/navigation";
import { ServerCrash } from "lucide-react";
import { TicketEditor } from "@/components/tickets/ticket-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RetryButton } from "@/components/shared/retry-button";
import { fetchInternal } from "@/lib/api";
import { requireSelectedGuild } from "@/lib/guild";
import type { TicketsData } from "@/types/tickets";

export default async function TicketsPage(){
  const guild=await requireSelectedGuild();
  const response=await fetchInternal(`/api/guilds/${guild.id}/tickets`);
  if(response.status===401||response.status===403)redirect("/dashboard");
  if(!response.ok){const error=await response.json().catch(()=>null) as {code?:string;error?:string}|null;return <div><PageHeader title="CURSED Tickets" description="Premium support panels, private tickets, transcripts, workflow automation, and analytics."/><EmptyState icon={ServerCrash} title={error?.code==="BOT_NOT_IN_GUILD"?"CURSED is not added to this server":"Ticket settings unavailable"} description={error?.error??"The live bot API could not be reached."} action={<RetryButton/>}/></div>}
  const data=await response.json() as TicketsData;
  return <div><PageHeader title="CURSED Tickets" description="Premium support panels, private tickets, transcripts, workflow automation, and analytics."/><TicketEditor guildId={guild.id} initialData={data}/></div>;
}
