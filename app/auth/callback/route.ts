import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const data = await req.json();
    return data;
}