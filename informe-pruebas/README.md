# Documento LaTeX -- Informe Técnico NEXO-PARK

Este directorio contiene el código fuente completo en LaTeX del **Informe Técnico de Pruebas e Integración del Segundo Parcial** para el proyecto **NEXO-PARK** (Sistemas Distribuidos).

---

## 🎨 Características del Diseño

1. **Portada Estilo Landing Page**:
   * Insignia corporativa superior ("ESPE").
   * Tipografía limpia, moderna y jerarquía visual audaz.
   * Cuadro de autores (*Mesias Mariscal*, *Denise Rea*, *Julio Viche*).
2. **Bloques de Código Estilo macOS + Dracula Theme (`macdraculacode`)**:
   * Encabezado de ventana macOS con los 3 botones característicos (🔴 Rojo, 🟡 Amarillo, 🟢 Verde).
   * Paleta de colores oficial **Dracula Theme** (Fondo `#282A36`, resalte en púrpuras, cianos, rosas, verdes y amarillos).
3. **Evidencia de Pruebas Reales**:
   * Trazas reales de ejecuciones JUnit 5 / Spring Boot (`BUILD SUCCESS`).
   * Validaciones de tokens JWT RS256 en Kong Gateway.
   * Pruebas de eventos AMQP en RabbitMQ.
   * Transmisión en tiempo real por Server-Sent Events (SSE).
   * Estado del clúster en Kubernetes (`kubectl get pods,services,ingress -n nexo-park`).

---

## 🚀 Cómo Compilar el PDF

### Opción 1: En Overleaf (Recomendado - 1 Clic)
1. Entra a [Overleaf](https://www.overleaf.com/).
2. Crea un **Nuevo Proyecto** -> **Subir Proyecto**.
3. Arrastra y suelta el archivo `latex/main.tex` (o la carpeta `latex/`).
4. Presiona **Recompile** (asegúrate de que el compilador esté configurado en `pdfLaTeX`).

### Opción 2: Compilación Local (VS Code / TeX Live / MiKTeX)
Si tienes TeX Live o MiKTeX instalado localmente:
```bash
cd latex
pdflatex main.tex
```
Se generará el archivo `main.pdf`.
