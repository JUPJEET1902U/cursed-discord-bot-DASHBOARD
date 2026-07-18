import { NextResponse, type NextRequest } from "next/server";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
interface Params { params: Promise<{ guildId:string; panelId:string }> }
export async function PUT(request:NextRequest,{params}:Params){const{guildId,panelId}=await params;const access=await verifyGuildManageAccess(request,guildId);if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});try{const body=await request.json();return NextResponse.json(await botApiRequest(`guilds/${guildId}/tickets/panels/${panelId}`,{method:"PUT",headers:{"Content-Type":"application/json","x-dashboard-user-id":access.userId},body:JSON.stringify(body)}))}catch(error){return botApiErrorResponse(error,"Couldn't update ticket panel.")}}
export async function DELETE(request:NextRequest,{params}:Params){const{guildId,panelId}=await params;const access=await verifyGuildManageAccess(request,guildId);if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});try{return NextResponse.json(await botApiRequest(`guilds/${guildId}/tickets/panels/${panelId}`,{method:"DELETE",headers:{"x-dashboard-user-id":access.userId}}))}catch(error){return botApiErrorResponse(error,"Couldn't delete ticket panel.")}}
