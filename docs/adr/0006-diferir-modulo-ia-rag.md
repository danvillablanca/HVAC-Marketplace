# ADR-0006: Diferir el módulo IA/RAG

- **Estado:** Aceptada
- **Fecha:** 2026-09
- **Decisores:** Equipo Grupo 1 (IIC3113)

## Contexto

El concepto del marketplace contempla un **asistente inteligente** que ayude a los clientes a
describir su necesidad (p. ej. "se me congela el split") y recomiende el servicio o proveedor
adecuado, apoyado en IA generativa y posiblemente en RAG (Retrieval-Augmented Generation) sobre
documentación técnica/ASHRAE.

Sin embargo, el módulo implica: definición de embeddings, almacenamiento vectorial, integración con
un LLM, evaluación de calidad, costos por tokens y un esfuerzo de diseño considerable. El plazo del
curso y el foco del MVP exigen priorizar el flujo **core**: buscar proveedores verificados
cercanos, verlos en el mapa y generar solicitudes (leads).

## Decisión

**Diferir el módulo IA/RAG** más allá del MVP y entregarlo como **stub** en la primera fase.

- La ruta `/chat` existe en el frontend pero muestra un mensaje de "módulo diferido".
- El backend reserva `POST /api/chat` y variables de entorno (`GEMINI_API_KEY`,
  `GEMINI_CHAT_MODEL`, `GEMINI_EMBEDDING_MODEL`, `GEMINI_EMBEDDING_DIM`).
- Sin `GEMINI_API_KEY`, el backend usa un comportamiento **stub** (respuesta determinista), de
  modo que el flujo no se rompe.
- El esquema de entrada del chat (`chatSchema`) ya vive en `@hvac/shared` para no romper contratos
  a futuro.

Se reevaluará su implementación en una etapa posterior (E2/E3), con proveedor Google Gemini.

## Alternativas consideradas

| Alternativa                        | Por qué no (ahora)                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| **Implementar IA en el MVP**       | Desvía foco del flujo core y añade riesgos de costo/calidad.                        |
| **Descartar IA por completo**      | El asistente es parte de la propuesta de valor futura; conviene reservar contratos. |
| **Usar solo reglas/keywords**      | No cumple la visión de lenguaje natural; el stub ya cubre la demo.                  |
| **Otro proveedor (OpenAI, local)** | Gemini ya estaba previsto y es suficiente; se puede cambiar tras la abstracción.    |

## Consecuencias

### Positivas

- El equipo concentra el esfuerzo en el flujo core del marketplace.
- Se evitan costos por tokens y problemas de cuota durante el MVP (riesgo R5).
- Los contratos y variables quedan preparados, reduciendo el costo de habilitar el módulo después.
- La demo funciona sin dependencias externas de IA.

### Negativas

- La promesa del asistente queda incompleta en la primera entrega.
- El stub puede percibirse como funcionalidad vacía si no se comunica bien.
- Aplazar implica retomar contexto técnico más adelante (embeddings, RAG, evaluación).
- Riesgo de que la integración tardía encuentre decisiones de esquema difíciles de cambiar.
