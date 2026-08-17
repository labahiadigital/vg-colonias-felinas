<script lang="ts">
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-background">
	<div class="max-w-3xl mx-auto px-4 py-12 sm:py-16">
		<a href="/login" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-8">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
			Volver
		</a>

		<h1 class="text-3xl font-bold text-text tracking-tight mb-2">Política de Privacidad</h1>
		<p class="text-sm text-text-muted mb-8">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>

		<div class="bg-surface rounded-xl border border-border p-6 sm:p-8 space-y-6 text-sm text-text-secondary leading-relaxed">
			<section>
				<h2 class="text-base font-semibold text-text mb-2">1. Responsable del Tratamiento</h2>
				<p>La entidad responsable del tratamiento de los datos personales recogidos a través de esta plataforma es la organización suscriptora del servicio de gestión de colonias felinas (en adelante, "la Entidad").</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">2. Datos Recogidos</h2>
				<ul class="list-disc pl-5 space-y-1">
					<li><span class="font-medium text-text">Usuarios del sistema:</span> nombre, correo electrónico, rol asignado.</li>
					<li><span class="font-medium text-text">Colaboradores:</span> nombre, documento de identidad, fotografía, colonias asignadas.</li>
					<li><span class="font-medium text-text">Adoptantes:</span> nombre, documento de identidad, teléfono, email, dirección.</li>
					<li><span class="font-medium text-text">Datos operativos:</span> colonias, animales, actuaciones sanitarias, incidencias, inspecciones.</li>
					<li><span class="font-medium text-text">Datos de geolocalización:</span> coordenadas de colonias, incidencias y puntos de alimentación.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">3. Finalidad del Tratamiento</h2>
				<p>Los datos se tratan exclusivamente para la gestión de colonias felinas urbanas: censo, control sanitario, programa CER, gestión de incidencias, colaboradores y adopciones.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">4. Base Jurídica</h2>
				<ul class="list-disc pl-5 space-y-1">
					<li><span class="font-medium text-text">Interés público:</span> gestión de sanidad animal y bienestar público (Art. 6.1.e RGPD).</li>
					<li><span class="font-medium text-text">Consentimiento:</span> para colaboradores y adoptantes (Art. 6.1.a RGPD).</li>
					<li><span class="font-medium text-text">Obligación legal:</span> cumplimiento de normativa de sanidad animal (Art. 6.1.c RGPD).</li>
				</ul>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">5. Conservación de Datos</h2>
				<ul class="list-disc pl-5 space-y-1">
					<li>Datos operativos: durante la vigencia del servicio + 2 años.</li>
					<li>Datos de colaboradores: mientras estén activos + 3 años tras baja.</li>
					<li>Datos de adoptantes: 5 años desde la adopción.</li>
					<li>Registros de auditoría: 5 años.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">6. Derechos de los Interesados</h2>
				<p>Puede ejercer sus derechos de acceso, rectificación, supresión, portabilidad, limitación y oposición dirigiéndose a la Entidad responsable o al delegado de protección de datos.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">7. Seguridad</h2>
				<p>Se aplican medidas técnicas y organizativas adecuadas: cifrado en tránsito y en reposo, control de acceso por roles, registro de auditoría, política de contraseñas y cabeceras de seguridad HTTP.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">8. Ubicación de los Datos</h2>
				<p>Todos los datos se almacenan en servidores ubicados en la Unión Europea. No se realizan transferencias internacionales de datos.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">9. Cookies</h2>
				<p>La plataforma utiliza cookies técnicas estrictamente necesarias para el funcionamiento (sesión de autenticación y preferencia de idioma). No se utilizan cookies de marketing ni analíticas de terceros.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">10. Contacto</h2>
				<p>Para cualquier consulta relativa a la protección de datos, contacte con la Entidad responsable del servicio.</p>
			</section>
		</div>
	</div>
</div>
