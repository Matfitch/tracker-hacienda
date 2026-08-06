import React, { useState, useMemo } from "react";
import { Search, Plus, AlertTriangle, Check, ArrowLeft, Syringe, Heart } from "lucide-react";
import { useBovinos } from "../hooks/useBovinos";
import { calcularEventos, proximoEvento, hoyISO, CATEGORIAS, infoCategoria } from "../lib/protocolos";

const COLOR_ESTADO = { vencido: "#B23A2E", hoy: "#C68A3E", proximo: "#3C7A4B" };

const GRUPOS = [
  { value: "todos", label: "Todas" },
  { value: "cria", label: "Terneros/as" },
  { value: "joven", label: "Vaconas/Toretes" },
  { value: "adulto", label: "Vacas/Toros" },
];

const USO_REPRODUCTIVO = [
  { value: "sin_definir", label: "Sin definir", color: "#7A7160" },
  { value: "ejemplar", label: "Ejemplar", color: "#3C7A4B" },
  { value: "descartado", label: "Descartado", color: "#B23A2E" },
];

function edadTexto(fechaNacimiento) {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento + "T00:00:00");
  const dias = Math.round((hoy - nac) / 86400000);
  if (dias < 30) return `${dias} días`;
  if (dias < 365) return `${Math.floor(dias / 30)} meses`;
  const años = Math.floor(dias / 365);
  const mesesRestantes = Math.floor((dias % 365) / 30);
  return mesesRestantes > 0 ? `${años}a ${mesesRestantes}m` : `${años} años`;
}

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
const pillBtn = (activo) => ({
  fontFamily: "system-ui, sans-serif",
  fontSize: "0.78rem",
  fontWeight: 600,
  padding: "0.4rem 0.7rem",
  borderRadius: 8,
  border: activo ? "1.5px solid #2F4B3C" : "1.5px solid #E7DFC9",
  background: activo ? "#2F4B3C" : "#F4EEDB",
  color: activo ? "#F5F0E3" : "#6B4A32",
  cursor: "pointer",
});

