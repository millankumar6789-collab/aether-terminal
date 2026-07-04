import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { parseStrategy } from "@/lib/parsers/strategy-parser";

export async function GET() {
  const supabase = await supabaseServer();

  // Supabase not wired — return empty list gracefully
  if (!supabase) {
    return NextResponse.json({
      strategies: [],
      note: "Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    });
  }

  const { data, error } = await supabase!
    .from("strategies")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: error.message, strategies: [] },
      { status: 200 }
    );
  }

  return NextResponse.json({ strategies: data });
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  // ── Handle multipart file upload ──
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    try {
      const form = await req.formData();
      const file = form.get("file") as File | null;

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: "No file provided in form data" },
          { status: 400 }
        );
      }

      const content = await file.text();
      const file_type =
        file.name.split(".").pop()?.toUpperCase() || "TXT";

      const parsed = await parseStrategy(content, file_type, file.name);

      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error || "Parse failed" },
          { status: 422 }
        );
      }

      // If Supabase not wired, return parsed result without saving
      if (!supabase) {
        return NextResponse.json(
          {
            strategy: {
              id: "unsaved",
              name: parsed.definition!.name || file.name,
              strategy_type: parsed.definition!.type,
              strategy_definition: parsed.definition,
              created_at: new Date().toISOString(),
            },
            warnings: [
              ...(parsed.warnings || []),
              "⚠️ Supabase not configured — strategy parsed but not persisted",
            ],
          },
          { status: 200 }
        );
      }

      const def = parsed.definition!;

      const { data, error } = await supabase!
        .from("strategies")
        .insert({
          name: def.name || file.name,
          strategy_type: def.type,
          market: def.market,
          asset_class: def.asset_class,
          timeframe: def.timeframe,
          strategy_definition: def as any,
          risk_model: def.risk_parameters as any,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 200 }
        );
      }

      await supabase!.from("strategy_uploads").insert({
        strategy_id: data.id,
        file_type,
        source_file: file.name,
        parsed_output: def as any,
        status: "PARSED",
      });

      return NextResponse.json(
        { strategy: data, warnings: parsed.warnings },
        { status: 201 }
      );
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || "Upload processing failed" },
        { status: 500 }
      );
    }
  }

  // ── Handle JSON body upload ──
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "name field required in JSON body" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        {
          strategy: {
            id: "unsaved",
            name: body.name,
            strategy_type: body.strategy_type || "HYBRID",
          },
          note: "Supabase not configured",
        },
        { status: 200 }
      );
    }

    const { data, error } = await supabase!
      .from("strategies")
      .insert({
        name: body.name,
        strategy_type: body.strategy_type || "HYBRID",
        market: body.market,
        asset_class: body.asset_class,
        timeframe: body.timeframe,
        strategy_definition: body.definition || null,
        risk_model: body.risk_model || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { strategy: data },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Invalid request" },
      { status: 400 }
    );
  }
}