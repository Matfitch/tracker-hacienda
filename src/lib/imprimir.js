// Abre una ventana nueva con el contenido dado, lista para imprimir o
// guardar como PDF (usa el diálogo nativo de impresión del navegador).
export function imprimir(titulo, contenidoHtml) {
  const ventana = window.open("", "_blank");
  if (!ventana) {
    alert("El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para esta app.");
    return;
  }
  ventana.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${titulo}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Georgia, 'Times New Roman', serif;
            color: #2A241C;
            padding: 2rem;
            max-width: 700px;
            margin: 0 auto;
          }
          h1 { font-size: 1.4rem; color: #2F4B3C; margin: 0 0 0.2rem; }
          h2 { font-size: 1rem; color: #2F4B3C; border-bottom: 1px solid #C68A3E; padding-bottom: 0.3rem; margin: 1.4rem 0 0.6rem; }
          .subtitulo { font-family: system-ui, sans-serif; font-size: 0.8rem; color: #7A7160; margin-bottom: 1rem; }
          table { width: 100%; border-collapse: collapse; font-family: system-ui, sans-serif; font-size: 0.85rem; }
          td, th { text-align: left; padding: 0.35rem 0.4rem; border-bottom: 1px solid #E7DFC9; }
          th { color: #6B4A32; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; }
          .fila-total td { font-weight: 700; border-top: 2px solid #2F4B3C; border-bottom: none; }
          .campo { font-family: system-ui, sans-serif; font-size: 0.88rem; margin: 0.25rem 0; }
          .campo strong { color: #6B4A32; }
          .foto { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 1px solid #E7DFC9; }
          .encabezado { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${contenidoHtml}
      </body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 300);
}
