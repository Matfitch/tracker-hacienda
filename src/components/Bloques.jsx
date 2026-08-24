import React, { useState } from "react";
import { Sprout, Plus, ArrowLeft, Leaf, Beef, Clock, Wheat } from "lucide-react";
import { useBloques } from "../hooks/useBloques";
import { estadoActual, historialPastoreos, historialFertilizaciones, historialSiembras, hoyISO } from "../lib/pastoreo";

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

function badgeEstado(info) {
  if (info.estado === "establecimiento") {
    return info.listo
      ? { texto: `Sembrado hace ${info.dias} días — listo para pastorear`, color: "#3C7A4B", bg: "#EAF2E9" }
      : { texto: `Sembrado hace ${info.dias} días (listo entre ${info.diasMin}-${info.diasMax})`, color: "#8A6414", bg: "#FBF3E3" };
  }
  if (info.estado === "pastoreo") return { texto: `Pastoreando hace ${info.dias} día${info.dias === 1 ? "" : "s"}`, color: "#3C7A4B", bg: "#EAF2E9" };
  if (info.estado === "descanso") return { texto: `Descansando hace ${info.dias} día${info.dias === 1 ? "" : "s"}`, color: "#C68A3E", bg: "#FBF3E3" };
  return { texto: "Sin registros de pastoreo", color: "#A39A82", bg: "#F4EEDB" };
}

