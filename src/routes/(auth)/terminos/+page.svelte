<script lang="ts">
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<div class="max-w-3xl mx-auto p-6 sm:p-10">
	<h1 class="text-2xl font-bold text-gray-900 mb-6">Términos de Servicio</h1>

	<div class="prose prose-sm text-gray-700 space-y-4">
		<p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}</p>

		<h2 class="text-lg font-bold">1. Objeto</h2>
		<p>Estos términos regulan el uso de la plataforma SaaS de gestión de colonias felinas urbanas (en adelante, "el Servicio"), destinada a entidades públicas y organizaciones autorizadas.</p>

		<h2 class="text-lg font-bold">2. Acceso y Cuentas</h2>
		<ul>
			<li>El acceso requiere una cuenta proporcionada por la organización suscriptora.</li>
			<li>Cada usuario es responsable de la confidencialidad de sus credenciales.</li>
			<li>Se prohíbe compartir credenciales con terceros.</li>
			<li>Las contraseñas deben tener un mínimo de 8 caracteres.</li>
		</ul>

		<h2 class="text-lg font-bold">3. Uso Aceptable</h2>
		<ul>
			<li>El Servicio se utilizará exclusivamente para la gestión de colonias felinas y actividades relacionadas.</li>
			<li>Queda prohibido introducir datos falsos o malintencionados.</li>
			<li>Se deben respetar los datos personales de terceros.</li>
			<li>Se registran todas las acciones en un log de auditoría.</li>
		</ul>

		<h2 class="text-lg font-bold">4. Niveles de Servicio</h2>
		<ul>
			<li><strong>Disponibilidad objetivo:</strong> 99,5% mensual.</li>
			<li><strong>Copias de seguridad:</strong> diarias, retención mínima 30 días.</li>
			<li><strong>RPO:</strong> menos de 24 horas.</li>
			<li><strong>RTO:</strong> menos de 4 horas.</li>
		</ul>

		<h2 class="text-lg font-bold">5. Propiedad de los Datos</h2>
		<p>Los datos introducidos por la organización y sus usuarios son propiedad de la organización. El proveedor del Servicio actúa como encargado del tratamiento.</p>

		<h2 class="text-lg font-bold">6. Reversibilidad</h2>
		<p>Al finalizar el servicio, la organización recibirá una exportación completa de todos sus datos en formatos abiertos (CSV, JSON, GeoJSON). Tras la entrega confirmada, los datos se eliminarán de los servidores.</p>

		<h2 class="text-lg font-bold">7. Planes y Limitaciones</h2>
		<ul>
			<li><strong>Standard:</strong> hasta 50 usuarios, funcionalidades completas.</li>
			<li><strong>Professional:</strong> usuarios ilimitados, SMTP personalizado, soporte prioritario.</li>
			<li><strong>Enterprise:</strong> personalización completa, SLA dedicado, instalación on-premise disponible.</li>
		</ul>

		<h2 class="text-lg font-bold">8. Compatibilidad</h2>
		<p>El Servicio es compatible con las dos últimas versiones de Chrome, Firefox, Safari y Edge. Se garantiza el funcionamiento responsive en dispositivos móviles iOS y Android.</p>

		<h2 class="text-lg font-bold">9. Accesibilidad</h2>
		<p>El Servicio se diseña conforme a WCAG 2.1 nivel AA, incluyendo navegación por teclado, lectores de pantalla, contraste adecuado y skip navigation.</p>

		<h2 class="text-lg font-bold">10. Modificaciones</h2>
		<p>Estos términos pueden actualizarse. Los cambios se notificarán con un mínimo de 30 días de antelación.</p>
	</div>

	<div class="mt-8 text-center">
		<a href="/login" class="text-primary hover:underline text-sm font-semibold">← Volver al inicio de sesión</a>
	</div>
</div>
