import React, { useState, useEffect, useMemo } from "react";
import { Droplet, Sun, Moon, Calendar, TrendingUp, Check } from "lucide-react";
import { useProduccion } from "../hooks/useProduccion";
import { useMetas } from "../hooks/useMetas";

// ---- Proyección mensual inicial (litros) — se puede sobreescribir editando la meta ----
const PROYECCION = {
  "2026-08": 2780,
  "2026-09": 2900,
  "2026-10": 3050,
  "2026-11": 3150,
  "2026-12": 3220,
  "2027-01": 3300,
};

function metaDelMes(mesKey, overrides) {
  if (overrides && overrides[mesKey] != null) return overrides[mesKey];
  if (PROYECCION[mesKey]) return PROYECCION[mesKey];
  const keys = Object.keys(PROYECCION).sort();
  const ultima = keys[keys.length - 1];
  return overrides && overrides[ultima] != null ? overrides[ultima] : PROYECCION[ultima];
}

function hoyISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function mesKeyDe(fechaISO) {
  return fechaISO.slice(0, 7);
}

function diasEnMes(mesKey) {
  const [y, m] = mesKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function nombreMes(mesKey) {
  const [y, m] = mesKey.split("-").map(Number);
  const f = new Date(y, m - 1, 1);
  return f.toLocaleDateString("es-EC", { month: "long", year: "numeric" });
}

function nombreDia(fechaISO) {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const f = new Date(y, m - 1, d);
  return f.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "short" });
}

