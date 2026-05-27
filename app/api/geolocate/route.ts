import { NextResponse } from "next/server";

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function tryAmap(): Promise<{ city: string; district: string } | null> {
  const key = process.env.NEXT_PUBLIC_AMAP_KEY;
  if (!key) return null;

  try {
    const res = await fetchWithTimeout(`https://restapi.amap.com/v3/ip?key=${key}`, 30000);
    const json = await res.json();
    console.log("[geolocate] AMap raw:", JSON.stringify(json));

    if (json.status !== "1") {
      console.log("[geolocate] AMap status not 1, info:", json.info);
      return null;
    }

    // Extract city: prefer city, fallback to province, strip "市" suffix
    let city = (json.city || "") as string;
    if (!city || city === "[]" || city.length === 0) {
      city = (json.province || "") as string;
    }
    city = city.replace(/市$/, "").trim();

    console.log("[geolocate] Parsed city:", city || "(empty)");

    // If still empty after all attempts, return null so fallback runs
    if (!city) {
      console.log("[geolocate] City still empty, trying fallback");
      return null;
    }

    return { city, district: "" };
  } catch (err) {
    console.error("[geolocate] AMap error:", err);
    return null;
  }
}

async function tryIpApi(): Promise<{ city: string; district: string } | null> {
  try {
    const res = await fetchWithTimeout("https://ipapi.co/json/", 15000);
    const json = await res.json();
    console.log("[geolocate] ipapi.co raw:", JSON.stringify(json));

    const city = (json.city || "") as string;
    if (!city) return null;

    return { city, district: "" };
  } catch (err) {
    console.error("[geolocate] ipapi.co error:", err);
    return null;
  }
}

export async function GET() {
  // Try AMap, retry once on failure, then fallback to ipapi.co
  let result = await tryAmap();
  if (!result) result = await tryAmap();
  if (!result) result = await tryIpApi();

  if (!result?.city) {
    console.log("[geolocate] All attempts failed, returning busy");
    return NextResponse.json({ city: null, district: null, error: "定位服务繁忙" });
  }

  console.log("[geolocate] Final response:", result);
  return NextResponse.json(result);
}
