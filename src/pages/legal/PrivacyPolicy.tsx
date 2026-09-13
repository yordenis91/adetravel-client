import React from "react";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";

export default function PrivacyPolicy() {
  return (
    <LegalDocumentLayout title="Política de Privacidad" lastUpdated="[COMPLETAR AL PUBLICAR]">
      <p>
        Esta Política de Privacidad describe cómo <strong>[RAZÓN SOCIAL DEL PROVEEDOR]</strong>
        ("AdeTravel", "el Proveedor", "nosotros") trata los datos personales en el marco de la
        plataforma AdeTravel ("el Servicio"), usada por agencias de viajes ("el Cliente", "la
        Agencia") para gestionar su operación.
      </p>
      <p>
        El Servicio se despliega como <strong>una instancia dedicada por Agencia</strong>: cada
        Agencia tiene su propia base de datos, separada de la de otras Agencias.
      </p>

      <h2>1. Dos roles distintos frente a los datos</h2>
      <p>Es importante distinguir dos categorías de datos personales que pasan por el Servicio:</p>
      <ul>
        <li>
          <strong>Datos de las cuentas de usuario del staff de la Agencia</strong> (nombre, email,
          teléfono, cargo/rol): aquí AdeTravel provee el sistema de autenticación y gestión de
          usuarios que la Agencia administra.
        </li>
        <li>
          <strong>Datos de los clientes finales de la Agencia</strong> (los viajeros): nombre,
          contacto, RUT, número de pasaporte, fecha de nacimiento, nacionalidad, datos de cuenta
          bancaria y titular, restricciones/preferencias de viaje. Estos datos los ingresa la Agencia
          al sistema para gestionar sus propios servicios de viaje — <strong>la Agencia es la
          responsable del tratamiento de estos datos frente a sus clientes</strong>; AdeTravel actúa
          como encargado/proveedor de servicios de tratamiento, procesándolos solo para operar la
          Plataforma según las instrucciones de la Agencia.
        </li>
      </ul>
      <p>
        [Completar con el abogado: si corresponde formalizar un Acuerdo de Tratamiento de Datos (DPA)
        separado con cada Agencia cliente, y si esta política debe dividirse en dos documentos — uno
        para el staff de la Agencia y otro modelo que cada Agencia adapte para sus propios clientes.]
      </p>

      <h2>2. Qué datos se recopilan</h2>
      <h3>2.1 Cuentas de usuario (staff)</h3>
      <ul>
        <li>Nombre completo, email, teléfono, departamento, rol y permisos asignados.</li>
        <li>Registros de actividad (Bitácora): acciones realizadas dentro del sistema, con fecha, usuario y descripción, para trazabilidad y auditoría.</li>
      </ul>
      <h3>2.2 Datos de clientes de la Agencia</h3>
      <ul>
        <li>Identificación: nombre, apellido, RUT, fecha de nacimiento, nacionalidad, dirección.</li>
        <li>Contacto: email, teléfono.</li>
        <li>Documentación de viaje: número de pasaporte, país y fechas de emisión/vencimiento del pasaporte, números de viajero frecuente.</li>
        <li>Datos bancarios: cuenta bancaria, banco, titular, email bancario (para gestionar pagos/reembolsos).</li>
        <li>Historial comercial: solicitudes, cotizaciones, pagos, vouchers y confirmaciones asociadas.</li>
      </ul>

      <h2>3. Finalidad del tratamiento</h2>
      <ul>
        <li>Gestionar la relación comercial entre la Agencia y sus clientes (cotizar, vender, facturar y documentar servicios de viaje).</li>
        <li>Administrar cuentas y permisos del staff de la Agencia.</li>
        <li>Enviar notificaciones operativas (confirmaciones, recordatorios) por correo electrónico, según la configuración de cada Agencia.</li>
        <li>Seguridad, auditoría y prevención de uso indebido de la Plataforma.</li>
        <li>Mejorar y dar soporte técnico al Servicio.</li>
      </ul>

      <h2>4. Base legal</h2>
      <p>
        [Completar con el abogado: tratándose de datos de clientes de la Agencia, la base legal
        recae principalmente en la Agencia — probablemente ejecución de un contrato de servicios de
        viaje y/o consentimiento del titular. Para los datos de cuentas del staff, la relación laboral
        o contractual con la Agencia.]
      </p>

      <h2>5. Conservación de datos</h2>
      <p>
        Los datos se conservan mientras la Agencia mantenga una suscripción activa y por el plazo
        adicional que exija la normativa aplicable (por ejemplo, obligaciones tributarias o
        contables). Al terminar la relación con una Agencia, sus datos se eliminan conforme a lo
        pactado en los Términos de Servicio. [Completar: plazos concretos de retención y de borrado.]
      </p>

      <h2>6. Medidas de seguridad</h2>
      <p>El Servicio implementa, entre otras, las siguientes medidas técnicas:</p>
      <ul>
        <li>
          <strong>Cifrado en reposo</strong> de los campos más sensibles de cada cliente (número de
          pasaporte, cuenta bancaria y titular) mediante AES-256-GCM, de forma que ni siquiera un
          acceso directo a la base de datos expone esos valores en texto plano.
        </li>
        <li>
          <strong>Control de acceso basado en roles (RBAC)</strong>: cada usuario del staff solo
          puede ver y operar los módulos para los que tiene permiso explícito.
        </li>
        <li>
          <strong>Autenticación</strong> mediante tokens JWT con expiración, y contraseñas
          almacenadas con hash (nunca en texto plano).
        </li>
        <li>Cabeceras HTTP de seguridad (Helmet), CORS restringido y límite de tasa de peticiones (rate limiting) contra abuso.</li>
        <li>
          <strong>Registro de auditoría (Bitácora)</strong> de operaciones sensibles (creación, edición y eliminación de registros).
        </li>
        <li>Comunicación cifrada (HTTPS) entre el navegador y el servidor.</li>
      </ul>
      <p>
        Ninguna medida de seguridad es infalible; en caso de un incidente que comprometa datos
        personales, se notificará conforme a lo exigido por la normativa aplicable y a lo pactado
        con cada Agencia.
      </p>

      <h2>7. Monitoreo de errores y grabación de sesión</h2>
      <p>
        El Servicio usa una herramienta de monitoreo de errores (Sentry) que puede grabar sesiones de
        uso del staff cuando ocurre un error, para poder diagnosticarlo. Esas grabaciones tienen el
        texto y los medios <strong>enmascarados por defecto</strong> (no se ven los valores reales
        escritos en los formularios). No se usa para publicidad ni se comparte con terceros ajenos al
        soporte técnico del Servicio.
      </p>

      <h2>8. Terceros y subencargados</h2>
      <p>
        Para operar el Servicio se apoya en proveedores de infraestructura y comunicación, entre
        ellos: hosting/infraestructura en la nube, un proveedor de envío de correo (SMTP, configurable
        por cada Agencia) y la herramienta de monitoreo de errores mencionada en la sección anterior.
        [Completar: listar proveedores concretos (p.ej. Easypanel, el SMTP contratado, Sentry) y sus
        políticas de privacidad, y confirmar si alguno implica transferencia internacional de datos.]
      </p>

      <h2>9. Transferencias internacionales</h2>
      <p>
        [Completar con el abogado: si el hosting o alguno de los proveedores de la Sección 8 procesa
        datos fuera del país donde opera la Agencia, se debe informar aquí el mecanismo de
        transferencia utilizado (cláusulas contractuales, adecuación u otro que aplique).]
      </p>

      <h2>10. Derechos de los titulares de datos</h2>
      <p>
        Los titulares de datos personales pueden ejercer sus derechos de acceso, rectificación,
        cancelación/supresión, oposición y portabilidad (derechos ARCO y los que agrega la normativa
        vigente), contactando a la Agencia con la que tienen la relación comercial directa, o a{" "}
        <strong>[EMAIL DE CONTACTO DE PRIVACIDAD]</strong> si la solicitud es respecto de una cuenta
        de usuario del staff. [Completar: procedimiento y plazos de respuesta conforme a la ley
        aplicable — en Chile, considerar la Ley 21.719.]
      </p>

      <h2>11. Menores de edad</h2>
      <p>
        El Servicio no está dirigido a menores de edad como usuarios directos del sistema. Los datos
        de menores que viajan pueden registrarse como parte de una reserva, bajo la responsabilidad
        de la Agencia y con el consentimiento de su representante legal.
      </p>

      <h2>12. Cambios a esta política</h2>
      <p>
        Esta política puede actualizarse. Los cambios materiales se notificarán a las Agencias con
        una anticipación razonable antes de entrar en vigencia.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Consultas sobre esta política o solicitudes relacionadas con datos personales:{" "}
        <strong>[EMAIL DE CONTACTO DE PRIVACIDAD]</strong>.
      </p>
    </LegalDocumentLayout>
  );
}
