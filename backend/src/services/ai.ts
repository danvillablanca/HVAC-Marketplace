import type { ChatInput } from "@hvac/shared";
import { env, hasGemini } from "../lib/env";

export interface AiAnswer {
  answer: string;
  sources: string[];
  stub: boolean;
}

// ---- Diagnóstico basado en reglas HVAC ----

interface DiagnosticRule {
  keywords: string[];
  answer: string;
  sources: string[];
}

const HVAC_RULES: DiagnosticRule[] = [
  {
    keywords: ["no enfria", "no enfría", "no baja temperatura", "enfria poco", "enfría poco"],
    answer:
      "Si tu equipo no enfría correctamente, puede deberse a varias causas:\n\n" +
      "1. **Filtros sucios**: Revisa y limpia los filtros del evaporador. Filtros obstruidos reducen el flujo de aire.\n" +
      "2. **Fuga de refrigerante**: Si el equipo tiene poco gas refrigerante, no podrá enfriar. Esto requiere un técnico certificado.\n" +
      "3. **Compresor dañado**: Si escuchas el ventilador pero el compresor no arranca, podría estar fallando.\n" +
      "4. **Condensador sucio**: La unidad exterior necesita limpieza periódica para disipar el calor.\n\n" +
      "**Recomendación**: Si limpiaste los filtros y el problema persiste, solicita una visita técnica. " +
      "Un técnico verificado podrá medir presiones de refrigerante y diagnosticar con precisión.",
    sources: ["manual-diagnostico-hvac", "ashrae-handbook-fundamentals"],
  },
  {
    keywords: ["ruido", "hace ruido", "vibra", "vibracion", "vibración", "golpea", "traquetea"],
    answer:
      "Los ruidos inusuales en equipos HVAC pueden indicar:\n\n" +
      "1. **Vibración por soportes flojos**: Verifica que la unidad exterior esté bien nivelada y los soportes antivibratorios estén en buen estado.\n" +
      "2. **Aspas del ventilador**: Una aspa doblada o sucia puede causar ruido. Inspecciona visualmente.\n" +
      "3. **Rodamientos del motor**: Un zumbido constante puede indicar rodamientos desgastados.\n" +
      '4. **Expansión de refrigerante**: Un "burbujeo" suave es normal; un silbido fuerte puede indicar fuga.\n\n' +
      "**Recomendación**: Ruidos metálicos o golpes fuertes requieren atención inmediata — apaga el equipo y contacta un técnico.",
    sources: ["manual-diagnostico-hvac"],
  },
  {
    keywords: ["olor", "huele mal", "mal olor", "hedor", "huele a humedad"],
    answer:
      "Olores desagradables del aire acondicionado suelen deberse a:\n\n" +
      "1. **Hongos y bacterias en el evaporador**: La humedad acumulada favorece el crecimiento de microorganismos.\n" +
      "2. **Bandeja de drenaje obstruida**: Si el agua condensada no drena bien, se estanca y genera malos olores.\n" +
      "3. **Filtro contaminado**: Un filtro sucio puede ser fuente de olores.\n\n" +
      "**Solución**: Limpia los filtros, aplica un desinfectante específico para evaporadores (venta en ferreterías), " +
      "y verifica que el drenaje esté libre. Si el olor persiste, solicita una mantención completa con un técnico verificado.",
    sources: ["manual-diagnostico-hvac", "ashrae-62.1-ventilacion"],
  },
  {
    keywords: [
      "gotea",
      "agua",
      "pierde agua",
      "filtra agua",
      "goteo",
      "condensacion",
      "condensación",
    ],
    answer:
      "Las filtraciones de agua en equipos split suelen deberse a:\n\n" +
      "1. **Drenaje obstruido**: La cañería de desagüe acumula algas o suciedad. Puedes limpiarla con un cable flexible y agua.\n" +
      "2. **Bandeja de condensado llena**: Si la bandeja está rota o inclinada, el agua se desborda.\n" +
      "3. **Diferencia de temperatura excesiva**: En condiciones muy húmedas, puede condensar más de lo normal.\n" +
      "4. **Instalación deficiente**: La unidad interior debe tener una leve inclinación hacia el lado del drenaje.\n\n" +
      "**Recomendación**: Limpia el drenaje como primera medida. Si el problema sigue, un técnico debe revisar la instalación.",
    sources: ["manual-diagnostico-hvac"],
  },
  {
    keywords: [
      "instalar",
      "instalacion",
      "instalación",
      "nuevo equipo",
      "comprar",
      "cual compro",
      "cuál compro",
      "que equipo",
      "qué equipo",
    ],
    answer:
      "Para elegir e instalar un equipo HVAC adecuado, considera:\n\n" +
      "1. **Cálculo de carga térmica**: Según el tamaño del espacio, aislación, orientación y clima. " +
      "Un técnico calcula los BTU/h necesarios (aprox. 600 BTU por m² en Chile central).\n" +
      "2. **Tipo de equipo**:\n" +
      "   - **Split muro**: Ideal para habitaciones (9.000-24.000 BTU)\n" +
      "   - **Split ducto**: Para espacios grandes o múltiples zonas\n" +
      "   - **VRF**: Edificios comerciales con múltiples unidades\n" +
      "   - **Chiller**: Sistemas centralizados industriales\n" +
      "3. **Eficiencia energética**: Busca equipos con clasificación A o superior.\n" +
      "4. **Instalación**: SIEMPRE debe ser realizada por un técnico certificado. Una mala instalación reduce la vida útil.\n\n" +
      "**Recomendación**: Solicita cotizaciones a proveedores verificados indicando los m² del espacio y el uso (residencial/comercial).",
    sources: ["ashrae-handbook-fundamentals", "sec-chile-eficiencia"],
  },
  {
    keywords: [
      "mantencion",
      "mantención",
      "mantenimiento",
      "limpieza",
      "cada cuanto",
      "cada cuánto",
      "preventivo",
      "preventiva",
    ],
    answer:
      "La mantención preventiva de equipos HVAC es fundamental:\n\n" +
      "**Frecuencia recomendada**:\n" +
      "- **Filtros**: Limpiar cada 2-4 semanas (usuario puede hacerlo)\n" +
      "- **Mantención básica**: Cada 6 meses (inicio de verano e invierno)\n" +
      "- **Mantención completa**: Anual, incluye revisión de gas, limpieza profunda de evaporador/condensador\n\n" +
      "**Qué incluye una mantención profesional**:\n" +
      "1. Limpieza de filtros, evaporador y condensador\n" +
      "2. Verificación de presiones de refrigerante\n" +
      "3. Revisión de conexiones eléctricas\n" +
      "4. Limpieza de drenaje\n" +
      "5. Verificación del funcionamiento general\n\n" +
      "**Costo aproximado en Chile**: $25.000-$50.000 CLP para un split residencial.\n\n" +
      "**Recomendación**: Programa tu mantención antes de cada temporada para evitar fallas en los meses de mayor uso.",
    sources: ["ashrae-180-mantencion", "manual-diagnostico-hvac"],
  },
  {
    keywords: [
      "costo",
      "precio",
      "cuanto cuesta",
      "cuánto cuesta",
      "valor",
      "cotizar",
      "cotización",
      "cotizacion",
      "presupuesto",
    ],
    answer:
      "Los costos de servicios HVAC en Chile varían según el tipo de trabajo:\n\n" +
      "**Estimaciones referenciales (CLP, 2024)**:\n" +
      "- **Mantención preventiva split**: $25.000 - $50.000\n" +
      "- **Carga de gas refrigerante**: $40.000 - $80.000\n" +
      "- **Instalación split residencial**: $80.000 - $180.000 (sin equipo)\n" +
      "- **Reparación compresor**: $150.000 - $350.000\n" +
      "- **Instalación ducto comercial**: desde $500.000\n\n" +
      "Estos valores son orientativos. El precio final depende de la marca, capacidad, accesibilidad y ubicación.\n\n" +
      "**Recomendación**: Solicita al menos 3 cotizaciones de proveedores verificados a través de nuestra plataforma para comparar.",
    sources: ["mercado-hvac-chile"],
  },
  {
    keywords: ["no enciende", "no prende", "no funciona", "no arranca", "apagado"],
    answer:
      "Si tu equipo HVAC no enciende, verifica lo siguiente:\n\n" +
      "1. **Suministro eléctrico**: Revisa el breaker/automático del tablero eléctrico. Debe estar en posición ON.\n" +
      "2. **Control remoto**: Verifica las pilas y que el equipo reciba la señal (algunos tienen un botón de encendido manual en la unidad).\n" +
      "3. **Protección por temperatura**: Muchos equipos tienen un timer de protección de 3 minutos después de apagarse.\n" +
      "4. **Fusible interno**: Si hubo una sobrecarga, el fusible pudo haberse quemado.\n\n" +
      "**Si nada de esto funciona**: Probablemente hay un problema en la placa electrónica o el capacitor de arranque. " +
      "NO intentes reparar componentes eléctricos por tu cuenta — contacta un técnico certificado.",
    sources: ["manual-diagnostico-hvac"],
  },
  {
    keywords: ["emergencia", "urgente", "urgencia", "24/7", "hoy", "ahora"],
    answer:
      "Para atención de emergencia HVAC:\n\n" +
      "1. **Cámaras de frío**: Si almacenas alimentos o medicamentos, una falla es crítica. Busca proveedores con atención 24/7.\n" +
      "2. **Fuga de refrigerante**: Si sospechas una fuga de gas, ventila el espacio y contacta a un técnico inmediatamente.\n" +
      "3. **Problemas eléctricos**: Si ves chispas o hueles a quemado, desconecta el equipo del breaker y llama a un profesional.\n\n" +
      '**Recomendación**: Usa nuestra plataforma para crear una solicitud con urgencia "Urgente" y los proveedores disponibles te contactarán rápidamente.',
    sources: ["protocolos-emergencia-hvac"],
  },
  {
    keywords: ["split", "muro", "residencial", "casa", "departamento", "hogar"],
    answer:
      "Los equipos **split muro** son los más comunes para uso residencial en Chile:\n\n" +
      "**Capacidades típicas**:\n" +
      "- 9.000 BTU: Habitación de hasta 15 m²\n" +
      "- 12.000 BTU: Habitación/living de 15-20 m²\n" +
      "- 18.000 BTU: Living-comedor de 20-30 m²\n" +
      "- 24.000 BTU: Espacios de 30-40 m²\n\n" +
      "**Marcas populares en Chile**: Midea, Samsung, LG, Daikin, Carrier\n\n" +
      "**Tecnología inverter**: Recomendada por su eficiencia energética (ahorra 30-50% en consumo eléctrico vs. convencional).\n\n" +
      "**Recomendación**: Para seleccionar la capacidad correcta, indica los m² del espacio al crear tu solicitud y un proveedor verificado te asesorará.",
    sources: ["ashrae-handbook-fundamentals", "sec-chile-eficiencia"],
  },
];

