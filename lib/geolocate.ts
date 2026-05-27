interface LocateResult {
  city: string;
  district: string;
}

const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY;

/**
 * 高德 IP 定位（无需浏览器授权，降级方案）
 */
export async function ipGeolocate(): Promise<LocateResult | null> {
  if (!AMAP_KEY) return null;

  try {
    const url = `https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`;
    const res = await fetch(url);
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

/**
 * 高德逆地理编码（GPS → 城市/区）
 */
export async function reverseGeocode(lng: number, lat: number): Promise<LocateResult | null> {
  if (!AMAP_KEY) return null;

  try {
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${lng},${lat}&extensions=base`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== "1" || !json.regeocode) return null;

    const { addressComponent } = json.regeocode;
    let city = addressComponent.city as string;
    if (!city || city === "[]" || city.length === 0) {
      city = (addressComponent.province || "") as string;
    }
    city = city.replace(/市$/, "");

    let district = (addressComponent.district || "") as string;
    if (!district || district === "[]") district = "";

    return { city, district };
  } catch {
    return null;
  }
}

/**
 * 双保险定位：先 GPS → 失败则 IP 定位
 */
export async function autoLocate(): Promise<LocateResult | null> {
  // 第一保险：浏览器 GPS
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("not supported"));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: 60000,
      });
    });

    const result = await reverseGeocode(pos.coords.longitude, pos.coords.latitude);
    if (result) return result;
  } catch {
    // GPS 失败，降级到 IP 定位
  }

  // 第二保险：IP 定位
  return ipGeolocate();
}
