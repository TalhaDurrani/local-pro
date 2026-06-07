import { NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const RATE_WINDOW_MS = 1000;
const lastByIp = new Map<string, number>();

export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const last = lastByIp.get(ip) || 0;
  if (now - last < RATE_WINDOW_MS) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  lastByIp.set(ip, now);

  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  if (!lat || !lng || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const email = process.env.NOMINATIM_CONTACT_EMAIL || "";
  const target = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&accept-language=en${
    email ? `&email=${encodeURIComponent(email)}` : ""
  }`;

  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": `ProLocal/1.0 (${email || "no-contact"})`,
        "Accept-Language": "en",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }
    const data = await res.json();
    if (!data.address?.country_code || data.address.country_code.toLowerCase() !== "pk") {
      return NextResponse.json({ error: "location_not_in_pk" }, { status: 422 });
    }
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Nominatim failed" }, { status: 502 });
  }
}
