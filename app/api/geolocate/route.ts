import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.NEXT_PUBLIC_AMAP_KEY;
  if (!key) {
    return NextResponse.json({ error: "AMap key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const json = await res.json();
    console.log("AMap IP API raw response:", JSON.stringify(json));

    if (json.status !== "1") {
      console.error("AMap IP API error:", json);
      return NextResponse.json({ error: "AMap API returned error", detail: json }, { status: 502 });
    }

    let city = (json.city || "") as string;
    if (!city || city === "[]" || city.length === 0) {
      city = (json.province || "") as string;
    }
    city = city.replace(/市$/, "");

    return NextResponse.json({ city, district: "" });
  } catch (err) {
    console.error("Geolocate API error:", err);
    return NextResponse.json({ error: "Failed to fetch AMap API" }, { status: 502 });
  }
}
