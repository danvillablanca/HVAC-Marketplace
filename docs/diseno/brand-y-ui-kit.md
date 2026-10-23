# Brand Book + UI Kit — Marketplace HVAC

> Sistema de diseño **"Aire Limpio"** — Entrega E2/E3

| Campo                 | Detalle                           |
| --------------------- | --------------------------------- |
| **Proyecto**          | Marketplace HVAC                  |
| **Asignatura**        | IIC3113 — Gestión de Proyectos TI |
| **Grupo**             | Grupo 1                           |
| **Cliente / Sponsor** | ASHRAE Chile                      |
| **Fecha**             | 24 de noviembre de 2026           |
| **Versión**           | 1.0                               |

---

## 1. Identidad y origen

### 1.1 Punto de partida: análisis de `hawaiichile.cl`

El referente directo de marca es **Hawaii Chile**, empresa de climatización con la que se identifica el rubro. El análisis de su sitio actual arroja las siguientes observaciones:

| Elemento observado            | Diagnóstico                                                           |
| ----------------------------- | --------------------------------------------------------------------- |
| Cian característico `#6ACBEE` | Color memorable y propio del rubro, pero **decorativo y sin sistema** |
| Uso del color                 | Aplicado de forma inconsistente, sin roles semánticos                 |
| Jerarquía tipográfica         | Débil; títulos y cuerpo compiten                                      |
| Contraste                     | Zonas con texto claro sobre fondos claros (bajo contraste)            |
| Densidad de información       | Bloques largos, poca estructura escaneable                            |
| Estado de componentes         | Botones, tarjetas y formularios heterogéneos                          |
| Confianza / credenciales      | No hay señal clara de proveedor verificado                            |
| Responsive                    | Comportamiento irregular en móvil                                     |

**Conclusión:** existe un activo de marca valioso (el cian) que carece de un **sistema de diseño**. La dirección "Aire Limpio" conserva la memoria cromática y la profesionaliza.

### 1.2 La marca en una frase

> _"Aire limpio, gente de confianza."_

Marketplace HVAC ayuda a encontrar y contratar proveedores HVAC **verificados** cerca de ti, con información clara y reseñas reales.

---

## 2. Dirección de arte: "Aire Limpio"

### 2.1 Concepto

"Aire Limpio" traduce el cian histórico de Hawaii Chile (`#6ACBEE`) a un sistema **moderno, técnico y confiable**. El azul-cian evoca aire, pureza y temperatura controlada; la paleta se ancla en un primario más profundo (`#0EA5C9`) para ganar legibilidad y seriedad, reservando el acento claro (`#6ACBEE`) para detalles y _gradients_.

### 2.2 Mood

| Atributo        | Descripción                                              |
| --------------- | -------------------------------------------------------- |
| **Claridad**    | Interfaz luminosa, fondos fríos suaves, mucho whitespace |
| **Técnico**     | Datos, precios y distancias presentados con precisión    |
| **Confiable**   | El verde de verificación es un protagonista del sistema  |
| **Cercano**     | Lenguaje simple, sin jerga innecesaria                   |
| **Profesional** | Composición ordenada, sin ruido visual                   |

### 2.3 Personalidad de marca

| Somos                     | No somos                         |
| ------------------------- | -------------------------------- |
| Expertos y cercanos       | Fríos ni distantes               |
| Claros y directos         | Confusos ni ambiguos             |
| Confiables y verificables | Opacos ni prometedores en exceso |
| Modernos y sobrios        | Recargados ni estridentes        |
| Chilenos, en es-CL        | Neutros ni genéricos             |

### 2.4 Referentes y qué tomamos de cada uno

| Referente                       | Aprendizaje aplicado                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| **Fintoc**                      | Monocromo + un solo acento; tarjetas alternadas; _marquee_ de logos                          |
| **Cloudflare**                  | Mega-menú por pilares; color solo para acción; mono para estadísticas                        |
| **Linear / Vercel / Stripe**    | Alto contraste, whitespace generoso, mono + 1 acento, _reveals_ sutiles, tipografía variable |
| **Resend / Raycast / Supabase** | _Dark premium_ por capas, mostrar el producto real, badge verificado verde                   |

---

## 3. Paleta

### 3.1 Paleta completa y roles (light)

