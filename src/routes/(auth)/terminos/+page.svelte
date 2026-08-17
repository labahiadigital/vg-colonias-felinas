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

		<h1 class="text-3xl font-bold text-text tracking-tight mb-2">Términos de Servicio</h1>
		<p class="text-sm text-text-muted mb-8">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>

		<div class="bg-surface rounded-xl border border-border p-6 sm:p-8 space-y-6 text-sm text-text-secondary leading-relaxed">
			<section>
				<h2 class="text-base font-semibold text-text mb-2">1. Objeto</h2>
				<p>Estos términos regulan el uso de la plataforma SaaS de gestión de colonias felinas urbanas (en adelante, "el Servicio"), destinada a entidades públicas y organizaciones autorizadas.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">2. Acceso y Cuentas</h2>
				<ul class="list-disc pl-5 space-y-1">
					<li>El acceso requiere una cuenta proporcionada por la organización suscriptora.</li>
					<li>Cada usuario es responsable de la confidencialidad de sus credenciales.</li>
					<li>Se prohíbe compartir credenciales con terceros.</li>
					<li>Las contraseñas deben tener un mínimo de 8 caracteres.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">3. Uso Aceptable</h2>
				<ul class="list-disc pl-5 space-y-1">
					<li>El Servicio se utilizará exclusivamente para la gestión de colonias felinas y actividades relacionadas.</li>
					<li>Queda prohibido introducir datos falsos o malintencionados.</li>
					<li>Se deben respetar los datos personales de terceros.</li>
					<li>Se registran todas las acciones en un log de auditoría.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">4. Niveles de Servicio</h2>
				<ul class="list-disc pl-5 space-y-1">
					<li><span class="font-medium text-text">Disponibilidad objetivo:</span> 99,5% mensual.</li>
					<li><span class="font-medium text-text">Copias de seguridad:</span> diarias, retención mínima 30 días.</li>
					<li><span class="font-medium text-text">RPO:</span> menos de 24 horas.</li>
					<li><span class="font-medium text-text">RTO:</span> menos de 4 horas.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">5. Propiedad de los Datos</h2>
				<p>Los datos introducidos por la organización y sus usuarios son propiedad de la organización. El proveedor del Servicio actúa como encargado del tratamiento.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">6. Reversibilidad</h2>
				<p>Al finalizar el servicio, la organización recibirá una exportación completa de todos sus datos en formatos abiertos (CSV, JSON, GeoJSON). Tras la entrega confirmada, los datos se eliminarán de los servidores.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">7. Planes y Limitaciones</h2>
				<ul class="list-disc pl-5 space-y-1">
					<li><span class="font-medium text-text">Standard:</span> hasta 50 usuarios, funcionalidades completas.</li>
					<li><span class="font-medium text-text">Professional:</span> usuarios ilimitados, SMTP personalizado, soporte prioritario.</li>
					<li><span class="font-medium text-text">Enterprise:</span> personalización completa, SLA dedicado, instalación on-premise disponible.</li>
				</ul>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">8. Compatibilidad</h2>
				<p>El Servicio es compatible con las dos últimas versiones de Chrome, Firefox, Safari y Edge. Se garantiza el funcionamiento responsive en dispositivos móviles iOS y Android.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">9. Accesibilidad</h2>
				<p>El Servicio se diseña conforme a WCAG 2.1 nivel AA, incluyendo navegación por teclado, lectores de pantalla, contraste adecuado y skip navigation.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-text mb-2">10. Modificaciones</h2>
				<p>Estos términos pueden actualizarse. Los cambios se notificarán con un mínimo de 30 días de antelación.</p>
			</section>
		</div>
	</div>
</div>
