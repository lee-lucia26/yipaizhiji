const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY;

interface LocateResult {
  city: string;
  district: string;
}

/**
 * 高德 IP 定位（国内浏览器 geolocation 成功率极低，直接用 IP）
 */
export async function autoLocate(): Promise<LocateResult | null> {
  if (!AMAP_KEY) return null;

  try {
    const res = await fetch(`https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`);
    const json = await res.json();

    if (json.status !== "1") return null;

    let city = (json.city || "") as string;
    if (!city || city === "[]" || city.length === 0) {
      city = (json.province || "") as string;
    }
    city = city.replace(/市$/, "");

    return { city, district: "" };
  } catch {
    return null;
  }
}
