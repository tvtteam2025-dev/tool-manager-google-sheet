import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { callGasApi } from "@/lib/gas";
import { normalizeTool, validateTool } from "@/lib/utils";

async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  return null;
}

export async function GET() {
  const authError = await requireSession();
  if (authError) return authError;

  const result = await callGasApi({
    action: "list",
  });

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function POST(request) {
  const authError = await requireSession();
  if (authError) return authError;

  const body = normalizeTool(await request.json().catch(() => ({})));
  const validationError = validateTool(body);

  if (validationError) {
    return NextResponse.json(
      {
        success: false,
        message: validationError,
      },
      { status: 400 }
    );
  }

  const result = await callGasApi({
    action: "create",
    data: body,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function PUT(request) {
  const authError = await requireSession();
  if (authError) return authError;

  const body = normalizeTool(await request.json().catch(() => ({})));
  const validationError = validateTool(body, { requireId: true });

  if (validationError) {
    return NextResponse.json(
      {
        success: false,
        message: validationError,
      },
      { status: 400 }
    );
  }

  const result = await callGasApi({
    action: "update",
    data: body,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function DELETE(request) {
  const authError = await requireSession();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "").trim();

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Thiếu id.",
      },
      { status: 400 }
    );
  }

  const result = await callGasApi({
    action: "delete",
    data: { id },
  });

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