export default function ProduccionLeche() {
  const [fecha, setFecha] = useState(hoyISO());
  const [manana, setManana] = useState("");
  const [tarde, setTarde] = useState("");
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaInput, setMetaInput] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState(null);

  const mesKey = mesKeyDe(fecha);

  // ---- Datos desde Supabase (con cache offline vía Dexie) ----
  const { registros: datosMes, guardarDia: guardarEnSupabase, cargando } = useProduccion(mesKey);
  const { metas, guardarMeta: guardarMetaEnSupabase } = useMetas();

  // Precargar inputs si ya hay dato guardado para la fecha seleccionada
  useEffect(() => {
    const dia = datosMes[fecha];
    setManana(dia ? String(dia.manana) : "");
    setTarde(dia ? String(dia.tarde) : "");
  }, [fecha, datosMes]);

  const guardarDia = async () => {
    const m = parseFloat(manana) || 0;
    const t = parseFloat(tarde) || 0;
    try {
      await guardarEnSupabase(fecha, m, t);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1800);
    } catch (e) {
      setError("No se pudo guardar. Se reintentará cuando vuelva la conexión.");
    }
  };

  const guardarMeta = async () => {
    const valor = parseFloat(metaInput);
    if (!valor || valor <= 0) {
      setEditandoMeta(false);
      return;
    }
    try {
      await guardarMetaEnSupabase(mesKey, valor);
    } catch (e) {
      setError("No se pudo guardar la meta editada.");
    } finally {
      setEditandoMeta(false);
    }
  };

  const totalDia = (parseFloat(manana) || 0) + (parseFloat(tarde) || 0);

  const totalMes = useMemo(
    () =>
      Object.values(datosMes).reduce(
        (acc, d) => acc + (d.manana || 0) + (d.tarde || 0),
        0
      ),
    [datosMes]
  );

  const meta = metaDelMes(mesKey, metas);
  const faltante = Math.max(meta - totalMes, 0);
  const totalDias = diasEnMes(mesKey);
  const diaActual = parseInt(fecha.slice(8, 10), 10);
  const diasRestantes = Math.max(totalDias - diaActual + 1, 1);
  const promedioNecesario = faltante / diasRestantes;
  const porcentaje = Math.min((totalMes / meta) * 100, 100);
  const cumplida = totalMes >= meta;

  const historial = Object.entries(datosMes)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 10);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F0E3",
        fontFamily: "'Iowan Old Style', Georgia, 'Times New Roman', serif",
        color: "#2A241C",
        paddingBottom: "3rem",
      }}
    >
      {/* Encabezado */}
      <header
        style={{
          background: "#2F4B3C",
          color: "#F5F0E3",
          padding: "1.75rem 1.25rem 2.25rem",
          borderBottom: "3px solid #C68A3E",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "0.35rem",
          }}
        >
          <Droplet size={22} color="#C68A3E" fill="#C68A3E" />
          <span
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.7rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#B8CBB9",
            }}
          >
            Registro diario
          </span>
        </div>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 600,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Producción de leche
        </h1>
      </header>

      <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 1.1rem" }}>
        {/* Selector de fecha + entrada */}
        <section
          style={{
            background: "#FFFDF7",
            borderRadius: 14,
            padding: "1.25rem",
            marginTop: "-1.25rem",
            boxShadow: "0 6px 18px rgba(47,75,60,0.14)",
            border: "1px solid #E7DFC9",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.9rem",
            }}
          >
            <Calendar size={16} color="#6B4A32" />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.95rem",
                color: "#2A241C",
                fontWeight: 600,
                flex: 1,
              }}
            />
          </div>
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.8rem",
              color: "#7A7160",
              textTransform: "capitalize",
              margin: "0 0 1rem",
            }}
          >
            {nombreDia(fecha)}
          </p>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <label style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "0.72rem",
                  color: "#6B4A32",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "0.35rem",
                }}
              >
                <Sun size={14} /> Mañana (L)
              </div>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={manana}
                onChange={(e) => setManana(e.target.value)}
                placeholder="0"
                style={{
                  width: "100%",
                  fontSize: "1.4rem",
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 700,
                  padding: "0.6rem 0.7rem",
                  borderRadius: 10,
                  border: "1.5px solid #E7DFC9",
                  background: "#F9F6EC",
                  color: "#2A241C",
                  boxSizing: "border-box",
                }}
              />
            </label>
            <label style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "0.72rem",
                  color: "#6B4A32",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "0.35rem",
                }}
              >
                <Moon size={14} /> Tarde (L)
              </div>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={tarde}
                onChange={(e) => setTarde(e.target.value)}
                placeholder="0"
                style={{
                  width: "100%",
                  fontSize: "1.4rem",
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 700,
                  padding: "0.6rem 0.7rem",
                  borderRadius: 10,
                  border: "1.5px solid #E7DFC9",
                  background: "#F9F6EC",
                  color: "#2A241C",
                  boxSizing: "border-box",
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1rem",
              paddingTop: "0.9rem",
              borderTop: "1px dashed #E7DFC9",
            }}
          >
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.85rem",
                color: "#7A7160",
              }}
            >
              Total del día
            </span>
            <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2F4B3C" }}>
              {totalDia.toFixed(1)} L
            </span>
          </div>

          <button
            onClick={guardarDia}
            style={{
              width: "100%",
              marginTop: "1rem",
              padding: "0.75rem",
              borderRadius: 10,
              border: "none",
              background: guardado ? "#3C7A4B" : "#2F4B3C",
              color: "#F5F0E3",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {guardado ? (
              <>
                <Check size={17} /> Guardado
              </>
            ) : (
              "Guardar registro del día"
            )}
          </button>
          {error && (
            <p
              style={{
                color: "#B23A2E",
                fontFamily: "system-ui, sans-serif",
                fontSize: "0.8rem",
                marginTop: "0.5rem",
              }}
            >
              {error}
            </p>
          )}
        </section>

        {/* Gauge mensual */}
        <section
          style={{
            background: "#FFFDF7",
            borderRadius: 14,
            padding: "1.25rem",
            marginTop: "1rem",
            border: "1px solid #E7DFC9",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "0.9rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                margin: 0,
                textTransform: "capitalize",
                color: "#2F4B3C",
              }}
            >
              {nombreMes(mesKey)}
            </h2>

            {editandoMeta ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  value={metaInput}
                  onChange={(e) => setMetaInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && guardarMeta()}
                  style={{
                    width: 78,
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "0.8rem",
                    padding: "0.25rem 0.4rem",
                    borderRadius: 6,
                    border: "1.5px solid #C68A3E",
                    background: "#FFFDF7",
                  }}
                />
                <button
                  onClick={guardarMeta}
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#F5F0E3",
                    background: "#2F4B3C",
                    border: "none",
                    borderRadius: 6,
                    padding: "0.28rem 0.55rem",
                    cursor: "pointer",
                  }}
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMetaInput(String(meta));
                  setEditandoMeta(true);
                }}
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "0.75rem",
                  color: "#6B4A32",
                  background: "#F4EEDB",
                  border: "1px dashed #C68A3E",
                  borderRadius: 6,
                  padding: "0.2rem 0.5rem",
                  cursor: "pointer",
                }}
              >
                meta {meta.toLocaleString("es-EC")} L ✎
              </button>
            )}
          </div>

          {cargando ? (
            <p style={{ fontFamily: "system-ui, sans-serif", color: "#7A7160" }}>
              Cargando…
            </p>
          ) : (
            <>
              {/* Tanque de nivel */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 130,
                    borderRadius: "10px 10px 16px 16px",
                    border: "2.5px solid #2F4B3C",
                    position: "relative",
                    overflow: "hidden",
                    background: "#F1EBD8",
                    flexShrink: 0,
                  }}
                  aria-label={`${porcentaje.toFixed(0)}% de la meta`}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${porcentaje}%`,
                      background: cumplida
                        ? "linear-gradient(180deg, #4C8F5E, #2F4B3C)"
                        : "linear-gradient(180deg, #E9E1C8, #C68A3E)",
                      transition: "height 0.5s ease",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "system-ui, sans-serif",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: porcentaje > 55 ? "#F5F0E3" : "#2A241C",
                    }}
                  >
                    {porcentaje.toFixed(0)}%
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: "0.6rem" }}>
                    <div
                      style={{
                        fontFamily: "system-ui, sans-serif",
                        fontSize: "0.72rem",
                        color: "#7A7160",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Acumulado
                    </div>
                    <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#2F4B3C" }}>
                      {totalMes.toLocaleString("es-EC")} L
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "system-ui, sans-serif",
                        fontSize: "0.72rem",
                        color: "#7A7160",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {cumplida ? "Meta cumplida" : "Faltan"}
                    </div>
                    <div
                      style={{
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        color: cumplida ? "#3C7A4B" : "#B23A2E",
                      }}
                    >
                      {cumplida ? "✓" : `${faltante.toLocaleString("es-EC")} L`}
                    </div>
                  </div>
                </div>
              </div>

              {!cumplida && (
                <div
                  style={{
                    marginTop: "1.1rem",
                    padding: "0.75rem 0.9rem",
                    background: "#F4EEDB",
                    borderRadius: 10,
                    display: "flex",
                    gap: "0.6rem",
                    alignItems: "flex-start",
                  }}
                >
                  <TrendingUp size={18} color="#6B4A32" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "system-ui, sans-serif",
                      fontSize: "0.85rem",
                      color: "#4A4132",
                      lineHeight: 1.4,
                    }}
                  >
                    Necesitas un promedio de{" "}
                    <strong>{promedioNecesario.toFixed(1)} L/día</strong> en los{" "}
                    {diasRestantes} días restantes del mes para llegar a la meta.
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Historial reciente */}
        {historial.length > 0 && (
          <section
            style={{
              background: "#FFFDF7",
              borderRadius: 14,
              padding: "1.1rem 1.25rem",
              marginTop: "1rem",
              marginBottom: "1rem",
              border: "1px solid #E7DFC9",
            }}
          >
            <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.75rem", color: "#2F4B3C" }}>
              Últimos registros
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {historial.map(([f, d]) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "0.82rem",
                    padding: "0.4rem 0",
                    borderBottom: "1px solid #F1EBD8",
                  }}
                >
                  <span style={{ color: "#7A7160", textTransform: "capitalize" }}>
                    {nombreDia(f)}
                  </span>
                  <span style={{ color: "#2A241C" }}>
                    <span style={{ color: "#B0A98F" }}>
                      {d.manana}+{d.tarde}
                    </span>{" "}
                    <strong>{(d.manana + d.tarde).toFixed(1)} L</strong>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.72rem",
            color: "#A39A82",
            textAlign: "center",
            marginTop: "0.5rem",
          }}
        >
          Los datos se sincronizan con Supabase y quedan disponibles en cualquier dispositivo.
        </p>
      </main>
    </div>
  );
}