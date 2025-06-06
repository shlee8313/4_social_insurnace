// File: app/api/test/route.js
import { NextResponse } from "next/server";

export async function GET() {
  console.log("🧪 Test API called!");
  return NextResponse.json({
    message: "Test API is working!",
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  console.log("🧪 Test POST API called!");
  return NextResponse.json({
    message: "Test POST API is working!",
    timestamp: new Date().toISOString(),
  });
}