| Token                  | Hex       | Rol principal                             |
| ---------------------- | --------- | ----------------------------------------- |
| `--background`         | `#F5F9FB` | Fondo base de la app (blanco frío)        |
| `--foreground`         | `#12212B` | Texto principal                           |
| `--card`               | `#FFFFFF` | Superficie de tarjetas/paneles            |
| `--primary`            | `#0EA5C9` | Acción principal, links, marca            |
| `--primary-foreground` | `#FFFFFF` | Texto/ícono sobre primario                |
| `--accent`             | `#6ACBEE` | Acento, detalles, gradients (cian Hawaii) |
| `--accent-foreground`  | `#08313E` | Texto sobre acento                        |
| `--secondary`          | `#E4EEF3` | Superficie secundaria, hover de ghost     |
| `--muted`              | `#EDF2F5` | Superficies atenuadas                     |
| `--muted-foreground`   | `#5B6B76` | Texto secundario / metadatos              |
| `--border`             | `#DCE7EC` | Bordes y separadores                      |
| `--input`              | `#DCE7EC` | Borde de campos                           |
| `--ring`               | `#0EA5C9` | Foco de teclado                           |
| `--success`            | `#16A34A` | Verificado, confirmaciones                |
| `--warning`            | `#D97706` | Avisos, estados pendientes                |
| `--destructive`        | `#DC2626` | Errores, acciones destructivas            |

### 3.2 Paleta dark (opcional)

| Token                  | Hex       |
| ---------------------- | --------- |
| `--background`         | `#0B1418` |
| `--foreground`         | `#E6EEF1` |
| `--card`               | `#101C22` |
| `--primary`            | `#38BDF8` |
| `--primary-foreground` | `#05141A` |
| `--accent`             | `#6ACBEE` |
| `--muted`              | `#16262D` |
| `--muted-foreground`   | `#93A6AF` |
| `--border`             | `#1E3138` |
| `--success`            | `#22C55E` |
| `--warning`            | `#F59E0B` |
| `--destructive`        | `#F87171` |

### 3.3 Equivalencia con clases Tailwind semánticas

| Rol        | Variable CSS         | Clase Tailwind                   | Ejemplo de uso           |
| ---------- | -------------------- | -------------------------------- | ------------------------ |
| Fondo app  | `--background`       | `bg-background`                  | `<body>`                 |
| Texto base | `--foreground`       | `text-foreground`                | Párrafos                 |
| Superficie | `--card`             | `bg-card`                        | Tarjetas, diálogos       |
| Acción     | `--primary`          | `bg-primary` / `text-primary`    | Botón principal, link    |
| Acento     | `--accent`           | `bg-accent`                      | _Gradient_, destacados   |
| Secundaria | `--secondary`        | `bg-secondary`                   | Hover, chips             |
| Atenuado   | `--muted`            | `bg-muted`                       | Skeletons, fondos suaves |
| Texto 2.º  | `--muted-foreground` | `text-muted-foreground`          | Distancia, fecha         |
| Borde      | `--border`           | `border-border`                  | Separadores              |
| Foco       | `--ring`             | `ring-ring`                      | `:focus-visible`         |
| Éxito      | `--success`          | `text-success` / `bg-success/12` | Badge "Verificado"       |
| Aviso      | `--warning`          | `text-warning`                   | Estado "En revisión"     |
| Error      | `--destructive`      | `text-destructive`               | Validaciones             |

### 3.4 Contraste verificado (WCAG 2.1)

| Combinación                      | Ratio aprox. | Veredicto                        |
| -------------------------------- | ------------ | -------------------------------- |
| `#12212B` sobre `#F5F9FB`        | **15.5:1**   | ✅ AAA                           |
| `#5B6B76` sobre `#F5F9FB`        | **5.2:1**    | ✅ AA                            |
| `#FFFFFF` sobre `#0EA5C9`        | **2.9:1**    | ⚠️ Solo texto grande/íconos y UI |
| `#08313E` sobre `#6ACBEE`        | **7.5:1**    | ✅ AAA                           |
| `#DC2626` sobre `#FFFFFF`        | **4.8:1**    | ✅ AA                            |
| `#16A34A` sobre `#FFFFFF`        | **3.3:1**    | ⚠️ Texto grande/UI + ícono       |
| `#E6EEF1` sobre `#0B1418` (dark) | **15.8:1**   | ✅ AAA                           |
| `#38BDF8` sobre `#0B1418` (dark) | **8.7:1**    | ✅ AAA                           |

