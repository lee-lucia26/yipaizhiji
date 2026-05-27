export async function GET(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "";
    console.log("[geolocate] client IP:", ip);

    const res = await fetch("https://ipapi.co/json/", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await res.json();
    console.log("[geolocate] ipapi full response:", JSON.stringify(data));

    const city =
      (data.city || "").replace(/市$/, "") ||
      (data.region || "").replace(/市$/, "") ||
      data.country_name ||
      null;
    const district = data.district || data.region || null;

    console.log("[geolocate] final:", { city, district });

    if (!city) {
      console.log("[geolocate] no city found, returning null");
      return Response.json({ city: null, district: null, error: "无法定位城市" });
    }
    return Response.json({ city, district });
  } catch (err: any) {
    console.error("[geolocate] catch error:", err?.message || err);
    return Response.json({ city: null, district: null, error: err?.message || "定位失败" });
  }
}
