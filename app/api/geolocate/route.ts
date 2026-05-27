import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await res.json();
    console.log("[geolocate] ipapi raw:", JSON.stringify(data));

    const city = (data.city || data.region || "").replace(/市$/, "") || null;
    const district = data.district || null;

    console.log("[geolocate] parsed:", { city, district });
    return NextResponse.json({ city, district });
  } catch (err) {
    console.error("[geolocate] error:", err);
    return NextResponse.json({ city: null, district: null, error: "定位失败" });
  }
}