> **Regla de accesibilidad:** el primario `#0EA5C9` se usa para **fondos de acción con texto grande o íconos**, no para texto pequeño sobre blanco. Para links y texto pequeño en color de marca se define `--primary-strong: #0B7C99` (≈ **4.8:1** sobre blanco). El badge "Verificado" combina verde + **ícono** + texto para no depender solo del color.

---

## 4. Tipografía

### 4.1 Familias

| Rol         | Familia             | Fallback             | Uso                               |
| ----------- | ------------------- | -------------------- | --------------------------------- |
| **Display** | **Sora**            | Inter, system-ui     | Títulos h1–h4, cifras destacadas  |
| **Body**    | **Inter**           | system-ui, Segoe UI  | Cuerpo, UI, formularios           |
| **Mono**    | (stack del sistema) | ui-monospace, SFMono | Distancias, RUT, precios técnicos |

`Sora` aporta geometría técnica y moderna; `Inter` garantiza legibilidad en UI densa. Se cargan con `font-display: swap`.

### 4.2 Escala tipográfica

| Token       | Tamaño | Interlineado | Peso    | Uso                      |
| ----------- | ------ | ------------ | ------- | ------------------------ |
| `text-xs`   | 12 px  | 16 px        | 500     | Metadatos, badges        |
| `text-sm`   | 14 px  | 20 px        | 400–500 | UI, labels, cuerpo denso |
| `text-base` | 16 px  | 24 px        | 400     | Cuerpo por defecto       |
| `text-lg`   | 18 px  | 28 px        | 500     | Subtítulos, _lead_       |
| `text-xl`   | 20 px  | 28 px        | 600     | Título de tarjeta        |
| `text-2xl`  | 24 px  | 32 px        | 600     | h3                       |
| `text-3xl`  | 30 px  | 36 px        | 600     | h2                       |
| `text-4xl`  | 36 px  | 40 px        | 700     | h1                       |
| `text-5xl`  | 48 px  | 52 px        | 700     | _Hero_ (desktop)         |

**Pesos:** 400 (body), 500 (medium, UI), 600 (semibold, títulos), 700 (bold, hero). Los títulos usan `letter-spacing: -0.02em`.

---

## 5. Espaciado y grilla

### 5.1 Escala de espaciado (múltiplos de 4 px)

| Token | Valor | Uso típico                   |
| ----- | ----- | ---------------------------- |
| `1`   | 4 px  | Separación mínima            |
| `2`   | 8 px  | Gap de chips, ícono-texto    |
| `3`   | 12 px | Padding interno compacto     |
| `4`   | 16 px | Padding estándar             |
| `6`   | 24 px | Gap de grillas, secciones    |
| `8`   | 32 px | Separación de bloques        |
| `12`  | 48 px | Padding de sección (móvil)   |
| `16`  | 64 px | Padding de sección (desktop) |
| `24`  | 96 px | _Hero_ / bloques grandes     |

### 5.2 Grilla y layout

- **Contenedor:** `.container-page` → `max-width: 80rem` (1280 px), padding lateral 16 px.
- **Columnas:** 12 en desktop (≥ 1024 px), 6 en tablet (≥ 768 px), 4 en móvil.
- **Gutter:** 24 px desktop, 16 px móvil.
- **Breakpoints (Tailwind):** `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`.
- **Ancho de lectura:** párrafos ≤ 70 caracteres (`max-w-prose`).

---

## 6. Radios y sombras

### 6.1 Radios (derivados de `--radius: 0.75rem` = 12 px)

| Token          | Fórmula         | Valor   | Uso                     |
| -------------- | --------------- | ------- | ----------------------- |
| `rounded-sm`   | `radius - 4px`  | 8 px    | Chips pequeños          |
| `rounded-md`   | `radius - 2px`  | 10 px   | Botones, inputs         |
| `rounded-lg`   | `radius`        | 12 px   | Tarjetas, paneles       |
| `rounded-xl`   | `radius + 4px`  | 16 px   | Modales, _hero cards_   |
| `rounded-2xl`  | `radius + 12px` | 24 px   | Bloques destacados      |
| `rounded-full` | —               | 9999 px | Badges, avatares, pills |

### 6.2 Sombras

| Token           | Uso                                                                                  |
| --------------- | ------------------------------------------------------------------------------------ |
| `shadow-sm`     | Reposo de botones y campos                                                           |
| `shadow`        | Tarjetas en reposo                                                                   |
| `shadow-md`     | Tarjeta en hover, _dropdown_                                                         |
| `shadow-lg`     | Diálogos, _sheets_, popovers                                                         |
| _glow_ de marca | `shadow-[0_8px_30px_-12px_rgba(14,165,201,0.45)]` en CTA principal y marcador activo |

