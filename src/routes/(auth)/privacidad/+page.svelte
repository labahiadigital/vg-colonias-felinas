<script lang="ts">
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<div class="max-w-3xl mx-auto p-6 sm:p-10">
	<h1 class="text-2xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>

	<div class="prose prose-sm text-gray-700 space-y-4">
		<p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}</p>

		<h2 class="text-lg font-bold">1. Responsable del Tratamiento</h2>
		<p>La entidad responsable del tratamiento de los datos personales recogidos a través de esta plataforma es la organización suscriptora del servicio de gestión de colonias felinas (en adelante, "la Entidad").</p>

		<h2 class="text-lg font-bold">2. Datos Recogidos</h2>
		<ul>
			<li><strong>Usuarios del sistema:</strong> nombre, correo electrónico, rol asignado.</li>
			<li><strong>Colaboradores:</strong> nombre, documento de identidad, fotografía, colonias asignadas.</li>
			<li><strong>Adoptantes:</strong> nombre, documento de identidad, teléfono, email, dirección.</li>
			<li><strong>Datos operativos:</strong> colonias, animales, actuaciones sanitarias, incidencias, inspecciones.</li>
			<li><strong>Datos de geolocalización:</strong> coordenadas de colonias, incidencias y puntos de alimentación.</li>
		</ul>

		<h2 class="text-lg font-bold">3. Finalidad del Tratamiento</h2>
		<p>Los datos se tratan exclusivamente para la gestión de colonias felinas urbanas: censo, control sanitario, programa CER, gestión de incidencias, colaboradores y adopciones.</p>

		<h2 class="text-lg font-bold">4. Base Jurídica</h2>
		<ul>
			<li><strong>Interés público:</strong> gestión de sanidad animal y bienestar público (Art. 6.1.e RGPD).</li>
			<li><strong>Consentimiento:</strong> para colaboradores y adoptantes (Art. 6.1.a RGPD).</li>
			<li><strong>Obligación legal:</strong> cumplimiento de normativa de sanidad animal (Art. 6.1.c RGPD).</li>
		</ul>

		<h2 class="text-lg font-bold">5. Conservación de Datos</h2>
		<ul>
			<li>Datos operativos: durante la vigencia del servicio + 2 años.</li>
			<li>Datos de colaboradores: mientras estén activos + 3 años tras baja.</li>
			<li>Datos de adoptantes: 5 años desde la adopción.</li>
			<li>Registros de auditoría: 5 años.</li>
		</ul>

		<h2 class="text-lg font-bold">6. Derechos de los Interesados</h2>
		<p>Puede ejercer sus derechos de acceso, rectificación, supresión, portabilidad, limitación y oposición dirigiéndose a la Entidad responsable o al delegado de protección de datos.</p>

		<h2 class="text-lg font-bold">7. Seguridad</h2>
		<p>Se aplican medidas técnicas y organizativas adecuadas: cifrado en tránsito y en reposo, control de acceso por roles, registro de auditoría, política de contraseñas y cabeceras de seguridad HTTP.</p>

		<h2 class="text-lg font-bold">8. Ubicación de los Datos</h2>
		<p>Todos los datos se almacenan en servidores ubicados en la Unión Europea. No se realizan transferencias internacionales de datos.</p>

		<h2 class="text-lg font-bold">9. Cookies</h2>
		<p>La plataforma utiliza cookies técnicas estrictamente necesarias para el funcionamiento (sesión de autenticación y preferencia de idioma). No se utilizan cookies de marketing ni analíticas de terceros.</p>

		<h2 class="text-lg font-bold">10. Contacto</h2>
		<p>Para cualquier consulta relativa a la protección de datos, contacte con la Entidad responsable del servicio.</p>
	</div>

	<div class="mt-8 text-center">
		<a href="/login" class="text-primary hover:underline text-sm font-semibold">← Volver al inicio de sesión</a>
	</div>
</div>
