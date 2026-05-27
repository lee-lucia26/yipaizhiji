interface LocateResult {
  city: string | null;
  district: string | null;
}

export async function autoLocate(): Promise<LocateResult | null> {
  try {
    const res = await fetch("/api/geolocate");
    const data = await res.json();
    console.log("[autoLocate] response:", data);

    if (!data.city) {
      console.log("[autoLocate] no city in response");
      return null;
    }
    return { city: data.city, district: data.district };
  } catch (err) {
    console.error("[autoLocate] error:", err);
    return null;
  }
}