---

## 7. Iconografía

- **Librería:** `lucide-react` (trazo consistente, open source, tree-shakeable).
- **Tamaños:** 16 px (inline en texto/badges), 20 px (UI/botones), 24 px (navegación), 32 px+ (ilustrativo).
- **Trazo:** por defecto 2 px; en tamaños grandes usar 1.5 px.
- **Color:** hereda `currentColor`; color explícito solo para estados (success/warning/destructive).
- **Acompañamiento:** los íconos **no** reemplazan texto en acciones críticas (siempre ícono + label, o `aria-label`).

| Concepto             | Ícono                              |
| -------------------- | ---------------------------------- |
| Verificado           | `BadgeCheck`                       |
| Cercanía / distancia | `MapPin` / `Navigation`            |
| Reseñas              | `Star`                             |
| Contacto             | `Phone` / `Mail` / `MessageCircle` |
| Búsqueda             | `Search`                           |
| Filtros              | `SlidersHorizontal`                |
| Servicios HVAC       | `Wind` / `Snowflake` / `Flame`     |
| Agendar              | `CalendarClock`                    |
| IA / asistente       | `Sparkles`                         |

---

## 8. Componentes base

### 8.1 Botones

Variantes (`class-variance-authority`):

| Variante      | Clase base                           | Uso                       |
| ------------- | ------------------------------------ | ------------------------- |
| `default`     | `bg-primary text-primary-foreground` | Acción principal          |
| `accent`      | `bg-accent text-accent-foreground`   | CTA destacada puntual     |
| `secondary`   | `bg-secondary`                       | Acción alternativa        |
| `outline`     | `border border-border bg-card`       | Acción terciaria          |
| `ghost`       | `hover:bg-secondary`                 | Acciones en barras/íconos |
| `destructive` | `bg-destructive`                     | Eliminar / rechazar       |
| `link`        | `text-primary underline`             | Navegación inline         |

Tamaños: `sm` (h-36 px), `default` (h-40 px), `lg` (h-48 px), `icon` (40×40 px). Interacción: `active:scale-[0.98]`.

```tsx
<Button variant="default" size="lg">
  <Search className="size-4" /> Buscar proveedores
</Button>
```

### 8.2 Badges

| Variante      | Apariencia                   | Uso                  |
| ------------- | ---------------------------- | -------------------- |
| `default`     | `bg-primary/10 text-primary` | Categoría / servicio |
| `secondary`   | `bg-secondary`               | Modalidad            |
| `success`     | `bg-success/12 text-success` | **Verificado**       |
| `warning`     | `bg-warning/15 text-warning` | En revisión          |
| `destructive` | `bg-destructive/12`          | Rechazado            |
| `outline`     | `border-border`              | Neutro               |

```tsx
<Badge variant="success">
  <BadgeCheck className="size-3" /> Verificado
</Badge>
```

**Badge "Verificado":** verde + ícono `BadgeCheck` + texto. Nunca se comunica solo por color.

### 8.3 Card de proveedor

Composición: avatar/logo → nombre + badge verificado → distancia + comuna → chips de servicios → rating (`Star`) + n.º reseñas → precio "desde" → CTA.

```tsx
<Card className="overflow-hidden transition-shadow hover:shadow-md">
  <CardHeader className="flex-row items-start gap-3">
    <Avatar />
    <div className="min-w-0">
      <h3 className="truncate font-display text-lg font-semibold">{provider.legalName}</h3>
      {provider.verificationStatus === "verificado" && (
        <Badge variant="success">
          <BadgeCheck className="size-3" /> Verificado
        </Badge>
      )}
    </div>
  </CardHeader>
  <CardContent className="space-y-2 text-sm text-muted-foreground">
    <p className="flex items-center gap-1">
      <MapPin className="size-4" /> {commune} · {distanceKm} km
    </p>
    <p className="flex items-center gap-1">
      <Star className="size-4 text-warning" /> {ratingAvg} ({reviewsCount})
    </p>
  </CardContent>
  <CardFooter className="justify-between">
    <span className="font-medium">Desde {priceFrom ? formatCLP(priceFrom) : "—"}</span>
    <Button size="sm">Ver ficha</Button>
  </CardFooter>
</Card>
```

### 8.4 Inputs y formularios

