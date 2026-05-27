interface LocateResult {
  city: string;
  district: string;
}

/**
 * 通过服务端 API Route 代理调用高德 IP 定位（避免浏览器跨域）
 * GET /api/geolocate → server → AMap API
 */
export async function autoLocate(): Promise<LocateResult | null> {
  try {
    const res = await fetch("/api/geolocate");
    if (!res.ok) return null;

    const json = await res.json();
    if (json.error) return null;

    return {
      city: json.city || "",
      district: json.district || "",
    };
  } catch {
    return null;
  }
}
