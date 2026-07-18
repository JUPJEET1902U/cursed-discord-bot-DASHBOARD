import { NextResponse, type NextRequest } from "next/server";
import { verifyGuildManageAccess } from "@/lib/guild-auth";
import { botApiRequest } from "@/lib/bot-api";
import { botApiErrorResponse } from "@/lib/bot-api-route";
interface Params { params: Promise<{ guildId: string }> }
export async function POST(request:NextRequest,{params}:Params){const{guildId}=await params;const access=await verifyGuildManageAccess(request,guildId);if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});try{const body=await request.json();return NextResponse.json(await botApiRequest(`guilds/${guildId}/tickets/panels`,{method:"POST",headers:{"Content-Type":"application/json","x-dashboard-user-id":access.userId},body:JSON.stringify(body)}))}catch(error){return botApiErrorResponse(error,"Couldn't create ticket panel.")}}
