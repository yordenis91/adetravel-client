import React from "react";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";

export default function TermsOfService() {
  return (
    <LegalDocumentLayout title="Términos de Servicio" lastUpdated="[COMPLETAR AL PUBLICAR]">
      <p>
        Estos Términos de Servicio ("Términos") rigen el acceso y uso de la plataforma AdeTravel
        ("el Servicio", "la Plataforma") por parte de la agencia de viajes que contrata una
        suscripción ("el Cliente", "la Agencia"), provista por{" "}
        <strong>[RAZÓN SOCIAL DEL PROVEEDOR]</strong>, [tipo de sociedad], RUT [●], con domicilio en
        [●] ("el Proveedor", "AdeTravel", "nosotros").
      </p>
      <p>
        Al contratar el Servicio, crear una cuenta o utilizar la Plataforma, el Cliente acepta estos
        Términos en representación de la agencia que administra. Si no está de acuerdo, no debe usar
        el Servicio.
      </p>

      <h2>1. Descripción del Servicio</h2>
      <p>
        AdeTravel es un software de gestión para agencias de viajes (clientes, solicitudes,
        cotizaciones, pagos, vouchers, proveedores y reportes). El Servicio se provee mediante una{" "}
        <strong>instancia dedicada por Cliente</strong> (no es una plataforma multi-agencia
        compartida): cada Agencia contratante tiene su propia base de datos y despliegue, aislados de
        los de otras Agencias.
      </p>

      <h2>2. Licencia de uso</h2>
      <p>
        Sujeto al pago de las tarifas correspondientes y al cumplimiento de estos Términos, el
        Proveedor otorga al Cliente una licencia limitada, no exclusiva, intransferible y revocable
        para acceder y usar el Servicio durante la vigencia de la suscripción, exclusivamente para la
        operación interna de su agencia de viajes.
      </p>
      <p>El Cliente no puede, sin autorización escrita previa:</p>
      <ul>
        <li>Sublicenciar, revender, arrendar o poner el Servicio a disposición de terceros no autorizados.</li>
        <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la Plataforma.</li>
        <li>Usar el Servicio para desarrollar un producto competidor.</li>
        <li>Eliminar o alterar avisos de propiedad intelectual del Servicio.</li>
      </ul>

      <h2>3. Cuentas de usuario</h2>
      <p>
        El Cliente es responsable de mantener la confidencialidad de las credenciales de sus usuarios
        y de toda actividad que ocurra bajo esas cuentas. El Cliente debe notificar sin demora
        cualquier uso no autorizado sospechado.
      </p>

      <h2>4. Datos del Cliente y de sus clientes finales</h2>
      <p>
        El Cliente conserva todos los derechos sobre los datos que ingresa al Servicio, incluyendo los
        datos de sus propios clientes finales (viajeros): nombre, contacto, RUT, pasaporte, datos
        bancarios, itinerarios, pagos y documentación asociada ("Datos del Cliente").
      </p>
      <p>
        El Proveedor actúa como encargado/proveedor de servicios de tratamiento respecto de los Datos
        del Cliente, procesándolos únicamente para prestar el Servicio y siguiendo las instrucciones
        del Cliente, conforme a la Política de Privacidad y a la normativa de protección de datos
        aplicable. El detalle de esta relación (responsable vs. encargado de tratamiento) debe
        formalizarse en un anexo/Acuerdo de Tratamiento de Datos (DPA) entre las partes — <strong>
        no incluido en este borrador</strong>.
      </p>
      <p>
        El Cliente declara contar con las bases legales necesarias (consentimiento, ejecución de
        contrato u otra que corresponda) para que el Proveedor trate los datos de sus clientes finales
        conforme a este acuerdo.
      </p>

      <h2>5. Tarifas y pago</h2>
      <p>
        Las tarifas de suscripción, periodicidad de facturación y condiciones de pago se establecen en
        la orden de compra / propuesta comercial aceptada por el Cliente. [Completar: política de
        mora, suspensión por falta de pago, moneda, impuestos aplicables.]
      </p>

      <h2>6. Disponibilidad del Servicio y soporte</h2>
      <p>
        El Proveedor hará esfuerzos comercialmente razonables para mantener el Servicio disponible,
        pero no garantiza disponibilidad ininterrumpida. [Completar si se ofrece un SLA formal:
        porcentaje de uptime comprometido, ventanas de mantenimiento, canal y tiempos de respuesta de
        soporte.]
      </p>

      <h2>7. Propiedad intelectual</h2>
      <p>
        El Servicio, su código, diseño, marcas y documentación son propiedad exclusiva del Proveedor
        (o de sus licenciantes). Estos Términos no transfieren ningún derecho de propiedad intelectual
        sobre la Plataforma al Cliente, más allá de la licencia de uso otorgada en la Sección 2.
      </p>

      <h2>8. Confidencialidad</h2>
      <p>
        Cada parte se obliga a mantener confidencial la información no pública de la otra parte
        conocida con ocasión de este acuerdo, y a no divulgarla a terceros salvo autorización, deber
        legal o para el cumplimiento del contrato.
      </p>

      <h2>9. Garantías y exclusión de responsabilidad</h2>
      <p>
        El Servicio se provee "tal cual" ("as is"). En la medida permitida por la ley aplicable, el
        Proveedor no otorga garantías implícitas de comerciabilidad, idoneidad para un fin específico
        o no infracción.
      </p>

      <h2>10. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley aplicable, la responsabilidad total del Proveedor frente al
        Cliente por cualquier reclamo derivado de este acuerdo no excederá el monto pagado por el
        Cliente en los [●] meses anteriores al hecho que dio origen al reclamo. El Proveedor no será
        responsable por daños indirectos, lucro cesante o pérdida de datos, salvo en casos de dolo o
        culpa grave, o cuando la ley aplicable no permita esta limitación.
      </p>

      <h2>11. Vigencia y terminación</h2>
      <p>
        Estos Términos rigen mientras el Cliente mantenga una suscripción activa. Cualquiera de las
        partes puede terminar el acuerdo conforme a lo pactado en la orden de compra, o de forma
        inmediata en caso de incumplimiento grave no subsanado.
      </p>
      <p>
        Al terminar la relación, el Proveedor permitirá al Cliente exportar sus Datos del Cliente
        dentro de un plazo razonable [completar: número de días] y, transcurrido ese plazo, procederá
        a eliminarlos conforme a la Política de Privacidad, salvo obligación legal de conservación.
      </p>

      <h2>12. Ley aplicable y jurisdicción</h2>
      <p>
        [Completar: se sugiere revisar con el abogado si corresponde derecho chileno, dado que el
        Servicio usa RUT/CLP como referencia, y definir tribunales competentes o mecanismo de
        resolución de disputas.]
      </p>

      <h2>13. Modificaciones a estos Términos</h2>
      <p>
        El Proveedor puede actualizar estos Términos. Los cambios materiales se notificarán al Cliente
        con una anticipación razonable antes de entrar en vigencia.
      </p>

      <h2>14. Contacto</h2>
      <p>
        Consultas sobre estos Términos: <strong>[EMAIL DE CONTACTO LEGAL/COMERCIAL]</strong>.
      </p>
    </LegalDocumentLayout>
  );
}
