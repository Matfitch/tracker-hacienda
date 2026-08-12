import React, { useState, useMemo } from "react";
import { DollarSign, Plus, TrendingUp, TrendingDown, Repeat, Settings, Droplet } from "lucide-react";
import { useFinanzas } from "../hooks/useFinanzas";
import { useProduccion } from "../hooks/useProduccion";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
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
function fmt(n) {
  return (n || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CATEGORIAS_GASTO = ["Crédito", "Balanceado y sales", "Riego/agua/luz/internet", "Pago ordeñador", "Veterinario/medicamentos", "Otro"];
const CATEGORIAS_INGRESO = ["Venta de leche", "Venta de animal", "Otro"];

const inputStyle = {
  width: "100%",
  fontFamily: "system-ui, sans-serif",
  fontSize: "0.85rem",
  padding: "0.5rem 0.6rem",
  borderRadius: 8,
  border: "1.5px solid #E7DFC9",
  background: "#FFFDF7",
  color: "#2A241C",
  boxSizing: "border-box",
};
const labelStyle = {
  display: "block",
  fontFamily: "system-ui, sans-serif",
  fontSize: "0.72rem",
  color: "#6B4A32",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "0.3rem",
};

export default function Finanzas() {
  const [mesVisible, setMesVisible] = useState(mesKeyDe(hoyISO()));
  const { movimientos, config, cargando, guardarMovimiento, eliminarMovimiento, guardarConfig } = useFinanzas();
  const { registros: produccionMes } = useProduccion(mesVisible);

  const [mostrandoIngreso, setMostrandoIngreso] = useState(false);
  const [mostrandoGasto, setMostrandoGasto] = useState(false);
  const [mostrandoConfig, setMostrandoConfig] = useState(false);

  const esMesActual = mesVisible === mesKeyDe(hoyISO());
  const cambiarMes = (delta) => {
    const [y, m] = mesVisible.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMesVisible(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const delMes = useMemo(() => movimientos.filter((m) => m.fecha?.startsWith(mesVisible)), [movimientos, mesVisible]);
  const ingresos = delMes.filter((m) => m.tipo === "ingreso").sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const gastos = delMes.filter((m) => m.tipo === "gasto").sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const totalIngresos = ingresos.reduce((acc, m) => acc + Number(m.monto), 0);
  const totalGastos = gastos.reduce((acc, m) => acc + Number(m.monto), 0);
  const balance = totalIngresos - totalGastos;

  const litrosMes = useMemo(
    () => Object.values(produccionMes).reduce((acc, d) => acc + (d.manana || 0) + (d.tarde || 0), 0),
    [produccionMes]
  );
  const litrosConsumoInterno = (config.consumo_interno_litros_dia || 0) * diasEnMes(mesVisible);
  const litrosVendiblesEstimados = Math.max(litrosMes - litrosConsumoInterno, 0);
  const ingresoEstimadoLeche = litrosVendiblesEstimados * (config.precio_leche || 0);
  const yaTieneIngresoLeche = ingresos.some((i) => i.categoria === "Venta de leche");

  const categoriasGastoEsteMes = new Set(gastos.map((g) => g.categoria));
  const recurrentesFaltantes = useMemo(() => {
    const vistos = new Set();
    return movimientos
      .filter((m) => m.tipo === "gasto" && m.recurrente && m.fecha < `${mesVisible}-01`)
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
      .filter((m) => {
        if (vistos.has(m.categoria) || categoriasGastoEsteMes.has(m.categoria)) return false;
        vistos.add(m.categoria);
        return true;
      });
  }, [movimientos, mesVisible, gastos]);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E3", fontFamily: "'Iowan Old Style', Georgia, serif", color: "#2A241C", paddingBottom: "3rem" }}>
      <header style={{ background: "#2F4B3C", color: "#F5F0E3", padding: "1.75rem 1.25rem 1.5rem", borderBottom: "3px solid #C68A3E" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
              <DollarSign size={20} color="#C68A3E" />
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#B8CBB9" }}>
                Finanzas
              </span>
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 600, margin: 0, color: "#F5F0E3" }}>Ingresos y gastos</h1>
          </div>
          <button onClick={() => setMostrandoConfig((v) => !v)} style={{ background: "transparent", border: "none", color: "#B8CBB9", cursor: "pointer", padding: "0.3rem" }} aria-label="Configuración">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "0 1.1rem" }}>
        {mostrandoConfig && (
          <ConfigForm config={config} onGuardar={async (c) => { await guardarConfig(c); setMostrandoConfig(false); }} onCerrar={() => setMostrandoConfig(false)} />
        )}

        <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1.25rem", marginTop: "-1rem", boxShadow: "0 6px 18px rgba(47,75,60,0.14)", border: "1px solid #E7DFC9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <button onClick={() => cambiarMes(-1)} style={{ fontFamily: "system-ui, sans-serif", fontSize: "1rem", color: "#6B4A32", background: "#F4EEDB", border: "1px solid #E7DFC9", borderRadius: 6, width: 26, height: 26, cursor: "pointer" }}>‹</button>
            <h2 style={{ fontSize: "1.05rem", margin: 0, textTransform: "capitalize", color: "#2F4B3C" }}>{nombreMes(mesVisible)}</h2>
            <button onClick={() => cambiarMes(1)} disabled={esMesActual} style={{ fontFamily: "system-ui, sans-serif", fontSize: "1rem", color: esMesActual ? "#C9C2AC" : "#6B4A32", background: "#F4EEDB", border: "1px solid #E7DFC9", borderRadius: 6, width: 26, height: 26, cursor: esMesActual ? "default" : "pointer" }}>›</button>
          </div>

          {cargando ? (
            <p style={{ fontFamily: "system-ui, sans-serif", color: "#7A7160" }}>Cargando…</p>
          ) : (
            <div style={{ display: "flex", gap: "0.7rem" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#7A7160", textTransform: "uppercase" }}>Ingresos</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#3C7A4B" }}>${fmt(totalIngresos)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#7A7160", textTransform: "uppercase" }}>Gastos</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#B23A2E" }}>${fmt(totalGastos)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#7A7160", textTransform: "uppercase" }}>Balance</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: balance >= 0 ? "#3C7A4B" : "#B23A2E" }}>
                  {balance >= 0 ? "+" : "-"}${fmt(Math.abs(balance))}
                </div>
              </div>
            </div>
          )}
        </section>

        {!yaTieneIngresoLeche && litrosVendiblesEstimados > 0 && (
          <section style={{ background: "#EAF2E9", border: "1px solid #A9C6AB", borderRadius: 14, padding: "0.9rem 1.1rem", marginTop: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <Droplet size={16} color="#2F4B3C" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", color: "#2F4B3C" }}>
                Este mes llevas <strong>{litrosMes.toFixed(1)} L</strong> producidos
                {config.consumo_interno_litros_dia > 0 && <> (menos {litrosConsumoInterno.toFixed(0)} L de consumo interno)</>} — a ${config.precio_leche}/L eso son aprox. <strong>${fmt(ingresoEstimadoLeche)}</strong>.
                <button
                  onClick={() =>
                    guardarMovimiento({
                      tipo: "ingreso",
                      fecha: mesVisible === mesKeyDe(hoyISO()) ? hoyISO() : `${mesVisible}-01`,
                      categoria: "Venta de leche",
                      descripcion: `${litrosVendiblesEstimados.toFixed(1)} L a $${config.precio_leche}/L`,
                      monto: Number(ingresoEstimadoLeche.toFixed(2)),
                      recurrente: false,
                    })
                  }
                  style={{ display: "block", marginTop: "0.5rem", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "#FFFDF7", background: "#2F4B3C", border: "none", borderRadius: 6, padding: "0.35rem 0.7rem", cursor: "pointer" }}
                >
                  Agregar como ingreso
                </button>
              </div>
            </div>
          </section>
        )}

        {recurrentesFaltantes.length > 0 && (
          <section style={{ background: "#FBF3E3", border: "1px solid #E3C98A", borderRadius: 14, padding: "0.9rem 1.1rem", marginTop: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <Repeat size={16} color="#8A6414" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", color: "#5C4412" }}>
                Tienes {recurrentesFaltantes.length} gasto{recurrentesFaltantes.length > 1 ? "s" : ""} recurrente{recurrentesFaltantes.length > 1 ? "s" : ""} sin registrar este mes ({recurrentesFaltantes.map((r) => r.categoria).join(", ")}).
                <button
                  onClick={async () => {
                    for (const r of recurrentesFaltantes) {
                      await guardarMovimiento({
                        tipo: "gasto",
                        fecha: mesVisible === mesKeyDe(hoyISO()) ? hoyISO() : `${mesVisible}-01`,
                        categoria: r.categoria,
                        descripcion: r.descripcion,
                        monto: r.monto,
                        recurrente: true,
                      });
                    }
                  }}
                  style={{ display: "block", marginTop: "0.5rem", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "#FFFDF7", background: "#8A6414", border: "none", borderRadius: 6, padding: "0.35rem 0.7rem", cursor: "pointer" }}
                >
                  Copiar a este mes
                </button>
              </div>
            </div>
          </section>
        )}

        <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1.1rem 1.25rem", marginTop: "1rem", border: "1px solid #E7DFC9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
            <h2 style={{ fontSize: "0.95rem", margin: 0, color: "#2F4B3C", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <TrendingUp size={16} color="#3C7A4B" /> Ingresos
            </h2>
            <button onClick={() => setMostrandoIngreso(true)} style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#FFFDF7", background: "#3C7A4B", border: "none", borderRadius: 6, padding: "0.3rem 0.6rem", cursor: "pointer" }}>
              <Plus size={13} /> Agregar
            </button>
          </div>

          {mostrandoIngreso && (
            <MovimientoForm
              tipo="ingreso"
              categorias={CATEGORIAS_INGRESO}
              mesVisible={mesVisible}
              onCancelar={() => setMostrandoIngreso(false)}
              onGuardar={async (datos) => { await guardarMovimiento({ ...datos, tipo: "ingreso" }); setMostrandoIngreso(false); }}
            />
          )}

          {ingresos.length === 0 && !mostrandoIngreso && (
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#A39A82" }}>Sin ingresos registrados este mes.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {ingresos.map((m) => (
              <MovimientoRow key={m.id} m={m} onEliminar={() => eliminarMovimiento(m.id)} color="#3C7A4B" />
            ))}
          </div>
        </section>

        <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1.1rem 1.25rem", marginTop: "0.8rem", marginBottom: "1rem", border: "1px solid #E7DFC9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
            <h2 style={{ fontSize: "0.95rem", margin: 0, color: "#2F4B3C", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <TrendingDown size={16} color="#B23A2E" /> Gastos
            </h2>
            <button onClick={() => setMostrandoGasto(true)} style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#FFFDF7", background: "#B23A2E", border: "none", borderRadius: 6, padding: "0.3rem 0.6rem", cursor: "pointer" }}>
              <Plus size={13} /> Agregar
            </button>
          </div>

          {mostrandoGasto && (
            <MovimientoForm
              tipo="gasto"
              categorias={CATEGORIAS_GASTO}
              mesVisible={mesVisible}
              onCancelar={() => setMostrandoGasto(false)}
              onGuardar={async (datos) => { await guardarMovimiento({ ...datos, tipo: "gasto" }); setMostrandoGasto(false); }}
            />
          )}

          {gastos.length === 0 && !mostrandoGasto && (
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#A39A82" }}>Sin gastos registrados este mes.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {gastos.map((m) => (
              <MovimientoRow key={m.id} m={m} onEliminar={() => eliminarMovimiento(m.id)} color="#B23A2E" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function MovimientoRow({ m, onEliminar, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", padding: "0.4rem 0", borderBottom: "1px solid #F1EBD8" }}>
      <div>
        <div style={{ color: "#2A241C", fontWeight: 600 }}>
          {m.categoria} {m.recurrente && <Repeat size={11} style={{ verticalAlign: "middle", marginLeft: 3 }} color="#A39A82" />}
        </div>
        <div style={{ color: "#7A7160", fontSize: "0.72rem" }}>
          {m.fecha}
          {m.descripcion ? ` · ${m.descripcion}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontWeight: 700, color }}>${fmt(m.monto)}</span>
        <button onClick={onEliminar} style={{ background: "none", border: "none", color: "#B23A2E", cursor: "pointer", fontSize: "0.7rem", fontFamily: "system-ui, sans-serif" }}>
          Eliminar
        </button>
      </div>
    </div>
  );
}

function MovimientoForm({ tipo, categorias, mesVisible, onCancelar, onGuardar }) {
  const [categoria, setCategoria] = useState(categorias[0]);
  const [fecha, setFecha] = useState(mesVisible === mesKeyDe(hoyISO()) ? hoyISO() : `${mesVisible}-01`);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [recurrente, setRecurrente] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await onGuardar({ categoria, fecha, descripcion, monto: parseFloat(monto) || 0, recurrente });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ background: "#F4EEDB", borderRadius: 10, padding: "0.9rem", marginBottom: "0.8rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      <div>
        <label style={labelStyle}>Categoría</label>
        <select style={inputStyle} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Fecha</label>
          <input type="date" style={inputStyle} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Monto ($)</label>
          <input type="number" inputMode="decimal" style={inputStyle} value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Descripción (opcional)</label>
        <input style={inputStyle} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </div>
      {tipo === "gasto" && (
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#6B4A32", cursor: "pointer" }}>
          <input type="checkbox" checked={recurrente} onChange={(e) => setRecurrente(e.target.checked)} />
          Es un gasto fijo mensual (se puede copiar cada mes)
        </label>
      )}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.2rem" }}>
        <button onClick={onCancelar} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", padding: "0.45rem", borderRadius: 8, border: "1px solid #C68A3E", background: "transparent", color: "#6B4A32", cursor: "pointer" }}>
          Cancelar
        </button>
        <button
          disabled={!monto || guardando}
          onClick={guardar}
          style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", fontWeight: 600, padding: "0.45rem", borderRadius: 8, border: "none", background: !monto || guardando ? "#C9C2AC" : "#2F4B3C", color: "#F5F0E3", cursor: !monto || guardando ? "not-allowed" : "pointer" }}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function ConfigForm({ config, onGuardar, onCerrar }) {
  const [precio, setPrecio] = useState(String(config.precio_leche ?? 0.5));
  const [consumo, setConsumo] = useState(String(config.consumo_interno_litros_dia ?? 0));

  return (
    <div style={{ background: "#FFFDF7", border: "1px solid #E7DFC9", borderRadius: 14, padding: "1.1rem", marginBottom: "0.8rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <h2 style={{ fontSize: "0.95rem", margin: 0, color: "#2F4B3C" }}>Configuración</h2>
      <div>
        <label style={labelStyle}>Precio de venta por litro ($)</label>
        <input type="number" inputMode="decimal" style={inputStyle} value={precio} onChange={(e) => setPrecio(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Consumo interno diario (L, terneras que no se venden)</label>
        <input type="number" inputMode="decimal" style={inputStyle} value={consumo} onChange={(e) => setConsumo(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onCerrar} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", padding: "0.45rem", borderRadius: 8, border: "1px solid #E7DFC9", background: "transparent", color: "#6B4A32", cursor: "pointer" }}>
          Cancelar
        </button>
        <button
          onClick={() => onGuardar({ precio_leche: parseFloat(precio) || 0, consumo_interno_litros_dia: parseFloat(consumo) || 0 })}
          style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", fontWeight: 600, padding: "0.45rem", borderRadius: 8, border: "none", background: "#2F4B3C", color: "#F5F0E3", cursor: "pointer" }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