- Altura 40 px (`h-10`), radio `rounded-md`, borde `--input`.
- Label arriba, mensaje de error abajo en `text-destructive text-xs`.
- Estados: reposo, hover (`border-primary/40`), foco (`ring-2 ring-ring`), error (`border-destructive`), deshabilitado (`opacity-50`).
- Validación Zod con mensajes en es-CL.

```tsx
<div className="space-y-2">
  <Label htmlFor="rut">RUT</Label>
  <Input id="rut" placeholder="12.345.678-9" aria-invalid={!!errors.rut} />
  {errors.rut && <p className="text-xs text-destructive">{errors.rut}</p>}
</div>
```

### 8.5 Tabs

- Subrayado animado (`motion`) sobre la pestaña activa.
- Rol ARIA correcto (`role="tablist"`), navegación con flechas.
- Uso típico: "Lista" / "Mapa"; "Servicios" / "Reseñas" en la ficha.

### 8.6 Dialog / Sheet

- **Dialog:** tareas puntuales (confirmar contacto, decidir verificación).
- **Sheet:** contenido lateral (detalle de proveedor desde el mapa en móvil).
- Overlay `bg-black/40`, panel `rounded-xl shadow-lg`, cierre con `Esc` y clic fuera, _focus trap_.

### 8.7 Toasts

- Posición inferior derecha; variantes success / warning / destructive.
- Auto-cierre ~4 s, con `aria-live="polite"`.
- Ejemplo: _"Solicitud enviada. El proveedor te contactará pronto."_

---

## 9. Patrones de motion

### 9.1 Principios

- El movimiento **explica**, no decora.
- Duraciones cortas; nunca bloquear la interacción.
- Todo respeta `prefers-reduced-motion`.

### 9.2 Especificación

| Patrón                  | Duración   | Easing         | Descripción                                     |
| ----------------------- | ---------- | -------------- | ----------------------------------------------- |
| _Reveal_ de sección     | 300–500 ms | `easeOut`      | Fade + `translateY(12px)` al entrar en viewport |
| Hover de tarjeta        | 150–200 ms | `easeOut`      | `shadow` + `translateY(-2px)`                   |
| Press de botón          | 100 ms     | `easeOut`      | `scale(0.98)`                                   |
| Cambio de tema          | 200 ms     | `easeInOut`    | Transición de color de tokens                   |
| Marcador de mapa activo | 200 ms     | _spring_ suave | Escala + glow                                   |
| Toast                   | 200 ms     | `easeOut`      | Deslizamiento + fade                            |

### 9.3 Reduced motion

```tsx
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
<motion.div
  initial={prefersReduced ? false : { opacity: 0, y: 12 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, ease: "easeOut" }}
/>;
```

> Con `reduced-motion`, los _reveals_ se desactivan (contenido visible de inmediato) y los hovers se limitan a cambios de color.

---

## 10. Accesibilidad

| Criterio              | Regla                                                              |
| --------------------- | ------------------------------------------------------------------ |
| **Contraste**         | Texto normal ≥ 4.5:1; texto grande/UI ≥ 3:1 (ver §3.4)             |
| **Foco**              | `:focus-visible` con `outline: 2px solid var(--ring)`, offset 2 px |
| **Tamaño táctil**     | Objetivos interactivos ≥ **44×44 px** en móvil                     |
| **Teclado**           | Todo accionable por teclado; sin _focus traps_ fuera de modales    |
| **Semántica**         | HTML correcto, landmarks, jerarquía h1→h6 sin saltos               |
| **Formularios**       | `label` asociado, `aria-invalid`, errores descriptivos             |
| **Color**             | No es el único canal (íconos + texto en estados)                   |
| **Movimiento**        | Respetar `prefers-reduced-motion`                                  |
| **Mapa**              | Alternativa en lista para no depender solo del mapa                |
| **Texto alternativo** | `alt` en imágenes; `aria-label` en íconos-acción                   |

Meta de conformidad: **WCAG 2.1 nivel AA**.

---

## 11. Contenido y tono

### 11.1 Dos audiencias

| Audiencia                   | Necesita                                     | Tono                               |
| --------------------------- | -------------------------------------------- | ---------------------------------- |
| **Cliente final** (demanda) | Confianza, rapidez, claridad de precio       | Cercano, tranquilizador, directo   |
| **Proveedor** (oferta)      | Visibilidad, control del perfil, simplicidad | Profesional, respetuoso, motivador |

### 11.2 Reglas de redacción