export default function Bloques() {
  const { bloques, eventos, cargando, guardarBloque, eliminarBloque, registrarEvento, eliminarEvento } = useBloques();
  const [seleccionado, setSeleccionado] = useState(null);
  const [mostrandoForm, setMostrandoForm] = useState(false);

  const bloqueSeleccionado = bloques.find((b) => b.id === seleccionado);

  if (bloqueSeleccionado) {
    return (
      <FichaBloque
        bloque={bloqueSeleccionado}
        eventos={eventos}
        onVolver={() => setSeleccionado(null)}
        onEliminarBloque={async (id) => { await eliminarBloque(id); setSeleccionado(null); }}
        onRegistrarEvento={registrarEvento}
        onEliminarEvento={eliminarEvento}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E3", fontFamily: "'Iowan Old Style', Georgia, serif", color: "#2A241C", paddingBottom: "3rem" }}>
      <header style={{ background: "#2F4B3C", color: "#F5F0E3", padding: "1.75rem 1.25rem 1.5rem", borderBottom: "3px solid #C68A3E" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
          <Sprout size={20} color="#C68A3E" />
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#B8CBB9" }}>
            Manejo de pastos
          </span>
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 600, margin: 0, color: "#F5F0E3" }}>Bloques de forraje</h1>
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "0 1.1rem" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-1rem" }}>
          <button
            onClick={() => setMostrandoForm(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "#2F4B3C", color: "#F5F0E3", border: "none", borderRadius: 10, padding: "0.6rem 0.9rem", cursor: "pointer", boxShadow: "0 6px 18px rgba(47,75,60,0.14)", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 600 }}
          >
            <Plus size={16} /> Nuevo bloque
          </button>
        </div>

        {mostrandoForm && (
          <FormNuevoBloque
            onCancelar={() => setMostrandoForm(false)}
            onGuardar={async (datos) => {
              const registro = await guardarBloque(datos);
              setMostrandoForm(false);
              setSeleccionado(registro.id);
            }}
          />
        )}

        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {cargando && bloques.length === 0 && <p style={{ fontFamily: "system-ui, sans-serif", color: "#7A7160" }}>Cargando…</p>}
          {!cargando && bloques.length === 0 && !mostrandoForm && (
            <p style={{ fontFamily: "system-ui, sans-serif", color: "#7A7160", textAlign: "center", marginTop: "2rem" }}>
              Todavía no has agregado ningún bloque.
            </p>
          )}
          {bloques.map((b) => {
            const info = estadoActual(b, eventos);
            const badge = badgeEstado(info);
            const ultFert = historialFertilizaciones(b.id, eventos)[0];
            return (
              <button
                key={b.id}
                onClick={() => setSeleccionado(b.id)}
                style={{ display: "flex", flexDirection: "column", gap: "0.4rem", background: "#FFFDF7", border: "1px solid #E7DFC9", borderRadius: 12, padding: "0.8rem 1rem", textAlign: "left", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.3rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#2A241C" }}>
                    {b.nombre}
                    {b.area_hectareas ? <span style={{ fontWeight: 400, color: "#7A7160", fontSize: "0.78rem" }}> · {b.area_hectareas} ha</span> : null}
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: badge.color, background: badge.bg, borderRadius: 999, padding: "0.2rem 0.55rem" }}>
                    {badge.texto}
                  </span>
                </div>
                {ultFert && (
                  <div style={{ fontSize: "0.75rem", color: "#7A7160" }}>
                    Última fertilización: {ultFert.fecha} — {ultFert.productos || "sin detalle"}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function FormNuevoBloque({ onCancelar, onGuardar }) {
  const [nombre, setNombre] = useState("");
  const [area, setArea] = useState("");
  const [diasMin, setDiasMin] = useState("61");
  const [diasMax, setDiasMax] = useState("75");
  const [notas, setNotas] = useState("");

  return (
    <div style={{ background: "#FFFDF7", border: "1px solid #E7DFC9", borderRadius: 14, padding: "1.1rem", marginTop: "0.9rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
      <div>
        <label style={labelStyle}>Nombre del bloque *</label>
        <input style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ej. Bloque 1, Potrero del río" />
      </div>
      <div>
        <label style={labelStyle}>Área (hectáreas, opcional)</label>
        <input type="number" inputMode="decimal" style={inputStyle} value={area} onChange={(e) => setArea(e.target.value)} placeholder="ej. 0.45" />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Días mín. tras siembra</label>
          <input type="number" style={inputStyle} value={diasMin} onChange={(e) => setDiasMin(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Días máx. tras siembra</label>
          <input type="number" style={inputStyle} value={diasMax} onChange={(e) => setDiasMax(e.target.value)} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Notas (opcional)</label>
        <input style={inputStyle} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.3rem" }}>
        <button onClick={onCancelar} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", padding: "0.55rem", borderRadius: 8, border: "1px solid #E7DFC9", background: "transparent", color: "#6B4A32", cursor: "pointer" }}>
          Cancelar
        </button>
        <button
          disabled={!nombre}
          onClick={() =>
            onGuardar({
              nombre,
              area_hectareas: area ? parseFloat(area) : null,
              dias_min_pastoreo: parseInt(diasMin, 10) || 61,
              dias_max_pastoreo: parseInt(diasMax, 10) || 75,
              notas,
            })
          }
          style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", fontWeight: 600, padding: "0.55rem", borderRadius: 8, border: "none", background: !nombre ? "#C9C2AC" : "#2F4B3C", color: "#F5F0E3", cursor: !nombre ? "not-allowed" : "pointer" }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

function FichaBloque({ bloque, eventos, onVolver, onEliminarBloque, onRegistrarEvento, onEliminarEvento }) {
  const info = estadoActual(bloque, eventos);
  const badge = badgeEstado(info);
  const pastoreos = historialPastoreos(bloque.id, eventos);
  const fertilizaciones = historialFertilizaciones(bloque.id, eventos);
  const siembras = historialSiembras(bloque.id, eventos);

  const [formAbierto, setFormAbierto] = useState(null); // 'entrada' | 'salida' | 'siembra' | 'fertilizacion' | null
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E3", fontFamily: "'Iowan Old Style', Georgia, serif", color: "#2A241C", paddingBottom: "3rem" }}>
      <header style={{ background: "#2F4B3C", color: "#F5F0E3", padding: "1.25rem 1.25rem 1.5rem", borderBottom: "3px solid #C68A3E" }}>
        <button onClick={onVolver} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "transparent", border: "none", color: "#B8CBB9", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", cursor: "pointer", padding: 0, marginBottom: "0.6rem" }}>
          <ArrowLeft size={15} /> Volver
        </button>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, margin: 0, color: "#F5F0E3" }}>{bloque.nombre}</h1>
        {bloque.area_hectareas ? (
          <p style={{ margin: "0.2rem 0 0", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#B8CBB9" }}>{bloque.area_hectareas} hectáreas</p>
        ) : null}
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "0 1.1rem" }}>
        <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1.1rem 1.25rem", marginTop: "-1rem", boxShadow: "0 6px 18px rgba(47,75,60,0.14)", border: "1px solid #E7DFC9" }}>
          <div style={{ display: "inline-block", fontSize: "0.8rem", fontWeight: 600, color: badge.color, background: badge.bg, borderRadius: 999, padding: "0.3rem 0.7rem", marginBottom: "0.9rem" }}>
            {badge.texto}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {info.estado !== "pastoreo" && (
              <button onClick={() => setFormAbierto("entrada")} style={botonAccion("#3C7A4B")}>
                <Beef size={15} /> Ingresó ganado
              </button>
            )}
            {info.estado === "pastoreo" && (
              <button onClick={() => setFormAbierto("salida")} style={botonAccion("#C68A3E")}>
                <Clock size={15} /> Salió el ganado
              </button>
            )}
            <button onClick={() => setFormAbierto("siembra")} style={botonAccionSecundario()}>
              <Wheat size={15} /> Sembrar
            </button>
            <button onClick={() => setFormAbierto("fertilizacion")} style={botonAccionSecundario()}>
              <Leaf size={15} /> Fertilizar
            </button>
          </div>

          {formAbierto === "entrada" && (
            <FechaSimpleForm
              titulo="¿Cuándo ingresó el ganado?"
              onCancelar={() => setFormAbierto(null)}
              onGuardar={async (fecha) => { await onRegistrarEvento({ bloque_id: bloque.id, tipo: "entrada", fecha }); setFormAbierto(null); }}
            />
          )}
          {formAbierto === "salida" && (
            <FechaSimpleForm
              titulo="¿Cuándo salió el ganado?"
              onCancelar={() => setFormAbierto(null)}
              onGuardar={async (fecha) => { await onRegistrarEvento({ bloque_id: bloque.id, tipo: "salida", fecha }); setFormAbierto(null); }}
            />
          )}
          {formAbierto === "siembra" && (
            <SiembraForm
              onCancelar={() => setFormAbierto(null)}
              onGuardar={async (datos) => { await onRegistrarEvento({ bloque_id: bloque.id, tipo: "siembra", ...datos }); setFormAbierto(null); }}
            />
          )}
          {formAbierto === "fertilizacion" && (
            <FertilizacionForm
              onCancelar={() => setFormAbierto(null)}
              onGuardar={async (datos) => { await onRegistrarEvento({ bloque_id: bloque.id, tipo: "fertilizacion", ...datos }); setFormAbierto(null); }}
            />
          )}
        </section>

        <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1.1rem 1.25rem", marginTop: "0.8rem", border: "1px solid #E7DFC9" }}>
          <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.7rem", color: "#2F4B3C" }}>Historial de siembras</h2>
          {siembras.length === 0 && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", color: "#7A7160" }}>Sin registros todavía.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {siembras.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", padding: "0.4rem 0", borderBottom: "1px solid #F1EBD8" }}>
                <div>
                  <div style={{ color: "#2A241C", fontWeight: 600 }}>{s.fecha}</div>
                  <div style={{ color: "#7A7160" }}>{s.especie || "sin especificar"}</div>
                  {s.notas ? <div style={{ color: "#A39A82", fontSize: "0.72rem" }}>{s.notas}</div> : null}
                </div>
                <button onClick={() => onEliminarEvento(s.id)} style={botonEliminar}>Eliminar</button>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1.1rem 1.25rem", marginTop: "0.8rem", border: "1px solid #E7DFC9" }}>
          <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.7rem", color: "#2F4B3C" }}>Historial de pastoreos</h2>
          {pastoreos.length === 0 && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", color: "#7A7160" }}>Sin registros todavía.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {pastoreos.map((p, i) => (
              <div key={i} style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", padding: "0.4rem 0.6rem", background: "#F4EEDB", borderRadius: 6 }}>
                {p.inicio} → {p.fin || "en curso"} · <strong>{p.dias} día{p.dias === 1 ? "" : "s"}</strong>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1.1rem 1.25rem", marginTop: "0.8rem", border: "1px solid #E7DFC9" }}>
          <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.7rem", color: "#2F4B3C" }}>Historial de fertilizaciones</h2>
          {fertilizaciones.length === 0 && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", color: "#7A7160" }}>Sin registros todavía.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {fertilizaciones.map((f) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", padding: "0.4rem 0", borderBottom: "1px solid #F1EBD8" }}>
                <div>
                  <div style={{ color: "#2A241C", fontWeight: 600 }}>{f.fecha}</div>
                  <div style={{ color: "#7A7160" }}>{f.productos || "sin detalle"}</div>
                  {f.notas ? <div style={{ color: "#A39A82", fontSize: "0.72rem" }}>{f.notas}</div> : null}
                </div>
                <button onClick={() => onEliminarEvento(f.id)} style={botonEliminar}>Eliminar</button>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          {!confirmandoEliminar ? (
            <button onClick={() => setConfirmandoEliminar(true)} style={{ width: "100%", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#B23A2E", background: "transparent", border: "1px solid #E2B4AC", borderRadius: 10, padding: "0.6rem", cursor: "pointer" }}>
              Eliminar este bloque
            </button>
          ) : (
            <div style={{ background: "#FBEAE7", border: "1px solid #B23A2E", borderRadius: 10, padding: "0.9rem", fontFamily: "system-ui, sans-serif" }}>
              <p style={{ fontSize: "0.82rem", color: "#7A2A20", margin: "0 0 0.7rem" }}>
                Esto elimina el bloque y todo su historial. No se puede deshacer.
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setConfirmandoEliminar(false)} style={{ flex: 1, fontSize: "0.8rem", padding: "0.5rem", borderRadius: 8, border: "1px solid #B23A2E", background: "transparent", color: "#B23A2E", cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={() => onEliminarBloque(bloque.id)} style={{ flex: 1, fontSize: "0.8rem", fontWeight: 600, padding: "0.5rem", borderRadius: 8, border: "none", background: "#B23A2E", color: "#FFFDF7", cursor: "pointer" }}>
                  Sí, eliminar
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const botonEliminar = { background: "none", border: "none", color: "#B23A2E", cursor: "pointer", fontSize: "0.72rem", fontFamily: "system-ui, sans-serif" };

function botonAccion(color) {
  return { flex: 1, minWidth: "9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "#FFFDF7", background: color, border: "none", borderRadius: 8, padding: "0.55rem", cursor: "pointer" };
}
function botonAccionSecundario() {
  return { flex: 1, minWidth: "9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "#2F4B3C", background: "#F4EEDB", border: "1px solid #C68A3E", borderRadius: 8, padding: "0.55rem", cursor: "pointer" };
}

// Formulario mínimo: solo elegir la fecha del movimiento (entrada/salida)
function FechaSimpleForm({ titulo, onCancelar, onGuardar }) {
  const [fecha, setFecha] = useState(hoyISO());
  return (
    <div style={{ marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid #F1EBD8", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      <div>
        <label style={labelStyle}>{titulo}</label>
        <input type="date" style={inputStyle} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onCancelar} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", padding: "0.5rem", borderRadius: 8, border: "1px solid #C68A3E", background: "transparent", color: "#6B4A32", cursor: "pointer" }}>
          Cancelar
        </button>
        <button onClick={() => onGuardar(fecha)} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", fontWeight: 600, padding: "0.5rem", borderRadius: 8, border: "none", background: "#2F4B3C", color: "#F5F0E3", cursor: "pointer" }}>
          Guardar
        </button>
      </div>
    </div>
  );
}

function SiembraForm({ onCancelar, onGuardar }) {
  const [fecha, setFecha] = useState(hoyISO());
  const [especie, setEspecie] = useState("");
  const [notas, setNotas] = useState("");

  return (
    <div style={{ marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid #F1EBD8", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      <div>
        <label style={labelStyle}>Fecha de siembra</label>
        <input type="date" style={inputStyle} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Especie / pasto sembrado</label>
        <input style={inputStyle} value={especie} onChange={(e) => setEspecie(e.target.value)} placeholder="ej. Marandú, Mombasa" />
      </div>
      <div>
        <label style={labelStyle}>Notas (opcional)</label>
        <input style={inputStyle} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onCancelar} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", padding: "0.5rem", borderRadius: 8, border: "1px solid #C68A3E", background: "transparent", color: "#6B4A32", cursor: "pointer" }}>
          Cancelar
        </button>
        <button onClick={() => onGuardar({ fecha, especie, notas })} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", fontWeight: 600, padding: "0.5rem", borderRadius: 8, border: "none", background: "#2F4B3C", color: "#F5F0E3", cursor: "pointer" }}>
          Guardar
        </button>
      </div>
    </div>
  );
}

function FertilizacionForm({ onCancelar, onGuardar }) {
  const [fecha, setFecha] = useState(hoyISO());
  const [productos, setProductos] = useState("");
  const [notas, setNotas] = useState("");

  return (
    <div style={{ marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid #F1EBD8", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      <div>
        <label style={labelStyle}>Fecha</label>
        <input type="date" style={inputStyle} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Abonos / productos usados</label>
        <input style={inputStyle} value={productos} onChange={(e) => setProductos(e.target.value)} placeholder="ej. 26-11-11, 2 sacos" />
      </div>
      <div>
        <label style={labelStyle}>Notas (opcional)</label>
        <input style={inputStyle} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onCancelar} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", padding: "0.5rem", borderRadius: 8, border: "1px solid #C68A3E", background: "transparent", color: "#6B4A32", cursor: "pointer" }}>
          Cancelar
        </button>
        <button
          disabled={!productos}
          onClick={() => onGuardar({ fecha, productos, notas })}
          style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", fontWeight: 600, padding: "0.5rem", borderRadius: 8, border: "none", background: !productos ? "#C9C2AC" : "#2F4B3C", color: "#F5F0E3", cursor: !productos ? "not-allowed" : "pointer" }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
