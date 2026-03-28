"use client";

interface GeoData {
  regions?: Array<{ name: string; claims: number; cost: number }>;
  topCities?: Array<{ name: string; claims: number }>;
}

interface GeoDistributionProps {
  geoData: GeoData;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) =>
  "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

const CITY_COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#e74c3c", "#D4AF37"];

export function GeoDistribution({ geoData }: GeoDistributionProps) {
  const regions = geoData?.regions || [];
  const cities = geoData?.topCities || [];

  if (!regions.length && !cities.length) return null;

  const totalClaims = regions.reduce((a, r) => a + (r.claims || 0), 0);
  const totalCost = regions.reduce((a, r) => a + (r.cost || 0), 0);

  return (
    <div className="section-polaris">
      <h2 className="section-title-polaris">🌍 Geographic Distribution</h2>

      <div className="geo-grid">
        {/* Claims by Region */}
        <div className="chart-card-polaris">
          <h3 className="chart-title-polaris">📍 Claims by Region</h3>
          <div className="geo-bars">
            {regions.map((r, i) => {
              const pct = totalClaims > 0 ? (r.claims / totalClaims) * 100 : 0;
              return (
                <div key={r.name} className="geo-bar-row">
                  <span className="geo-bar-label">{r.name}</span>
                  <div className="geo-bar-track">
                    <div className="geo-bar-fill" style={{ width: `${pct}%`, backgroundColor: CITY_COLORS[i % 5] }} />
                  </div>
                  <span className="geo-bar-value">{fmt(r.claims)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost by Region */}
        <div className="chart-card-polaris">
          <h3 className="chart-title-polaris">💰 Cost by Region</h3>
          <div className="geo-bars">
            {regions.map((r, i) => {
              const pct = totalCost > 0 ? (r.cost / totalCost) * 100 : 0;
              return (
                <div key={r.name} className="geo-bar-row">
                  <span className="geo-bar-label">{r.name}</span>
                  <div className="geo-bar-track">
                    <div className="geo-bar-fill" style={{ width: `${pct}%`, backgroundColor: CITY_COLORS[i % 5] }} />
                  </div>
                  <span className="geo-bar-value">{fmtUsd(r.cost)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Cities */}
      {cities.length > 0 && (
        <div className="cities-row">
          {cities.slice(0, 5).map((city, i) => (
            <div key={city.name} className="city-card" style={{ borderLeftColor: CITY_COLORS[i] }}>
              <div className="city-value" style={{ color: CITY_COLORS[i] }}>
                {fmt(city.claims)}
              </div>
              <div className="city-name">{city.name}</div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .section-polaris { margin-bottom: 2rem; }
        .section-title-polaris {
          font-family: "Montserrat", sans-serif; font-size: 1.1rem; font-weight: 700;
          color: #ffffff; margin-bottom: 1rem; padding-bottom: 0.5rem;
          border-bottom: 2px solid rgba(212, 175, 55, 0.3);
        }
        .geo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .chart-card-polaris {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070; border-radius: 16px; padding: 1.25rem;
        }
        .chart-title-polaris {
          font-family: "Montserrat", sans-serif; font-size: 0.95rem; font-weight: 700;
          color: #ffffff; margin-bottom: 1rem;
        }
        .geo-bars { display: flex; flex-direction: column; gap: 0.75rem; }
        .geo-bar-row { display: flex; align-items: center; gap: 0.5rem; }
        .geo-bar-label { font-size: 0.8rem; color: #b8d4e8; width: 80px; flex-shrink: 0; }
        .geo-bar-track { flex: 1; height: 12px; background: rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; }
        .geo-bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }
        .geo-bar-value { font-size: 0.8rem; font-weight: 700; color: #ffffff; width: 65px; text-align: right; }
        .cities-row {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem;
        }
        .city-card {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070; border-left: 4px solid; border-radius: 12px;
          padding: 1rem; text-align: center;
        }
        .city-value { font-family: "Montserrat", sans-serif; font-size: 1.5rem; font-weight: 800; }
        .city-name { font-size: 0.8rem; color: #7aa0c0; margin-top: 0.25rem; }
        @media (max-width: 768px) {
          .geo-grid { grid-template-columns: 1fr; }
          .cities-row { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
