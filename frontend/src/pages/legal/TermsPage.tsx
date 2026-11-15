import { Link } from "react-router-dom";
import { LegalLayout } from "./LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Términos y condiciones" updatedAt="02-11-2026">
      <p>
        Estos términos regulan el uso de HVAC Connect, plataforma que conecta a personas y empresas
        que necesitan servicios de climatización (clientes) con empresas proveedoras de servicios
        HVAC en Chile (proveedores). Al crear una cuenta aceptas estos términos y la{" "}
        <Link to="/privacidad" className="text-primary hover:underline">
          Política de privacidad
        </Link>
        .
      </p>

      <h2>1. Cuentas</h2>
      <ul>
        <li>Debes entregar información veraz y mantener la confidencialidad de tu contraseña.</li>
        <li>
          Puedes registrarte como cliente o como proveedor. Las cuentas de administración las crea
          el equipo de HVAC Connect y no pueden obtenerse por registro.
        </li>
        <li>
          Por seguridad, la cuenta se bloquea temporalmente tras varios intentos fallidos de
          ingreso, y la sesión se cierra tras 7 días sin actividad.
        </li>
      </ul>

      <h2>2. Proveedores verificados</h2>
      <p>
        Los proveedores solo aparecen en las búsquedas y reciben solicitudes una vez aprobada su
        verificación, que revisa los antecedentes enviados (RUT, patente y certificaciones). La
        verificación no constituye garantía sobre los trabajos que cada proveedor realiza.
      </p>

      <h2>3. Solicitudes y cotizaciones</h2>
      <ul>
        <li>
          Las cotizaciones son ofertas del proveedor al cliente. HVAC Connect no es parte del
          contrato de servicio que se celebre entre ellos.
        </li>
        <li>
          Los datos de contacto de las partes se comparten solo cuando el cliente acepta una
          cotización.
        </li>
        <li>Las reseñas deben reflejar experiencias reales con servicios completados.</li>
      </ul>

      <h2>4. Asistente de inteligencia artificial</h2>
      <p>
        Las respuestas del asistente son orientativas y no reemplazan la evaluación de un técnico
        calificado.
      </p>

      <h2>5. Uso aceptable</h2>
      <p>
        No está permitido publicar contenido falso, ofensivo o ilegal, ni intentar acceder a datos
        de otros usuarios. HVAC Connect puede suspender las cuentas que infrinjan estos términos.
      </p>

      <h2>6. Cambios</h2>
      <p>
        Podemos actualizar estos términos; te avisaremos de los cambios relevantes a través de la
        plataforma.
      </p>

      <p className="text-muted-foreground">
        HVAC Connect es un proyecto académico (IIC3113, Grupo 1) desarrollado junto a ASHRAE Chile.
      </p>
    </LegalLayout>
  );
}