export default function Bovinos() {
  const { bovinos, aplicaciones, partos, cargando, guardarBovino, registrarAplicacion, registrarParto } =
    useBovinos();
  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [seleccionado, setSeleccionado] = useState(null);
  const [mostrandoForm, setMostrandoForm] = useState(false);

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let lista = bovinos;
    if (grupo !== "todos") lista = lista.filter((b) => infoCategoria(b.categoria).grupo === grupo);
    if (q) lista = lista.filter((b) => b.codigo?.toLowerCase().includes(q) || b.nombre?.toLowerCase().includes(q));
    return lista
      .map((b) => ({ b, prox: proximoEvento(b, aplicaciones) }))
      .sort((x, y) => {
        const ex = x.prox?.estado === "vencido" ? 0 : x.prox?.estado === "hoy" ? 1 : 2;
        const ey = y.prox?.estado === "vencido" ? 0 : y.prox?.estado === "hoy" ? 1 : 2;
        if (ex !== ey) return ex - ey;
        return (x.prox?.fecha || "9999") < (y.prox?.fecha || "9999") ? -1 : 1;
      });
  }, [bovinos, aplicaciones, busqueda, grupo]);

  const animalSeleccionado = bovinos.find((b) => b.id === seleccionado);

  if (animalSeleccionado) {
    return (
      <FichaAnimal
        bovino={animalSeleccionado}
        bovinos={bovinos}
        aplicaciones={aplicaciones}
        partos={partos}
        onVolver={() => setSeleccionado(null)}
        onIrA={(id) => setSeleccionado(id)}
        onGuardarBovino={guardarBovino}
        onRegistrarAplicacion={registrarAplicacion}
        onRegistrarParto={registrarParto}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E3", fontFamily: "'Iowan Old Style', Georgia, serif", color: "#2A241C", paddingBottom: "3rem" }}>
      <header style={{ background: "#2F4B3C", color: "#F5F0E3", padding: "1.75rem 1.25rem 1.5rem", borderBottom: "3px solid #C68A3E" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
          <Syringe size={20} color="#C68A3E" />
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#B8CBB9" }}>
            Registro sanitario
          </span>
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 600, margin: 0, color: "#F5F0E3" }}>Bovinos y protocolos</h1>
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "0 1.1rem" }}>
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "-1rem" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", background: "#FFFDF7", borderRadius: 12, padding: "0.7rem 0.9rem", boxShadow: "0 6px 18px rgba(47,75,60,0.14)", border: "1px solid #E7DFC9" }}>
            <Search size={16} color="#6B4A32" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o código..."
              style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: "#2A241C" }}
            />
          </div>
          <button onClick={() => setMostrandoForm(true)} style={{ background: "#2F4B3C", color: "#F5F0E3", border: "none", borderRadius: 12, width: 46, flexShrink: 0, cursor: "pointer", boxShadow: "0 6px 18px rgba(47,75,60,0.14)" }} aria-label="Agregar animal">
            <Plus size={20} style={{ margin: "auto" }} />
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.8rem", flexWrap: "wrap" }}>
          {GRUPOS.map((g) => (
            <button key={g.value} onClick={() => setGrupo(g.value)} style={{ ...pillBtn(grupo === g.value), borderRadius: 999 }}>
              {g.label}
            </button>
          ))}
        </div>

        {mostrandoForm && (
          <FormNuevoAnimal
            onCancelar={() => setMostrandoForm(false)}
            onGuardar={async (datos) => {
              const registro = await guardarBovino(datos);
              setMostrandoForm(false);
              setSeleccionado(registro.id);
            }}
          />
        )}

        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {cargando && bovinos.length === 0 && <p style={{ fontFamily: "system-ui, sans-serif", color: "#7A7160" }}>Cargando…</p>}
          {!cargando && resultados.length === 0 && (
            <p style={{ fontFamily: "system-ui, sans-serif", color: "#7A7160", textAlign: "center", marginTop: "2rem" }}>
              {busqueda ? "Sin resultados." : "Todavía no hay animales en este grupo."}
            </p>
          )}
          {resultados.map(({ b, prox }) => (
            <button key={b.id} onClick={() => setSeleccionado(b.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFDF7", border: "1px solid #E7DFC9", borderRadius: 12, padding: "0.8rem 1rem", textAlign: "left", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#2A241C" }}>{b.nombre || b.codigo}</div>
                <div style={{ fontSize: "0.75rem", color: "#7A7160" }}>
                  {b.codigo} · {infoCategoria(b.categoria).label} · {edadTexto(b.fecha_nacimiento)}
                </div>
              </div>
              {prox && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontWeight: 600, color: COLOR_ESTADO[prox.estado] }}>
                  {prox.estado === "vencido" && <AlertTriangle size={13} />}
                  {prox.fecha}
                </div>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function FormNuevoAnimal({ onCancelar, onGuardar }) {
  const [categoria, setCategoria] = useState("ternera");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState(hoyISO());

  return (
    <div style={{ background: "#FFFDF7", border: "1px solid #E7DFC9", borderRadius: 14, padding: "1.1rem", marginTop: "0.9rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
      <div>
        <label style={labelStyle}>Categoría</label>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {CATEGORIAS.map((c) => (
            <button key={c.value} onClick={() => setCategoria(c.value)} style={pillBtn(categoria === c.value)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Código *</label>
        <input style={inputStyle} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="ej. T-014" />
      </div>
      <div>
        <label style={labelStyle}>Nombre</label>
        <input style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="opcional" />
      </div>
      <div>
        <label style={labelStyle}>Fecha de nacimiento</label>
        <input type="date" style={inputStyle} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.3rem" }}>
        <button onClick={onCancelar} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", padding: "0.55rem", borderRadius: 8, border: "1px solid #E7DFC9", background: "transparent", color: "#6B4A32", cursor: "pointer" }}>
          Cancelar
        </button>
        <button
          disabled={!codigo || !fechaNacimiento}
          onClick={() => onGuardar({ codigo, nombre, categoria, sexo: infoCategoria(categoria).sexo, fecha_nacimiento: fechaNacimiento, estado: "activo", uso_reproductivo: "sin_definir" })}
          style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", fontWeight: 600, padding: "0.55rem", borderRadius: 8, border: "none", background: !codigo || !fechaNacimiento ? "#C9C2AC" : "#2F4B3C", color: "#F5F0E3", cursor: !codigo || !fechaNacimiento ? "not-allowed" : "pointer" }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

function FichaAnimal({ bovino, bovinos, aplicaciones, partos, onVolver, onIrA, onGuardarBovino, onRegistrarAplicacion, onRegistrarParto }) {
  const eventos = calcularEventos(bovino, aplicaciones);
  const historialAplicaciones = aplicaciones.filter((a) => a.bovino_id === bovino.id).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const historialPartos = partos.filter((p) => p.madre_id === bovino.id).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const info = infoCategoria(bovino.categoria);

  const madre = bovino.madre_id ? bovinos.find((b) => b.id === bovino.madre_id) : null;
  const hermanos = bovino.madre_id ? bovinos.filter((b) => b.madre_id === bovino.madre_id && b.id !== bovino.id) : [];

  const [registrando, setRegistrando] = useState(null);
  const [editandoReproduccion, setEditandoReproduccion] = useState(false);
  const [editandoCategoria, setEditandoCategoria] = useState(false);
  const [registrandoParto, setRegistrandoParto] = useState(false);

  const sugerirAscensoAVaca = info.value === "vacona" && !!bovino.fecha_ultimo_parto;
  const puedeReproducir = (info.grupo === "joven" || info.grupo === "adulto") && info.sexo === "hembra";

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E3", fontFamily: "'Iowan Old Style', Georgia, serif", color: "#2A241C", paddingBottom: "3rem" }}>
      <header style={{ background: "#2F4B3C", color: "#F5F0E3", padding: "1.25rem 1.25rem 1.5rem", borderBottom: "3px solid #C68A3E" }}>
        <button onClick={onVolver} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "transparent", border: "none", color: "#B8CBB9", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", cursor: "pointer", padding: 0, marginBottom: "0.6rem" }}>
          <ArrowLeft size={15} /> Volver
        </button>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, margin: 0, color: "#F5F0E3" }}>{bovino.nombre || bovino.codigo}</h1>
        <p style={{ margin: "0.2rem 0 0", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#B8CBB9" }}>
          {bovino.codigo} · {info.label} · nació {bovino.fecha_nacimiento}
        </p>
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "0 1.1rem" }}>
        {/* Categoría + uso reproductivo */}
        <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1rem 1.25rem", marginTop: "-1rem", boxShadow: "0 6px 18px rgba(47,75,60,0.14)", border: "1px solid #E7DFC9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem" }}>
              Categoría: <strong>{info.label}</strong>
            </div>
            <button onClick={() => setEditandoCategoria((v) => !v)} style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.72rem", color: "#6B4A32", background: "#F4EEDB", border: "1px dashed #C68A3E", borderRadius: 6, padding: "0.25rem 0.55rem", cursor: "pointer" }}>
              {editandoCategoria ? "Cerrar" : "Cambiar"}
            </button>
          </div>

          {sugerirAscensoAVaca && !editandoCategoria && (
            <div style={{ marginTop: "0.6rem", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", background: "#EAF2E9", border: "1px solid #A9C6AB", borderRadius: 8, padding: "0.55rem 0.7rem", color: "#2F4B3C" }}>
              Ya tiene un parto registrado — ¿la reclasificamos como <strong>Vaca</strong>?{" "}
              <button onClick={() => onGuardarBovino({ ...bovino, categoria: "vaca" })} style={{ marginLeft: "0.3rem", fontWeight: 700, background: "none", border: "none", color: "#2F4B3C", textDecoration: "underline", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", padding: 0 }}>
                Sí, marcar como Vaca
              </button>
            </div>
          )}

          {editandoCategoria && (
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.7rem" }}>
              {CATEGORIAS.map((c) => (
                <button key={c.value} onClick={async () => { await onGuardarBovino({ ...bovino, categoria: c.value, sexo: c.sexo }); setEditandoCategoria(false); }} style={pillBtn(bovino.categoria === c.value)}>
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {(info.grupo === "joven") && (
            <div style={{ marginTop: "0.8rem", paddingTop: "0.7rem", borderTop: "1px solid #F1EBD8" }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#6B4A32", marginBottom: "0.35rem" }}>
                Uso reproductivo (para evitar cruces entre hermanos):
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {USO_REPRODUCTIVO.map((u) => (
                  <button
                    key={u.value}
                    onClick={() => onGuardarBovino({ ...bovino, uso_reproductivo: u.value })}
                    style={{
                      fontFamily: "system-ui, sans-serif",
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      padding: "0.3rem 0.6rem",
                      borderRadius: 999,
                      border: `1.5px solid ${u.color}`,
                      background: bovino.uso_reproductivo === u.value ? u.color : "transparent",
                      color: bovino.uso_reproductivo === u.value ? "#FFFDF7" : u.color,
                      cursor: "pointer",
                    }}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Genealogía */}
        {(madre || hermanos.length > 0) && (
          <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1rem 1.25rem", marginTop: "0.8rem", border: "1px solid #E7DFC9" }}>
            <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.6rem", color: "#2F4B3C" }}>Genealogía</h2>
            {madre && (
              <button onClick={() => onIrA(madre.id)} style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", color: "#2A241C", background: "none", border: "none", padding: 0, marginBottom: "0.4rem", cursor: "pointer", textAlign: "left" }}>
                Madre: <strong style={{ textDecoration: "underline" }}>{madre.nombre || madre.codigo}</strong>
              </button>
            )}
            {hermanos.length > 0 && (
              <div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#B23A2E", marginBottom: "0.3rem" }}>
                  ⚠ Hermanos/as (no cruzar entre ellos):
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {hermanos.map((h) => (
                    <button key={h.id} onClick={() => onIrA(h.id)} style={{ display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#2A241C", background: "#F4EEDB", border: "none", borderRadius: 6, padding: "0.35rem 0.6rem", cursor: "pointer", textAlign: "left" }}>
                      <span>{h.nombre || h.codigo}</span>
                      <span style={{ color: "#7A7160" }}>{infoCategoria(h.categoria).label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Próximos eventos */}
        <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1.1rem 1.25rem", marginTop: "0.8rem", border: "1px solid #E7DFC9" }}>
          <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.75rem", color: "#2F4B3C" }}>Próximos / pendientes</h2>
          {eventos.length === 0 && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", color: "#7A7160" }}>Sin protocolos pendientes para esta categoría.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {eventos.map((ev) => (
              <div key={ev.etapa} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", padding: "0.55rem 0.7rem", borderRadius: 8, background: "#F4EEDB" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#2A241C" }}>{ev.etiqueta}</div>
                  <div style={{ fontSize: "0.72rem", color: COLOR_ESTADO[ev.estado] }}>
                    {ev.fecha} {ev.estado === "vencido" ? "· vencido" : ev.estado === "hoy" ? "· hoy" : ""}
                  </div>
                  {ev.sugerido && <div style={{ fontSize: "0.72rem", color: "#7A7160", marginTop: "0.1rem" }}>{ev.sugerido}</div>}
                </div>
                {!ev.informativo && (
                  <button onClick={() => setRegistrando(ev)} style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#F5F0E3", background: "#2F4B3C", border: "none", borderRadius: 6, padding: "0.3rem 0.6rem", cursor: "pointer", flexShrink: 0 }}>
                    Registrar
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {registrando && (
          <RegistrarAplicacionForm
            evento={registrando}
            onCancelar={() => setRegistrando(null)}
            onGuardar={async (medicamento, notas) => {
              await onRegistrarAplicacion({ bovino_id: bovino.id, etapa: registrando.etapa, fecha: hoyISO(), medicamento, notas });
              setRegistrando(null);
            }}
          />
        )}

        {/* Reproducción */}
        {puedeReproducir && (
          <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1.1rem 1.25rem", marginTop: "1rem", border: "1px solid #E7DFC9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <h2 style={{ fontSize: "0.95rem", margin: 0, color: "#2F4B3C" }}>Reproducción</h2>
              <button onClick={() => setEditandoReproduccion((v) => !v)} style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.72rem", color: "#6B4A32", background: "#F4EEDB", border: "1px dashed #C68A3E", borderRadius: 6, padding: "0.2rem 0.5rem", cursor: "pointer" }}>
                {editandoReproduccion ? "Cerrar" : "Inseminación ✎"}
              </button>
            </div>

            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#4A4132", lineHeight: 1.7 }}>
              <div>Partos registrados: {historialPartos.length}</div>
              <div>Inseminación (gestación actual): {bovino.fecha_inseminacion || "— sin registrar —"}</div>
            </div>

            {editandoReproduccion && (
              <div style={{ marginTop: "0.7rem" }}>
                <label style={labelStyle}>Fecha de inseminación</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={bovino.fecha_inseminacion || ""}
                  onChange={(e) => onGuardarBovino({ ...bovino, fecha_inseminacion: e.target.value || null })}
                />
              </div>
            )}

            <button
              onClick={() => setRegistrandoParto(true)}
              style={{ marginTop: "0.8rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", fontWeight: 600, padding: "0.6rem", borderRadius: 8, border: "none", background: "#C68A3E", color: "#FFFDF7", cursor: "pointer" }}
            >
              <Heart size={16} /> Registrar parto
            </button>

            {registrandoParto && (
              <RegistrarPartoForm
                bovino={bovino}
                onCancelar={() => setRegistrandoParto(false)}
                onGuardar={async (datos) => {
                  await onRegistrarParto({ madre: bovino, ...datos });
                  setRegistrandoParto(false);
                }}
              />
            )}

            {historialPartos.length > 0 && (
              <div style={{ marginTop: "1rem", paddingTop: "0.8rem", borderTop: "1px solid #F1EBD8" }}>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#6B4A32", marginBottom: "0.4rem" }}>
                  Historial de partos
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {historialPartos.map((p) => {
                    const cria = p.cria_bovino_id ? bovinos.find((b) => b.id === p.cria_bovino_id) : null;
                    return (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", padding: "0.4rem 0.6rem", background: "#F4EEDB", borderRadius: 6 }}>
                        <span>
                          Parto #{p.numero_parto} · {p.fecha} · {p.sexo_cria === "hembra" ? "♀ hembra" : "♂ macho"}
                        </span>
                        {cria ? (
                          <button onClick={() => onIrA(cria.id)} style={{ background: "none", border: "none", color: "#2F4B3C", textDecoration: "underline", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", padding: 0 }}>
                            Ver cría
                          </button>
                        ) : (
                          <span style={{ color: "#A39A82", fontSize: "0.72rem" }}>sin registrar</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Historial de aplicaciones */}
        <section style={{ background: "#FFFDF7", borderRadius: 14, padding: "1.1rem 1.25rem", marginTop: "1rem", marginBottom: "1rem", border: "1px solid #E7DFC9" }}>
          <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.75rem", color: "#2F4B3C" }}>Historial de aplicaciones</h2>
          {historialAplicaciones.length === 0 && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", color: "#7A7160" }}>Sin aplicaciones registradas todavía.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {historialAplicaciones.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", padding: "0.4rem 0", borderBottom: "1px solid #F1EBD8" }}>
                <span style={{ color: "#7A7160" }}>{a.fecha} · {a.etapa}</span>
                <span style={{ color: "#2A241C", textAlign: "right" }}>
                  {a.medicamento || "—"}
                  {a.notas && <div style={{ fontSize: "0.72rem", color: "#A39A82" }}>{a.notas}</div>}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function RegistrarAplicacionForm({ evento, onCancelar, onGuardar }) {
  const [medicamento, setMedicamento] = useState(evento.sugerido || "");
  const [notas, setNotas] = useState("");
  return (
    <section style={{ background: "#F4EEDB", borderRadius: 14, padding: "1rem 1.1rem", marginTop: "0.8rem", border: "1px solid #C68A3E" }}>
      <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.6rem", color: "#2A241C" }}>
        Registrar: {evento.etiqueta} (hoy, {hoyISO()})
      </div>
      <div style={{ marginBottom: "0.6rem" }}>
        <input style={inputStyle} value={medicamento} onChange={(e) => setMedicamento(e.target.value)} placeholder="Medicamento y dosis aplicada" />
      </div>
      <div style={{ marginBottom: "0.7rem" }}>
        <input style={inputStyle} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas (opcional)" />
      </div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button onClick={onCancelar} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", padding: "0.5rem", borderRadius: 8, border: "1px solid #C68A3E", background: "transparent", color: "#6B4A32", cursor: "pointer" }}>
          Cancelar
        </button>
        <button onClick={() => onGuardar(medicamento, notas)} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 600, padding: "0.5rem", borderRadius: 8, border: "none", background: "#2F4B3C", color: "#F5F0E3", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
          <Check size={14} /> Confirmar
        </button>
      </div>
    </section>
  );
}

function RegistrarPartoForm({ bovino, onCancelar, onGuardar }) {
  const [fecha, setFecha] = useState(hoyISO());
  const [sexoCria, setSexoCria] = useState("hembra");
  const [crearCria, setCrearCria] = useState(true);
  const [codigoCria, setCodigoCria] = useState("");
  const [nombreCria, setNombreCria] = useState("");

  return (
    <section style={{ background: "#F4EEDB", borderRadius: 14, padding: "1rem 1.1rem", marginTop: "0.8rem", border: "1px solid #C68A3E" }}>
      <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.6rem", color: "#2A241C" }}>
        Registrar parto de {bovino.nombre || bovino.codigo}
      </div>

      <div style={{ marginBottom: "0.6rem" }}>
        <label style={labelStyle}>Fecha del parto</label>
        <input type="date" style={inputStyle} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>

      <div style={{ marginBottom: "0.6rem" }}>
        <label style={labelStyle}>Sexo de la cría</label>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button onClick={() => setSexoCria("hembra")} style={pillBtn(sexoCria === "hembra")}>♀ Hembra</button>
          <button onClick={() => setSexoCria("macho")} style={pillBtn(sexoCria === "macho")}>♂ Macho</button>
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#4A4132", marginBottom: "0.6rem", cursor: "pointer" }}>
        <input type="checkbox" checked={crearCria} onChange={(e) => setCrearCria(e.target.checked)} />
        Registrar la cría como nuevo animal (queda enlazada a esta madre)
      </label>

      {crearCria && (
        <>
          <div style={{ marginBottom: "0.6rem" }}>
            <label style={labelStyle}>Código de la cría *</label>
            <input style={inputStyle} value={codigoCria} onChange={(e) => setCodigoCria(e.target.value)} placeholder="ej. T-021" />
          </div>
          <div style={{ marginBottom: "0.6rem" }}>
            <label style={labelStyle}>Nombre de la cría</label>
            <input style={inputStyle} value={nombreCria} onChange={(e) => setNombreCria(e.target.value)} placeholder="opcional" />
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.4rem" }}>
        <button onClick={onCancelar} style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", padding: "0.5rem", borderRadius: 8, border: "1px solid #C68A3E", background: "transparent", color: "#6B4A32", cursor: "pointer" }}>
          Cancelar
        </button>
        <button
          disabled={crearCria && !codigoCria}
          onClick={() => onGuardar({ fecha, sexoCria, crearCria, codigoCria, nombreCria })}
          style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 600, padding: "0.5rem", borderRadius: 8, border: "none", background: crearCria && !codigoCria ? "#C9C2AC" : "#2F4B3C", color: "#F5F0E3", cursor: crearCria && !codigoCria ? "not-allowed" : "pointer" }}
        >
          Confirmar parto
        </button>
      </div>
    </section>
  );
}
