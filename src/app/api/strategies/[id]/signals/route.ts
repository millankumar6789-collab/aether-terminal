import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("strategy_signals")
    .select("*")
    .eq("strategy_id", id)
    .order("timestamp", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      { error: error.message, signals: [] },
      { status: 500 }
    );
  }

  return NextResponse.json({ signals: data });
}