function ratesFor(market) {
  try {
    return Array.isArray(market.seasonal_rates)
      ? market.seasonal_rates
      : JSON.parse(market.seasonal_rates || "[]");
  } catch {
    return [];
  }
}

function rateFor(market, boothType, eventDate) {
  const date = String(eventDate || "").slice(0, 10);
  const active = ratesFor(market).find(
    (rate) =>
      rate.start_date &&
      rate.end_date &&
      date >= rate.start_date &&
      date <= rate.end_date,
  );
  const fallback = Number(
    (boothType === "truck" ? market.truck_fee : market.booth_fee) || 0,
  );
  if (!active) return fallback;
  const rate = Number(
    boothType === "truck" ? active.truck_fee : active.booth_fee,
  );
  return Number.isFinite(rate) ? rate : fallback;
}

module.exports = { ratesFor, rateFor };