- Español de Chile (**es-CL**), tuteo neutro y respetuoso.
- Frases cortas; verbo al inicio en acciones.
- Sin jerga técnica innecesaria para el cliente.
- Precios en **CLP** (`$45.000`), RUT con puntos y guion, teléfono `+56 9 XXXX XXXX`.
- Nunca prometer resultados ("el mejor proveedor"); mostrar hechos ("verificado por ASHRAE Chile").
- Mensajes de error: qué pasó + cómo resolverlo.

### 11.3 Ejemplos de copy

| Contexto        | Copy                                                                                   |
| --------------- | -------------------------------------------------------------------------------------- |
| Hero            | _"Encuentra un proveedor HVAC verificado cerca de ti."_                                |
| Subtítulo hero  | _"Climatización, ventilación y refrigeración con datos reales y reseñas de clientes."_ |
| CTA búsqueda    | _"Buscar por cercanía"_                                                                |
| Badge           | _"Verificado por ASHRAE Chile"_                                                        |
| Ficha (precio)  | _"Desde $35.000 · Visita a domicilio"_                                                 |
| Estado vacío    | _"No encontramos proveedores en este radio. Amplía la búsqueda."_                      |
| Éxito contacto  | _"Solicitud enviada. El proveedor te contactará pronto."_                              |
| Error RUT       | _"Revisa el RUT: el dígito verificador no coincide."_                                  |
| Panel proveedor | _"Completa tu perfil para aparecer en las búsquedas."_                                 |
| IA (diferido)   | _"Pregúntame sobre manuales técnicos de tus equipos."_                                 |

---

## 12. Do / Don't

| ✅ Do                                              | ❌ Don't                                        |
| -------------------------------------------------- | ----------------------------------------------- |
| Usar el primario solo para la acción principal     | Pintar múltiples botones primarios por pantalla |
| Reservar el verde exclusivamente para "verificado" | Usar verde como color decorativo                |
| Mantener el cian de marca en acentos y _gradients_ | Texto pequeño blanco sobre `#0EA5C9`            |
| Componer con whitespace y jerarquía                | Amontonar bloques sin respiración               |
| Icono + texto en estados                           | Comunicar estado solo por color                 |
| Animaciones sutiles (150–500 ms)                   | Animaciones largas o rebotantes                 |
| Precios y distancias con formato es-CL             | Formatos en inglés (`$35,000`)                  |
| Badge "Verificado" consistente                     | Variantes ad-hoc del sello de confianza         |
| Respetar `reduced-motion`                          | Ignorar preferencias de accesibilidad           |

---

## 13. Checklist de consistencia visual

**Tokens y tema**

- [ ] Se usan variables/clases semánticas (`bg-primary`, `text-muted-foreground`), no hex sueltos.
- [ ] `--radius` y sus derivados respetados en todos los componentes.
- [ ] Dark mode verificado en pantallas principales.

**Tipografía**

- [ ] Sora solo en títulos/display; Inter en cuerpo y UI.
- [ ] Escala y pesos según §4.2; sin tamaños arbitrarios.
- [ ] Ancho de lectura ≤ 70 caracteres.

**Color y contraste**

- [ ] Contrastes AA cumplidos (§3.4); primario no usado en texto pequeño.
- [ ] Verde reservado a "verificado"/éxito.
- [ ] Estados con icono + texto (no solo color).

**Componentes**

- [ ] Botones con variante/tamaño correctos; un solo primario por vista.
- [ ] Badge "Verificado" con ícono `BadgeCheck`.
- [ ] Inputs con label, foco visible y errores en es-CL.
- [ ] Modales con _focus trap_ y cierre con `Esc`.

**Motion**

- [ ] Duraciones 100–500 ms; easing consistente.
- [ ] `prefers-reduced-motion` respetado.

**Accesibilidad**

- [ ] Objetivos táctiles ≥ 44 px.
- [ ] Navegación por teclado completa.
- [ ] `alt`/`aria-label` presentes.

**Contenido**

- [ ] es-CL, formatos CLP/RUT/teléfono correctos.
- [ ] Tono adecuado a la audiencia (cliente vs. proveedor).

---

## Anexos

- **A.1** `docs/diseno/documento-de-diseno.md` — Documento de Diseño (SAD).
- **A.2** Tokens implementados en `frontend/src/index.css`.
- **A.3** Componentes base en `frontend/src/components/ui/`.
- **A.4** Referentes analizados: Fintoc, Cloudflare, Linear, Vercel, Stripe, Resend, Raycast, Supabase.
