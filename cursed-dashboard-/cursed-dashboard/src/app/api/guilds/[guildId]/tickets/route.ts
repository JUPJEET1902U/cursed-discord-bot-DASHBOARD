import { NextResponse, type NextRequest } from "next/server";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
import type { TicketsData, TicketConfig } from "@/types/tickets";
interface Params { params: Promise<{ guildId: string }> }
export async function GET(request:NextRequest,{params}:Params){const{guildId}=await params;const access=await verifyGuildManageAccess(request,guildId);if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});try{return NextResponse.json(await botApiRequest<TicketsData>(`guilds/${guildId}/tickets`,{headers:{"x-dashboard-user-id":access.userId}}))}catch(error){return botApiErrorResponse(error,"Couldn't load ticket settings.")}}
export async function PUT(request:NextRequest,{params}:Params){const{guildId}=await params;const access=await verifyGuildManageAccess(request,guildId);if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});try{const body=await request.json() as TicketConfig;return NextResponse.json(await botApiRequest<TicketsData>(`guilds/${guildId}/tickets`,{method:"PUT",headers:{"Content-Type":"application/json","x-dashboard-user-id":access.userId},body:JSON.stringify(body)}))}catch(error){return botApiErrorResponse(error,"Couldn't save ticket settings.")}}
