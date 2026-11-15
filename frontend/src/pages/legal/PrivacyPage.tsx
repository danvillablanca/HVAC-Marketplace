import { LegalLayout } from "./LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad" updatedAt="02-11-2026">
      <p>
        En HVAC Connect tratamos tus datos personales conforme a la Ley N° 19.628 sobre Protección
        de la Vida Privada y sus modificaciones. Esta política explica qué datos recopilamos, para
        qué los usamos y cuáles son tus derechos.
      </p>

      <h2>1. Datos que recopilamos</h2>
      <ul>
        <li>Datos de cuenta: nombre, correo electrónico, teléfono y tipo de cuenta.</li>
        <li>Proveedores: razón social, RUT, documentos de verificación, ubicación y servicios.</li>
        <li>
          Solicitudes: descripción del problema, comuna o ubicación aproximada y fotos que decidas
          adjuntar.
        </li>
        <li>Registros técnicos de seguridad, como intentos de inicio de sesión.</li>
      </ul>

      <h2>2. Para qué los usamos</h2>
      <ul>
        <li>Crear y proteger tu cuenta.</li>
        <li>Mostrar proveedores cercanos y enviar tu solicitud a proveedores elegibles.</li>
        <li>Verificar a los proveedores antes de publicarlos.</li>
        <li>Enviarte notificaciones sobre tus solicitudes, cotizaciones y cuenta.</li>
      </ul>

      <h2>3. Con quién los compartimos</h2>
      <p>
        Antes de aceptar una cotización, el proveedor solo ve la comuna y la distancia aproximada de
        tu solicitud. Tus datos de contacto se comparten con un proveedor únicamente cuando aceptas
        su cotización. No vendemos tus datos. Usamos proveedores de infraestructura (alojamiento,
        base de datos y correo) que los tratan por cuenta nuestra.
      </p>

      <h2>4. Tus derechos</h2>
      <p>
        Puedes solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos
        escribiendo a contacto@hvac-marketplace.cl. Responderemos dentro de los plazos legales.
      </p>

      <h2>5. Conservación y seguridad</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Aplicamos control de acceso por rol,
        cifrado en tránsito y bloqueo temporal ante intentos de acceso sospechosos.
      </p>

      <h2>6. Consentimiento</h2>
      <p>
        Al registrarte aceptas expresamente esta política. Guardamos la fecha y hora de esa
        aceptación.
      </p>
    </LegalLayout>
  );
}
