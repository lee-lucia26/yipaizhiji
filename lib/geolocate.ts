interface LocateResult {
  city: string | null;
  district: string | null;
}

export async function autoLocate(): Promise<LocateResult | null> {
  try {
    const res = await fetch("/api/geolocate");
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.city) return null;
    return { city: json.city, district: json.district };
  } catch {
    return null;
  }
}
