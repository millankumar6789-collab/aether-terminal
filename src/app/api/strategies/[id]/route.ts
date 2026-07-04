import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  if (!supabase) {
    return NextResponse.json({
      strategy: null,
      note: "Supabase not configured",
    });
  }

  const { data, error } = await supabase!
    .from("strategies")
    .select("*, strategy_uploads(*), strategy_signals(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 200 }
    );
  }

  return NextResponse.json({ strategy: data });
}