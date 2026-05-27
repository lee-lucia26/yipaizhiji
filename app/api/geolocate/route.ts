import { NextResponse } from "next/server";

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function tryAmap(): Promise<{ city: string; district: string } | null> {
  const key = process.env.NEXT_PUBLIC_AMAP_KEY;
  if (!key) return null;

  const res = await fetchWithTimeout(`https://restapi.amap.com/v3/ip?key=${key}`, 30000);
  const json = await res.json();

  if (json.status !== "1") return null;

  let city = (json.city || "") as string;
  if (!city || city === "[]" || city.length === 0) {
    city = (json.province || "") as string;
  }
  city = city.replace(/市$/, "");
  return { city, district: "" };
}

async function tryIpApi(): Promise<{ city: string; district: string } | null> {
  try {
    const res = await fetchWithTimeout("https://ipapi.co/json/", 15000);
    const json = await res.json();
    const city = (json.city || "") as string;
    if (!city) return null;
    return { city, district: "" };
  } catch {
    return null;
  }
}

export async function GET() {
  // Try AMap twice, then fallback to ipapi.co
  let result = await tryAmap();
  if (!result) result = await tryAmap(); // retry once
  if (!result) result = await tryIpApi(); // fallback

  if (!result?.city) {
    return NextResponse.json({ city: null, district: null, error: "定位服务繁忙" });
  }

  return NextResponse.json(result);
}