const DEFAULT_ANSWER: AiAnswer = {
  answer:
    "Gracias por tu consulta. Puedo ayudarte con:\n\n" +
    "- **Diagnóstico de problemas**: Describe los síntomas de tu equipo (no enfría, hace ruido, gotea, etc.)\n" +
    "- **Asesoría de instalación**: Qué tipo y capacidad de equipo necesitas\n" +
    "- **Mantención**: Cada cuánto y qué incluye\n" +
    "- **Costos referenciales**: Precios orientativos de servicios en Chile\n" +
    "- **Emergencias**: Qué hacer ante una falla urgente\n\n" +
    "Describe tu situación con el mayor detalle posible para orientarte mejor. " +
    "También puedes crear una solicitud de servicio para recibir cotizaciones de proveedores verificados.",
  sources: [],
  stub: false,
};

function matchRules(message: string): AiAnswer {
  const lower = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const rule of HVAC_RULES) {
    const matched = rule.keywords.some((kw) => {
      const normalizedKw = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return lower.includes(normalizedKw);
    });
    if (matched) {
      return { answer: rule.answer, sources: rule.sources, stub: false };
    }
  }

  return DEFAULT_ANSWER;
}

// ---- Gemini integration (when available) ----

const SYSTEM_PROMPT =
  "Eres un asistente técnico experto en HVAC (calefacción, ventilación y aire acondicionado) " +
  "para el mercado chileno. Ayudas a diagnosticar problemas, recomendar equipos y orientar a los usuarios " +
  "sobre mantención y costos. Responde siempre en español chileno, de forma clara y estructurada. " +
  "Cuando no puedas diagnosticar con certeza, recomienda contactar a un técnico certificado a través de la plataforma HVAC Connect. " +
  "Usa precios en CLP cuando corresponda. Incluye recomendaciones de seguridad cuando aplique. " +
  "Mantén respuestas concisas pero completas (máximo 300 palabras).";

async function askGemini(message: string): Promise<AiAnswer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiChatModel}:generateContent?key=${env.geminiApiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: message }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    console.error("[ai] Gemini error:", res.status, await res.text().catch(() => ""));
    // Fall back to rules
    return matchRules(message);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return matchRules(message);

  return {
    answer: text,
    sources: ["gemini-ai"],
    stub: false,
  };
}

// ---- Public API ----

export async function answerQuestion(input: ChatInput, _userId: string): Promise<AiAnswer> {
  if (hasGemini) {
    try {
      return await askGemini(input.message);
    } catch (err) {
      console.error("[ai] Gemini exception:", err);
      return matchRules(input.message);
    }
  }

  return matchRules(input.message);
}
