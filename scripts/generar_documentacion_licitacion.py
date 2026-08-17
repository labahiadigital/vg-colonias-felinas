"""
Generador de documentacion PDF para la licitacion
Expediente: 2026/CO_ASUM/0013
Ayuntamiento de Vitoria-Gasteiz - Colonias Felinas Urbanas
"""
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether, ListFlowable, ListItem
)
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate
from reportlab.pdfgen import canvas as pdfcanvas

PRIMARY = HexColor('#005a4d')
PRIMARY_LIGHT = HexColor('#e0f2f1')
DARK = HexColor('#1f2937')
GRAY = HexColor('#6b7280')
WHITE = HexColor('#ffffff')
LIGHT_BG = HexColor('#f8faf9')

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'documentacion-licitacion')
os.makedirs(OUTPUT_DIR, exist_ok=True)

EXPEDIENTE = '2026/CO_ASUM/0013'
EMPRESA = '[COMPLETAR: Razon Social de la Empresa]'
NIF = '[COMPLETAR: NIF/CIF]'
REPRESENTANTE = '[COMPLETAR: Nombre del Representante Legal]'
DNI_REP = '[COMPLETAR: DNI del Representante]'
DOMICILIO = '[COMPLETAR: Domicilio Social]'
LOCALIDAD = '[COMPLETAR: Localidad]'
PROVINCIA = '[COMPLETAR: Provincia]'
CP = '[COMPLETAR: Codigo Postal]'
TELEFONO = '[COMPLETAR: Telefono]'
EMAIL = '[COMPLETAR: Email de contacto]'

styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    'DocTitle', parent=styles['Title'],
    fontSize=22, leading=28, textColor=PRIMARY,
    spaceAfter=6*mm, alignment=TA_CENTER, fontName='Helvetica-Bold'
))
styles.add(ParagraphStyle(
    'DocSubtitle', parent=styles['Normal'],
    fontSize=12, leading=16, textColor=GRAY,
    spaceAfter=10*mm, alignment=TA_CENTER, fontName='Helvetica'
))
styles.add(ParagraphStyle(
    'H1', parent=styles['Heading1'],
    fontSize=16, leading=22, textColor=PRIMARY,
    spaceBefore=12*mm, spaceAfter=4*mm, fontName='Helvetica-Bold'
))
styles.add(ParagraphStyle(
    'H2', parent=styles['Heading2'],
    fontSize=13, leading=18, textColor=DARK,
    spaceBefore=8*mm, spaceAfter=3*mm, fontName='Helvetica-Bold'
))
styles.add(ParagraphStyle(
    'H3', parent=styles['Heading3'],
    fontSize=11, leading=15, textColor=DARK,
    spaceBefore=5*mm, spaceAfter=2*mm, fontName='Helvetica-Bold'
))
styles.add(ParagraphStyle(
    'Body', parent=styles['Normal'],
    fontSize=10, leading=14.5, textColor=DARK,
    spaceAfter=3*mm, alignment=TA_JUSTIFY, fontName='Helvetica'
))
styles.add(ParagraphStyle(
    'BodyBold', parent=styles['Normal'],
    fontSize=10, leading=14.5, textColor=DARK,
    spaceAfter=3*mm, fontName='Helvetica-Bold'
))
styles.add(ParagraphStyle(
    'BulletItem', parent=styles['Normal'],
    fontSize=10, leading=14, textColor=DARK,
    leftIndent=15, spaceAfter=1.5*mm, fontName='Helvetica',
    bulletIndent=5
))
styles.add(ParagraphStyle(
    'Footer', parent=styles['Normal'],
    fontSize=7.5, leading=10, textColor=GRAY,
    alignment=TA_CENTER, fontName='Helvetica'
))
styles.add(ParagraphStyle(
    'SmallCenter', parent=styles['Normal'],
    fontSize=9, leading=12, textColor=GRAY,
    alignment=TA_CENTER, fontName='Helvetica'
))
styles.add(ParagraphStyle(
    'TableCell', parent=styles['Normal'],
    fontSize=9, leading=12, textColor=DARK, fontName='Helvetica'
))
styles.add(ParagraphStyle(
    'TableHeader', parent=styles['Normal'],
    fontSize=9, leading=12, textColor=WHITE, fontName='Helvetica-Bold'
))
styles.add(ParagraphStyle(
    'Completar', parent=styles['Normal'],
    fontSize=10, leading=14, textColor=HexColor('#dc2626'),
    fontName='Helvetica-BoldOblique', spaceAfter=2*mm
))


def header_footer(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(PRIMARY)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(2*cm, A4[1] - 1.8*cm, A4[0] - 2*cm, A4[1] - 1.8*cm)
    canvas_obj.setFont('Helvetica', 7)
    canvas_obj.setFillColor(GRAY)
    canvas_obj.drawString(2*cm, A4[1] - 1.6*cm, f'Expediente {EXPEDIENTE}')
    canvas_obj.drawRightString(A4[0] - 2*cm, A4[1] - 1.6*cm,
                                'Ayuntamiento de Vitoria-Gasteiz')
    canvas_obj.line(2*cm, 1.5*cm, A4[0] - 2*cm, 1.5*cm)
    canvas_obj.drawCentredString(A4[0]/2, 1*cm,
                                  f'Pagina {doc.page}')
    canvas_obj.restoreState()


def build_doc(filename, title_text, story_items):
    filepath = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        leftMargin=2.5*cm, rightMargin=2.5*cm,
        topMargin=2.5*cm, bottomMargin=2.5*cm
    )
    doc.build(story_items, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f'  [OK] {filename}')
    return filepath


def portada(titulo, subtitulo=''):
    story = []
    story.append(Spacer(1, 4*cm))
    story.append(Paragraph(titulo, styles['DocTitle']))
    if subtitulo:
        story.append(Paragraph(subtitulo, styles['DocSubtitle']))
    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width='60%', thickness=2, color=PRIMARY,
                              spaceAfter=8*mm, spaceBefore=2*mm, hAlign='CENTER'))

    info_data = [
        ['Expediente:', EXPEDIENTE],
        ['Organo:', 'Ayuntamiento de Vitoria-Gasteiz'],
        ['Departamento:', 'Deporte, Salud y Cooperacion al Desarrollo'],
        ['Objeto:', 'Suministro de aplicacion informatica para gestion de colonias felinas urbanas'],
    ]
    info_table = Table(info_data, colWidths=[4*cm, 10*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), PRIMARY),
        ('TEXTCOLOR', (1, 0), (1, -1), DARK),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph(f'Fecha: {datetime.now().strftime("%d de %B de %Y")}',
                            styles['SmallCenter']))
    story.append(PageBreak())
    return story


def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', styles['BulletItem'])


def completar(text):
    return Paragraph(text, styles['Completar'])


# ============================================================
# DOCUMENTO 1: MEMORIA TECNICA (Sobre 2) - Hasta 49 puntos
# ============================================================
def generar_memoria_tecnica():
    story = portada(
        'MEMORIA TECNICA',
        'Sobre 2 - Criterios sujetos a juicio de valor'
    )

    # INDICE
    story.append(Paragraph('INDICE', styles['H1']))
    toc = [
        '1. Analisis y comprension de las necesidades del Servicio (hasta 9 puntos)',
        '2. Grado de desarrollo y consolidacion de la solucion (hasta 13 puntos)',
        '3. Adecuacion a las particularidades de Vitoria-Gasteiz (hasta 11 puntos)',
        '4. Claridad, coherencia y calidad de la documentacion (hasta 5 puntos)',
        '5. Capacidad de adaptacion a las necesidades del Servicio (hasta 11 puntos)',
        'Anexo A: Arquitectura tecnica',
        'Anexo B: Capturas de la plataforma',
    ]
    for item in toc:
        story.append(Paragraph(item, styles['Body']))
    story.append(PageBreak())

    # === CAPITULO 1 ===
    story.append(Paragraph(
        '1. ANALISIS Y COMPRENSION DE LAS NECESIDADES DEL SERVICIO',
        styles['H1']))
    story.append(Paragraph('Puntuacion maxima: 9 puntos', styles['SmallCenter']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('1.1. Contexto normativo y operativo', styles['H2']))
    story.append(Paragraph(
        'La gestion de colonias felinas urbanas en el municipio de Vitoria-Gasteiz se enmarca '
        'en un contexto normativo complejo que incluye la Ley 7/2023, de 28 de marzo, de '
        'proteccion de los derechos y el bienestar de los animales, la normativa de sanidad '
        'animal de la Comunidad Autonoma del Pais Vasco (Ley 6/1993), el Reglamento General '
        'de Proteccion de Datos (RGPD 2016/679) y la Ley Organica 3/2018 (LOPDGDD). '
        'La plataforma que se presenta ha sido disenada desde su concepcion para dar respuesta '
        'integral a estas exigencias, automatizando los flujos de trabajo del Servicio de '
        'Salud Publica municipal.', styles['Body']))

    story.append(Paragraph('1.2. Comprension del metodo CER', styles['H2']))
    story.append(Paragraph(
        'El programa de Captura, Esterilizacion y Retorno (CER) constituye el eje vertebrador '
        'de la gestion de colonias felinas. La plataforma articula este flujo en tres fases '
        'perfectamente trazables:', styles['Body']))
    story.append(bullet(
        '<b>Captura:</b> Registro geolocalizado del animal con fotografias capturadas directamente '
        'desde el dispositivo movil del operador de campo. Asignacion automatica a la colonia '
        'mas cercana mediante algoritmo de proximidad geografica.'))
    story.append(bullet(
        '<b>Esterilizacion:</b> Ficha clinica veterinaria con registro de procedimiento, '
        'veterinario responsable, clinica, observaciones y generacion automatica de '
        'Certificado Oficial de Esterilizacion en formato PDF descargable.'))
    story.append(bullet(
        '<b>Retorno:</b> Confirmacion del retorno al punto de origen con actualizacion '
        'del estado del animal y notificacion automatica al tecnico municipal responsable.'))

    story.append(Paragraph('1.3. Control sanitario y censo individualizado', styles['H2']))
    story.append(Paragraph(
        'Cada animal registrado en el sistema dispone de una ficha individual completa que '
        'incluye: identificacion por microchip, historial de vacunaciones, desparasitaciones, '
        'revisiones veterinarias, estado reproductivo, fotografias de identificacion y '
        'cualquier intervencion quirurgica. El sistema genera automaticamente alertas de '
        'seguimiento sanitario y permite la emision de certificados oficiales (sanitario, '
        'de esterilizacion y de actuacion CER).', styles['Body']))

    story.append(Paragraph('1.4. Gestion de personas colaboradoras y voluntariado', styles['H2']))
    story.append(Paragraph(
        'La plataforma implementa un sistema completo de gestion de personas alimentadoras '
        'y colaboradoras que incluye: registro con validacion municipal previa, emision de '
        'credenciales digitales verificables mediante codigo QR con hash criptografico SHA-256, '
        'asignacion a colonias especificas, control de vigencia de autorizaciones y firma '
        'electronica del aviso de privacidad conforme al RGPD. Toda alta o modificacion '
        'introducida por personal voluntario queda en estado "Pendiente de validacion" hasta '
        'la aprobacion expresa del tecnico municipal, garantizando el control institucional '
        'sobre el censo oficial.', styles['Body']))

    story.append(Paragraph('1.5. Trazabilidad interna de incidencias', styles['H2']))
    story.append(Paragraph(
        'Conforme a la aclaracion oficial emitida el 06/08/2026 por el organo de contratacion, '
        'el modulo de incidencias opera como herramienta de gestion interna del Servicio, sin '
        'acceso publico directo. El sistema permite: registro con geolocalizacion automatica, '
        'categorizacion por tipo (sanitaria, convivencia, infraestructura, abandono), '
        'asignacion de responsable con notificacion automatica, seguimiento mediante historial '
        'de comentarios y actualizaciones de estado, y adjuncion de fotografias desde '
        'dispositivos moviles.', styles['Body']))

    story.append(PageBreak())

    # === CAPITULO 2 ===
    story.append(Paragraph(
        '2. GRADO DE DESARROLLO Y CONSOLIDACION DE LA SOLUCION',
        styles['H1']))
    story.append(Paragraph('Puntuacion maxima: 13 puntos', styles['SmallCenter']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        'La solucion que se presenta es una <b>plataforma SaaS plenamente operativa</b>, '
        'desarrollada con tecnologias de ultima generacion y desplegada en infraestructura '
        'de produccion ubicada en la Union Europea. No se trata de un prototipo, maqueta '
        'ni desarrollo en fase beta, sino de un sistema consolidado y en explotacion real.',
        styles['Body']))

    story.append(Paragraph('2.1. Stack tecnologico', styles['H2']))
    tech_data = [
        [Paragraph('<b>Componente</b>', styles['TableHeader']),
         Paragraph('<b>Tecnologia</b>', styles['TableHeader']),
         Paragraph('<b>Justificacion</b>', styles['TableHeader'])],
        [Paragraph('Frontend', styles['TableCell']),
         Paragraph('SvelteKit 5 + TypeScript', styles['TableCell']),
         Paragraph('Framework moderno con SSR, rendimiento optimo en moviles', styles['TableCell'])],
        [Paragraph('Estilos', styles['TableCell']),
         Paragraph('Tailwind CSS 4', styles['TableCell']),
         Paragraph('Diseno responsive mobile-first, accesibilidad WCAG 2.1 AA', styles['TableCell'])],
        [Paragraph('Base de datos', styles['TableCell']),
         Paragraph('PostgreSQL (Neon)', styles['TableCell']),
         Paragraph('Base de datos relacional en la UE, cifrado AES-256', styles['TableCell'])],
        [Paragraph('ORM', styles['TableCell']),
         Paragraph('Drizzle ORM', styles['TableCell']),
         Paragraph('Type-safe, migraciones versionadas', styles['TableCell'])],
        [Paragraph('Autenticacion', styles['TableCell']),
         Paragraph('Better Auth', styles['TableCell']),
         Paragraph('Sesiones JWT, rate limiting, bcrypt', styles['TableCell'])],
        [Paragraph('Cartografia', styles['TableCell']),
         Paragraph('Leaflet + Leaflet Draw', styles['TableCell']),
         Paragraph('Cartografia abierta (OpenStreetMap), edicion de poligonos', styles['TableCell'])],
        [Paragraph('Email', styles['TableCell']),
         Paragraph('SMTP configurable', styles['TableCell']),
         Paragraph('Notificaciones transaccionales por organizacion', styles['TableCell'])],
    ]
    tech_table = Table(tech_data, colWidths=[3*cm, 4*cm, 8*cm])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('2.2. Modulo GIS integrado', styles['H2']))
    story.append(Paragraph(
        'El sistema de informacion geografica integrado permite:', styles['Body']))
    story.append(bullet(
        'Visualizacion de colonias, puntos de alimentacion e incidencias sobre cartografia '
        'OpenStreetMap con capas activables/desactivables.'))
    story.append(bullet(
        '<b>Trazado de poligonos de zonas criticas</b> (centros escolares, parques, zonas de '
        'especial sensibilidad) mediante la herramienta Leaflet Draw integrada.'))
    story.append(bullet(
        'Representacion grafica del <b>radio de campeo</b> de cada colonia con visualizacion '
        'de circunferencias y zonas de influencia.'))
    story.append(bullet(
        'Filtrado por distrito, estado de colonia y tipo de incidencia.'))
    story.append(bullet(
        'Geolocalizacion automatica desde el dispositivo movil del operador de campo.'))
    story.append(bullet(
        'Exportacion de capas en formato GeoJSON para integracion con otros sistemas GIS municipales.'))

    story.append(Paragraph('2.3. Generacion automatica de certificados PDF', styles['H2']))
    story.append(Paragraph(
        'La plataforma genera automaticamente tres tipos de certificados oficiales en formato '
        'PDF/HTML imprimible, cada uno con numero unico de certificado, datos completos del '
        'animal, veterinario responsable y espacio para firma:', styles['Body']))
    story.append(bullet('<b>Certificado Sanitario:</b> Historial completo de vacunaciones, '
                         'desparasitaciones y revision general.'))
    story.append(bullet('<b>Certificado de Esterilizacion:</b> Acreditacion del procedimiento '
                         'con identificacion del veterinario colegiado.'))
    story.append(bullet('<b>Certificado de Actuacion CER:</b> Documento oficial de captura, '
                         'esterilizacion y retorno con trazabilidad completa.'))

    story.append(Paragraph('2.4. Ficha clinica e historial individual', styles['H2']))
    story.append(Paragraph(
        'Cada animal censado dispone de una ficha clinica digital completa que registra: '
        'datos de identificacion (nombre, sexo, edad estimada, microchip), fotografia de '
        'identificacion (captura directa desde camara movil), estado reproductivo, historial '
        'sanitario con todas las intervenciones veterinarias, acciones CER asociadas, '
        'registro de adopcion y documentos adjuntos. La ficha es accesible tanto desde la '
        'interfaz web como desde dispositivos moviles en campo.', styles['Body']))

    story.append(Paragraph('2.5. Modulo de inspecciones con plantillas configurables', styles['H2']))
    story.append(Paragraph(
        'El sistema incorpora un motor de inspecciones tecncias con <b>plantillas configurables '
        'mediante JSON Schema</b>. Esto permite al Servicio definir sus propios formularios de '
        'inspeccion (campos, tipos de datos, opciones de respuesta) sin necesidad de '
        'intervencion tecnica. Los resultados se almacenan de forma estructurada y son '
        'exportables a formatos abiertos (CSV, JSON).', styles['Body']))

    story.append(Paragraph('2.6. Arquitectura multi-tenant (SaaS)', styles['H2']))
    story.append(Paragraph(
        'La plataforma implementa una arquitectura multi-tenant completa con aislamiento '
        'de datos por organizacion. Cada entidad contratante opera en un entorno logicamente '
        'aislado con su propia configuracion, catalagos, plantillas, roles y preferencias '
        'de idioma. Esta arquitectura garantiza la escalabilidad del servicio y la '
        'independencia total de los datos entre distintas administraciones contratantes.',
        styles['Body']))

    story.append(PageBreak())

    # === CAPITULO 3 ===
    story.append(Paragraph(
        '3. ADECUACION A LAS PARTICULARIDADES DE VITORIA-GASTEIZ',
        styles['H1']))
    story.append(Paragraph('Puntuacion maxima: 11 puntos', styles['SmallCenter']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('3.1. Perfiles y permisos de acceso', styles['H2']))
    story.append(Paragraph(
        'La plataforma implementa de forma nativa un sistema de Control de Acceso Basado '
        'en Roles (RBAC) con cinco perfiles predefinidos, configurados segun el principio '
        'de minimo privilegio:', styles['Body']))

    roles_data = [
        [Paragraph('<b>Perfil</b>', styles['TableHeader']),
         Paragraph('<b>Descripcion</b>', styles['TableHeader']),
         Paragraph('<b>Permisos principales</b>', styles['TableHeader'])],
        [Paragraph('Administrador', styles['TableCell']),
         Paragraph('Responsable tecnico municipal', styles['TableCell']),
         Paragraph('Acceso total, gestion RBAC, configuracion del sistema, '
                    'exportacion de datos, auditoria', styles['TableCell'])],
        [Paragraph('Tecnico Municipal', styles['TableCell']),
         Paragraph('Personal tecnico del Servicio', styles['TableCell']),
         Paragraph('Validacion de censos, gestion de colonias, incidencias, '
                    'inspecciones, informes', styles['TableCell'])],
        [Paragraph('Veterinario', styles['TableCell']),
         Paragraph('Veterinario colegiado autorizado', styles['TableCell']),
         Paragraph('Fichas clinicas, registros sanitarios, certificados, '
                    'programa CER', styles['TableCell'])],
        [Paragraph('Entidad Gestora', styles['TableCell']),
         Paragraph('Asociacion protectora autorizada', styles['TableCell']),
         Paragraph('Gestion de colonias asignadas, colaboradores, adopciones, '
                    'incidencias', styles['TableCell'])],
        [Paragraph('Colaborador/a', styles['TableCell']),
         Paragraph('Voluntario/a alimentador/a', styles['TableCell']),
         Paragraph('Consulta de colonias asignadas, registro de observaciones '
                    '(pendientes de validacion)', styles['TableCell'])],
    ]
    roles_table = Table(roles_data, colWidths=[3*cm, 4*cm, 8*cm])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(roles_table)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        'El sistema de permisos es granular (11 modulos x 10 acciones = 110 permisos base) '
        'y totalmente configurable desde el panel de administracion, permitiendo al Servicio '
        'crear roles adicionales o ajustar permisos sin intervencion tecnica.',
        styles['Body']))

    story.append(Paragraph('3.2. Validacion municipal centralizada', styles['H2']))
    story.append(Paragraph(
        'Todo dato introducido por personal voluntario (colaboradores, alimentadores) '
        'entra en el sistema en estado <b>"Pendiente de validacion"</b> hasta que un '
        'tecnico municipal o administrador lo aprueba expresamente. Este flujo de '
        'aprobacion garantiza la integridad y fiabilidad del censo oficial, impidiendo '
        'que informacion no verificada se incorpore automaticamente a la base de datos '
        'municipal.', styles['Body']))

    story.append(Paragraph('3.3. Cooficialidad linguistica nativa', styles['H2']))
    story.append(Paragraph(
        'La interfaz de usuario, comunicaciones automaticas, plantillas de certificados, '
        'notificaciones por email, catalogos configurables y toda la documentacion del '
        'sistema se encuentran disponibles al <b>100% en Castellano y en Euskera</b> con '
        'paridad funcional completa. El selector de idioma permite al usuario cambiar '
        'dinamicamente entre ambos idiomas en cualquier momento. Los catalogos de datos '
        '(estados, categorias, clasificaciones) son bilingues de forma nativa.',
        styles['Body']))

    story.append(Paragraph('3.4. Aplicacion movil multiplataforma', styles['H2']))
    story.append(Paragraph(
        'La plataforma ha sido desarrollada con diseno <b>responsive mobile-first</b>, '
        'garantizando la operatividad completa en cualquier dispositivo:', styles['Body']))
    story.append(bullet(
        'Diseno adaptativo optimizado para telefono, tableta y escritorio.'))
    story.append(bullet(
        '<b>Geolocalizacion GPS automatica</b> desde el navegador del dispositivo movil para '
        'registro de colonias, incidencias y actuaciones CER en campo.'))
    story.append(bullet(
        '<b>Captura fotografica directa desde la camara</b> del dispositivo (atributo HTML5 '
        'capture="environment") para registro visual de animales e incidencias.'))
    story.append(bullet(
        'Instalable como aplicacion web progresiva (PWA) en iOS y Android, proporcionando '
        'una experiencia de uso equivalente a una aplicacion nativa.'))
    story.append(bullet(
        'Funcionalidad sin conexion para consulta de datos cacheados previamente (offline-first '
        'con sincronizacion al recuperar conectividad).'))

    story.append(Paragraph('3.5. Credenciales digitales verificables', styles['H2']))
    story.append(Paragraph(
        'Las personas colaboradoras autorizadas reciben una <b>credencial digital</b> que incluye: '
        'datos del colaborador, colonias asignadas, vigencia de la autorizacion, estado LOPD '
        'y un <b>codigo QR con hash criptografico SHA-256</b> que permite la verificacion '
        'publica de la autenticidad de la credencial a traves de un endpoint publico '
        'accesible sin autenticacion.', styles['Body']))

    story.append(PageBreak())

    # === CAPITULO 4 ===
    story.append(Paragraph(
        '4. CLARIDAD, COHERENCIA Y CALIDAD DE LA DOCUMENTACION',
        styles['H1']))
    story.append(Paragraph('Puntuacion maxima: 5 puntos', styles['SmallCenter']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('4.1. Matriz de trazabilidad con el pliego tecnico', styles['H2']))
    story.append(Paragraph(
        'A continuacion se presenta la correspondencia directa entre los requerimientos '
        'del Pliego de Prescripciones Tecnicas y los modulos de la plataforma:',
        styles['Body']))

    traz_data = [
        [Paragraph('<b>Requisito PPT</b>', styles['TableHeader']),
         Paragraph('<b>Clausula</b>', styles['TableHeader']),
         Paragraph('<b>Modulo/Funcionalidad</b>', styles['TableHeader']),
         Paragraph('<b>Estado</b>', styles['TableHeader'])],
        [Paragraph('App web y movil', styles['TableCell']),
         Paragraph('3.1', styles['TableCell']),
         Paragraph('SvelteKit responsive + PWA', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('Censo geolocalizado', styles['TableCell']),
         Paragraph('3.2.1', styles['TableCell']),
         Paragraph('Modulo Colonias + Leaflet GIS', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('Fichas clinicas y certificados', styles['TableCell']),
         Paragraph('3.2.2', styles['TableCell']),
         Paragraph('Salud + Certificados PDF', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('Programa CER', styles['TableCell']),
         Paragraph('3.2.3', styles['TableCell']),
         Paragraph('Modulo CER', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('Poligonos zonas criticas', styles['TableCell']),
         Paragraph('3.2.1', styles['TableCell']),
         Paragraph('Leaflet Draw + capas editables', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('GPS y fotos desde movil', styles['TableCell']),
         Paragraph('3.1', styles['TableCell']),
         Paragraph('Geolocation API + capture', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('150+ cuentas usuario', styles['TableCell']),
         Paragraph('3.2.7', styles['TableCell']),
         Paragraph('Cuentas ilimitadas (SaaS)', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('Euskera + Castellano', styles['TableCell']),
         Paragraph('3.7', styles['TableCell']),
         Paragraph('i18n nativo (es/eu)', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('Servidores en la UE', styles['TableCell']),
         Paragraph('4.3', styles['TableCell']),
         Paragraph('Hetzner (Alemania)', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('Exportacion formatos abiertos', styles['TableCell']),
         Paragraph('3.2', styles['TableCell']),
         Paragraph('CSV, JSON, GeoJSON, PDF', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('Migracion datos historicos', styles['TableCell']),
         Paragraph('3.2.11', styles['TableCell']),
         Paragraph('Importacion CSV + API ETL', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
        [Paragraph('RGPD / LOPDGDD', styles['TableCell']),
         Paragraph('4.1-4.2', styles['TableCell']),
         Paragraph('Cifrado, RBAC, auditoria, retencion', styles['TableCell']),
         Paragraph('Operativo', styles['TableCell'])],
    ]
    traz_table = Table(traz_data, colWidths=[4*cm, 2*cm, 5.5*cm, 2*cm])
    traz_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(traz_table)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('4.2. Documentacion tecnica disponible', styles['H2']))
    story.append(Paragraph(
        'El sistema cuenta con documentacion tecnica completa y actualizada:', styles['Body']))
    story.append(bullet('Plan de migracion de datos (protocolo ETL).'))
    story.append(bullet('Plan de reversibilidad y entrega de datos al finalizar el servicio.'))
    story.append(bullet('Estrategia de pruebas (criterios Given/When/Then).'))
    story.append(bullet('Plan de copias de seguridad y restauracion (RPO < 24h, RTO < 4h).'))
    story.append(bullet('Modelo de seguridad (OWASP Top 10, cabeceras HTTP, rate limiting).'))
    story.append(bullet('Modelo de proteccion de datos (RGPD/LOPDGDD completo).'))

    story.append(PageBreak())

    # === CAPITULO 5 ===
    story.append(Paragraph(
        '5. CAPACIDAD DE ADAPTACION A LAS NECESIDADES DEL SERVICIO',
        styles['H1']))
    story.append(Paragraph('Puntuacion maxima: 11 puntos', styles['SmallCenter']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('5.1. Compromiso de adaptacion sin coste adicional', styles['H2']))
    story.append(Paragraph(
        'El adjudicatario asume el <b>compromiso explicito e irrevocable</b> de ejecutar las '
        'siguientes adaptaciones, parametrizaciones y ajustes especificos que el Servicio de '
        'Salud Publica del Ayuntamiento de Vitoria-Gasteiz requiera a lo largo de la vigencia '
        'del contrato, <b>sin repercusion de coste adicional</b> para la entidad local:',
        styles['Body']))

    story.append(bullet(
        '<b>Parametrizacion de catalogos:</b> Creacion, modificacion y desactivacion de '
        'catalogos de datos (estados de colonia, categorias de incidencia, clasificaciones, '
        'tipos de accion sanitaria) tanto en castellano como en euskera.'))
    story.append(bullet(
        '<b>Personalizacion de plantillas:</b> Modificacion de las plantillas de certificados '
        'oficiales (sanitario, esterilizacion, CER), credenciales de colaboradores e informes, '
        'adaptandolas a la imagen corporativa y requisitos formales del Ayuntamiento.'))
    story.append(bullet(
        '<b>Configuracion de plantillas de inspeccion:</b> Creacion de nuevos formularios de '
        'inspeccion mediante editor de JSON Schema, permitiendo al Servicio definir campos, '
        'opciones de respuesta y validaciones sin intervencion tecnica.'))
    story.append(bullet(
        '<b>Ajustes en roles y permisos:</b> Creacion de nuevos perfiles de usuario, '
        'modificacion de la matriz de permisos y adaptacion del flujo de aprobacion.'))
    story.append(bullet(
        '<b>Nuevos campos y formularios:</b> Adicion de campos personalizados en fichas '
        'de animales, colonias o incidencias segun las necesidades operativas del Servicio.'))
    story.append(bullet(
        '<b>Integraciones:</b> Desarrollo de conectores con otros sistemas municipales '
        '(gestion documental, registro electronico) si el Servicio lo requiere.'))
    story.append(bullet(
        '<b>Informes y exportaciones a medida:</b> Creacion de nuevos modelos de informe '
        'o modificacion de los existentes para satisfacer requisitos de reporte.'))

    story.append(Paragraph('5.2. Mantenimiento integral incluido', styles['H2']))
    story.append(Paragraph(
        'El servicio de mantenimiento integral incluye:', styles['Body']))
    story.append(bullet(
        '<b>Correctivo:</b> Resolucion de cualquier error o incidencia detectada en la '
        'plataforma.'))
    story.append(bullet(
        '<b>Adaptativo:</b> Actualizaciones derivadas de cambios normativos (Ley 7/2023, '
        'modificaciones RGPD, normativa autonomica) sin coste adicional.'))
    story.append(bullet(
        '<b>Evolutivo:</b> Mejoras funcionales y de rendimiento de la plataforma.'))

    story.append(Paragraph('5.3. Soporte tecnico', styles['H2']))
    story.append(Paragraph(
        'Se ofrece soporte tecnico multicanal:', styles['Body']))
    story.append(bullet('Email: Respuesta en menos de 24 horas en dias laborables.'))
    story.append(bullet('Telefono: Atencion en horario laboral (L-V 8:00-18:00).'))
    story.append(bullet('Chat integrado: Sistema de mensajeria interno de la plataforma.'))
    story.append(bullet('Manuales: Documentacion de usuario accesible desde la aplicacion.'))
    story.append(bullet('Formacion: Sesion de formacion inicial para el equipo del Servicio.'))

    story.append(Paragraph('5.4. Migracion de datos del sistema actual', styles['H2']))
    story.append(Paragraph(
        'La plataforma dispone de un <b>motor de importacion de datos</b> que soporta '
        'archivos CSV con deteccion automatica de separadores y mapeo inteligente de campos '
        '(acepta cabeceras tanto en castellano como en ingles). El proceso de migracion '
        'propuesto incluye:', styles['Body']))
    story.append(bullet('Analisis del formato y volumetria del sistema origen.'))
    story.append(bullet('Mapeo de campos y transformacion de datos (ETL).'))
    story.append(bullet('Carga inicial en entorno de pruebas con validacion conjunta.'))
    story.append(bullet('Carga definitiva en produccion con verificacion de integridad.'))
    story.append(bullet('Periodo de coexistencia para validacion cruzada.'))

    story.append(PageBreak())

    # ANEXO A
    story.append(Paragraph('ANEXO A: ARQUITECTURA TECNICA', styles['H1']))
    story.append(Paragraph(
        'Diagrama simplificado de la arquitectura del sistema:', styles['Body']))
    story.append(Spacer(1, 4*mm))

    arch_data = [
        [Paragraph('<b>Capa</b>', styles['TableHeader']),
         Paragraph('<b>Componente</b>', styles['TableHeader']),
         Paragraph('<b>Descripcion</b>', styles['TableHeader'])],
        [Paragraph('Cliente', styles['TableCell']),
         Paragraph('SvelteKit SSR + PWA', styles['TableCell']),
         Paragraph('Navegador web / App movil instalable', styles['TableCell'])],
        [Paragraph('Presentacion', styles['TableCell']),
         Paragraph('Tailwind CSS 4', styles['TableCell']),
         Paragraph('Mobile-first, WCAG 2.1 AA, temas configurables', styles['TableCell'])],
        [Paragraph('Logica', styles['TableCell']),
         Paragraph('TypeScript + Zod', styles['TableCell']),
         Paragraph('Validacion estricta, type-safe end-to-end', styles['TableCell'])],
        [Paragraph('Autenticacion', styles['TableCell']),
         Paragraph('Better Auth', styles['TableCell']),
         Paragraph('JWT, bcrypt, rate limiting (10/min), RBAC', styles['TableCell'])],
        [Paragraph('Cartografia', styles['TableCell']),
         Paragraph('Leaflet + Leaflet Draw', styles['TableCell']),
         Paragraph('OpenStreetMap, poligonos editables, GeoJSON', styles['TableCell'])],
        [Paragraph('Datos', styles['TableCell']),
         Paragraph('Drizzle ORM + PostgreSQL', styles['TableCell']),
         Paragraph('Neon (UE), cifrado AES-256, backups automaticos', styles['TableCell'])],
        [Paragraph('Notificaciones', styles['TableCell']),
         Paragraph('SMTP configurable', styles['TableCell']),
         Paragraph('Interno + email, plantillas personalizables', styles['TableCell'])],
        [Paragraph('Infraestructura', styles['TableCell']),
         Paragraph('Hetzner Cloud (UE)', styles['TableCell']),
         Paragraph('Alemania/Finlandia, TLS 1.3, SLA 99.5%', styles['TableCell'])],
    ]
    arch_table = Table(arch_data, colWidths=[3*cm, 4.5*cm, 7.5*cm])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(arch_table)

    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('ANEXO B: CAPTURAS DE LA PLATAFORMA', styles['H1']))
    story.append(Paragraph(
        '<i>Nota: En la version definitiva de esta Memoria se incluiran capturas de '
        'pantalla reales de la plataforma en produccion, mostrando los modulos de '
        'dashboard, cartografia GIS con poligonos, ficha individual de animal, '
        'generador de certificados PDF, credencial digital con QR y panel de '
        'administracion RBAC.</i>', styles['Body']))
    story.append(completar(
        '[COMPLETAR: Insertar capturas de pantalla reales de la plataforma antes de '
        'la firma y presentacion]'))

    build_doc('Memoria_Tecnica_Sobre2_2026_CO_ASUM_0013.pdf',
              'Memoria Tecnica', story)


# ============================================================
# DOCUMENTO 2: ANEXO X - PROPOSICION ECONOMICA (Sobre 3)
# ============================================================
def generar_anexo_x():
    story = portada(
        'ANEXO X',
        'Proposicion Economica y Mejoras - Sobre 3'
    )

    story.append(Paragraph('MODELO DE PROPOSICION ECONOMICA', styles['H1']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        f'D./Da. {REPRESENTANTE}, con DNI {DNI_REP}, en representacion de '
        f'la empresa {EMPRESA}, con NIF {NIF}, domiciliada en {DOMICILIO}, '
        f'{CP} {LOCALIDAD} ({PROVINCIA}), enterado/a del anuncio publicado en la '
        f'Plataforma de Contratacion de Euskadi y de las condiciones y requisitos '
        f'que se exigen para la adjudicacion del contrato de suministro de una '
        f'aplicacion informatica para la gestion de las colonias felinas urbanas '
        f'del Ayuntamiento de Vitoria-Gasteiz (Expediente {EXPEDIENTE}), '
        f'hace constar:', styles['Body']))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        'PRIMERO. Que conoce y acepta integramente el contenido de los Pliegos de '
        'Clausulas Administrativas Particulares y de Prescripciones Tecnicas que '
        'rigen la presente licitacion.', styles['Body']))

    story.append(Paragraph(
        'SEGUNDO. Que la empresa a la que representa no se encuentra incursa en '
        'ninguna de las prohibiciones para contratar establecidas en el articulo 71 '
        'de la Ley 9/2017, de 8 de noviembre, de Contratos del Sector Publico.',
        styles['Body']))

    story.append(Paragraph(
        'TERCERO. Que se compromete a la ejecucion del contrato de conformidad '
        'con los pliegos citados, por el siguiente importe:', styles['Body']))

    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('A) OFERTA ECONOMICA', styles['H2']))

    price_data = [
        [Paragraph('<b>Concepto</b>', styles['TableHeader']),
         Paragraph('<b>Base Licitacion</b>', styles['TableHeader']),
         Paragraph('<b>Importe Ofertado</b>', styles['TableHeader'])],
        [Paragraph('Concesion de licencia (Ano 1)', styles['TableCell']),
         Paragraph('3.750,00 EUR', styles['TableCell']),
         Paragraph('3.431,25 EUR', styles['TableCell'])],
        [Paragraph('Soporte y mantenimiento (Ano 1)', styles['TableCell']),
         Paragraph('3.588,00 EUR', styles['TableCell']),
         Paragraph('3.283,02 EUR', styles['TableCell'])],
        [Paragraph('Soporte y mantenimiento (Ano 2)', styles['TableCell']),
         Paragraph('3.588,00 EUR', styles['TableCell']),
         Paragraph('3.285,73 EUR', styles['TableCell'])],
        [Paragraph('<b>TOTAL BASE IMPONIBLE (2 anos)</b>', styles['TableCell']),
         Paragraph('<b>10.926,00 EUR</b>', styles['TableCell']),
         Paragraph('<b>10.000,00 EUR</b>', styles['TableCell'])],
        [Paragraph('IVA (21%)', styles['TableCell']),
         Paragraph('2.294,46 EUR', styles['TableCell']),
         Paragraph('2.100,00 EUR', styles['TableCell'])],
        [Paragraph('<b>TOTAL CON IVA (2 anos)</b>', styles['TableCell']),
         Paragraph('<b>13.220,46 EUR</b>', styles['TableCell']),
         Paragraph('<b>12.100,00 EUR</b>', styles['TableCell'])],
    ]
    price_table = Table(price_data, colWidths=[6*cm, 4.5*cm, 4.5*cm])
    price_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('BACKGROUND', (0, 4), (-1, 4), PRIMARY_LIGHT),
        ('BACKGROUND', (0, 6), (-1, 6), PRIMARY_LIGHT),
        ('ROWBACKGROUNDS', (0, 1), (-1, 3), [WHITE, LIGHT_BG]),
    ]))
    story.append(price_table)
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        '<b>Porcentaje de baja sobre el presupuesto base: 8,48%</b>',
        styles['Body']))

    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('B) MEJORAS: NUMERO DE CUENTAS DE USUARIO', styles['H2']))

    cuentas_data = [
        [Paragraph('<b>Tramo</b>', styles['TableHeader']),
         Paragraph('<b>N. Cuentas</b>', styles['TableHeader']),
         Paragraph('<b>Puntos</b>', styles['TableHeader']),
         Paragraph('<b>Seleccion</b>', styles['TableHeader'])],
        [Paragraph('Tramo 1', styles['TableCell']),
         Paragraph('150 cuentas', styles['TableCell']),
         Paragraph('0 puntos', styles['TableCell']),
         Paragraph('', styles['TableCell'])],
        [Paragraph('Tramo 2', styles['TableCell']),
         Paragraph('150 - 300 cuentas', styles['TableCell']),
         Paragraph('3 puntos', styles['TableCell']),
         Paragraph('', styles['TableCell'])],
        [Paragraph('Tramo 3', styles['TableCell']),
         Paragraph('300 - 599 cuentas', styles['TableCell']),
         Paragraph('7 puntos', styles['TableCell']),
         Paragraph('', styles['TableCell'])],
        [Paragraph('<b>Tramo 4</b>', styles['TableCell']),
         Paragraph('<b>600 o mas / Ilimitadas</b>', styles['TableCell']),
         Paragraph('<b>10 puntos</b>', styles['TableCell']),
         Paragraph('<b>X</b>', styles['TableCell'])],
    ]
    cuentas_table = Table(cuentas_data, colWidths=[3*cm, 5*cm, 3*cm, 3*cm])
    cuentas_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (2, 0), (3, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('BACKGROUND', (0, 4), (-1, 4), PRIMARY_LIGHT),
        ('ROWBACKGROUNDS', (0, 1), (-1, 3), [WHITE, LIGHT_BG]),
    ]))
    story.append(cuentas_table)

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'Se ofertan <b>cuentas de usuario ilimitadas</b> sin coste adicional para el '
        'Ayuntamiento, al tratarse de una plataforma SaaS donde el coste marginal por '
        'usuario adicional es nulo.', styles['Body']))

    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        f'En {LOCALIDAD}, a ______ de _________________ de 2026', styles['Body']))
    story.append(Spacer(1, 15*mm))
    story.append(Paragraph('Firma del representante legal:', styles['Body']))
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph(
        f'Fdo.: {REPRESENTANTE}', styles['Body']))
    story.append(Paragraph(
        f'En calidad de representante de {EMPRESA}', styles['Body']))

    build_doc('Anexo_X_Proposicion_Economica_2026_CO_ASUM_0013.pdf',
              'Anexo X - Proposicion Economica', story)


# ============================================================
# DOCUMENTO 3: ANEXO IV - CONDICIONES ESPECIALES
# ============================================================
def generar_anexo_iv():
    story = portada(
        'ANEXO IV',
        'Declaracion Responsable de Cumplimiento de Condiciones Especiales de Ejecucion'
    )

    story.append(Paragraph('DECLARACION RESPONSABLE', styles['H1']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        f'D./Da. {REPRESENTANTE}, con DNI {DNI_REP}, actuando en nombre y representacion '
        f'de {EMPRESA}, con NIF {NIF}, como licitador en el procedimiento de contratacion '
        f'para el suministro de una aplicacion informatica para la gestion de las colonias '
        f'felinas urbanas del Ayuntamiento de Vitoria-Gasteiz (Expediente {EXPEDIENTE}),',
        styles['Body']))
    story.append(Paragraph('<b>DECLARA RESPONSABLEMENTE:</b>', styles['BodyBold']))
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        '<b>PRIMERO. Condiciones linguisticas.</b> Que la aplicacion informatica ofertada '
        'dispone de interfaz de usuario, comunicaciones automaticas, plantillas de certificados '
        'y documentacion completa tanto en <b>castellano como en euskera</b>, con paridad '
        'funcional total entre ambos idiomas, en cumplimiento de la clausula 3.7 del PPT '
        'y la clausula 13.1.5 del PCAP.', styles['Body']))

    story.append(Paragraph(
        '<b>SEGUNDO. Condiciones medioambientales.</b> Que se compromete a prestar el servicio '
        'minimizando el impacto ambiental, fomentando el uso de documentacion electronica, '
        'reduciendo el consumo de papel mediante la generacion de certificados e informes '
        'en formato digital (PDF) y utilizando infraestructura cloud eficiente energeticamente.',
        styles['Body']))

    story.append(Paragraph(
        '<b>TERCERO. Ubicacion de servidores.</b> Que los servidores de almacenamiento y '
        'tratamiento de datos de la plataforma se encuentran ubicados en centros de datos '
        'de <b>Hetzner Online GmbH</b>, situados en <b>Alemania (Union Europea)</b>, '
        'en cumplimiento de la clausula 4.3 del Pliego de Prescripciones Tecnicas. '
        'Se aportara certificacion o declaracion especifica de ubicacion de servidores '
        'previo a la formalizacion del contrato.', styles['Body']))

    story.append(Paragraph(
        '<b>CUARTO. Proteccion de datos.</b> Que se compromete a formalizar el correspondiente '
        'acuerdo de encargado del tratamiento conforme al articulo 28 del Reglamento General '
        'de Proteccion de Datos (UE) 2016/679 y la Ley Organica 3/2018 (LOPDGDD), '
        'garantizando la confidencialidad, integridad y disponibilidad de los datos '
        'personales tratados.', styles['Body']))

    story.append(Paragraph(
        '<b>QUINTO. Accesibilidad.</b> Que la plataforma ha sido desarrollada conforme '
        'al estandar WCAG 2.1 nivel AA de accesibilidad web, incluyendo navegacion por '
        'teclado, compatibilidad con lectores de pantalla, contraste adecuado y skip '
        'navigation.', styles['Body']))

    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        'Y para que asi conste y surta los efectos oportunos, firma la presente declaracion '
        'responsable.', styles['Body']))
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph(
        f'En {LOCALIDAD}, a ______ de _________________ de 2026', styles['Body']))
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph(f'Fdo.: {REPRESENTANTE}', styles['Body']))

    build_doc('Anexo_IV_Condiciones_Especiales_2026_CO_ASUM_0013.pdf',
              'Anexo IV - Condiciones Especiales', story)


# ============================================================
# DOCUMENTO 4: ANEXO V - GRUPO EMPRESARIAL
# ============================================================
def generar_anexo_v():
    story = portada(
        'ANEXO V',
        'Declaracion de Pertenencia a Grupo Empresarial'
    )

    story.append(Paragraph('DECLARACION RESPONSABLE', styles['H1']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        f'D./Da. {REPRESENTANTE}, con DNI {DNI_REP}, en representacion de '
        f'{EMPRESA}, con NIF {NIF}, en relacion con el procedimiento de contratacion '
        f'del Expediente {EXPEDIENTE},', styles['Body']))

    story.append(Paragraph('<b>DECLARA:</b>', styles['BodyBold']))
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        'Que la empresa a la que represento <b>NO pertenece a ningun grupo de empresas</b> '
        'en los terminos del articulo 42.1 del Codigo de Comercio, ni presenta ofertas '
        'en este procedimiento vinculadas con las de otras empresas del mismo grupo '
        'que pudieran falsear la libre competencia.', styles['Body']))

    story.append(Spacer(1, 3*mm))
    story.append(completar(
        '[NOTA: Si la empresa SI pertenece a un grupo, eliminar el parrafo anterior '
        'y declarar la composicion del grupo conforme al art. 42 del C. Comercio]'))

    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        f'En {LOCALIDAD}, a ______ de _________________ de 2026', styles['Body']))
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph(f'Fdo.: {REPRESENTANTE}', styles['Body']))

    build_doc('Anexo_V_Grupo_Empresarial_2026_CO_ASUM_0013.pdf',
              'Anexo V - Grupo Empresarial', story)


# ============================================================
# DOCUMENTO 5: ANEXO III - CONFIDENCIALIDAD (Sobre 2)
# ============================================================
def generar_anexo_iii_sobre2():
    story = portada(
        'ANEXO III',
        'Declaracion de Confidencialidad - Sobre 2 (Propuesta Tecnica)'
    )

    story.append(Paragraph('DECLARACION DE CONFIDENCIALIDAD', styles['H1']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        f'D./Da. {REPRESENTANTE}, con DNI {DNI_REP}, en representacion de '
        f'{EMPRESA}, con NIF {NIF}, en relacion con la propuesta tecnica presentada '
        f'al Expediente {EXPEDIENTE},', styles['Body']))

    story.append(Paragraph('<b>DECLARA:</b>', styles['BodyBold']))
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        'Que, conforme a lo establecido en el articulo 133 de la Ley 9/2017 de Contratos '
        'del Sector Publico, se consideran confidenciales y no susceptibles de divulgacion '
        'los siguientes aspectos de la propuesta tecnica contenida en el Sobre 2:',
        styles['Body']))

    story.append(bullet('Diagramas de arquitectura interna del sistema.'))
    story.append(bullet('Esquemas de la API y estructura de base de datos.'))
    story.append(bullet('Algoritmos propietarios de gestion de datos y cartografia.'))
    story.append(bullet('Codigo fuente y componentes tecnologicos especificos.'))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        'La presente declaracion se formula a los efectos de que la Mesa de Contratacion '
        'y el organo de contratacion adopten las medidas pertinentes para preservar la '
        'confidencialidad de la informacion senalada.', styles['Body']))

    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        f'En {LOCALIDAD}, a ______ de _________________ de 2026', styles['Body']))
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph(f'Fdo.: {REPRESENTANTE}', styles['Body']))

    build_doc('Anexo_III_Confidencialidad_Sobre2_2026_CO_ASUM_0013.pdf',
              'Anexo III - Confidencialidad Sobre 2', story)


# ============================================================
# DOCUMENTO 6: ANEXO III - CONFIDENCIALIDAD (Sobre 3)
# ============================================================
def generar_anexo_iii_sobre3():
    story = portada(
        'ANEXO III',
        'Declaracion de Confidencialidad - Sobre 3 (Oferta Economica)'
    )

    story.append(Paragraph('DECLARACION DE CONFIDENCIALIDAD', styles['H1']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        f'D./Da. {REPRESENTANTE}, con DNI {DNI_REP}, en representacion de '
        f'{EMPRESA}, con NIF {NIF}, en relacion con la oferta economica presentada '
        f'al Expediente {EXPEDIENTE},', styles['Body']))

    story.append(Paragraph('<b>DECLARA:</b>', styles['BodyBold']))
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        'Que, conforme a lo establecido en el articulo 133 de la Ley 9/2017 de Contratos '
        'del Sector Publico, <b>no se solicita la declaracion de confidencialidad</b> '
        'respecto de los importes y condiciones economicas contenidos en la proposicion '
        'economica (Sobre 3), al tratarse de informacion de caracter publico una vez '
        'producida la apertura del sobre en acto publico.', styles['Body']))

    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        f'En {LOCALIDAD}, a ______ de _________________ de 2026', styles['Body']))
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph(f'Fdo.: {REPRESENTANTE}', styles['Body']))

    build_doc('Anexo_III_Confidencialidad_Sobre3_2026_CO_ASUM_0013.pdf',
              'Anexo III - Confidencialidad Sobre 3', story)


# ============================================================
# DOCUMENTO 7: ANEXOS VII y VIII - DISCAPACIDAD E IGUALDAD
# ============================================================
def generar_anexos_vii_viii():
    story = portada(
        'ANEXOS VII y VIII',
        'Declaracion de Trabajadores con Discapacidad e Igualdad de Genero'
    )

    story.append(Paragraph('ANEXO VII: DECLARACION SOBRE TRABAJADORES CON DISCAPACIDAD',
                            styles['H1']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        f'D./Da. {REPRESENTANTE}, con DNI {DNI_REP}, en representacion de '
        f'{EMPRESA}, con NIF {NIF},', styles['Body']))

    story.append(Paragraph('<b>DECLARA:</b>', styles['BodyBold']))
    story.append(Spacer(1, 3*mm))

    story.append(completar(
        '[COMPLETAR: Seleccionar una de las siguientes opciones]'))
    story.append(bullet(
        'Que la empresa cuenta con un numero de trabajadores con discapacidad '
        'igual o superior al 2% de la plantilla, conforme a lo establecido en '
        'el articulo 147.1 de la LCSP.'))
    story.append(Paragraph('<b>O bien:</b>', styles['Body']))
    story.append(bullet(
        'Que la empresa tiene menos de 50 trabajadores en plantilla y, por tanto, '
        'no le resulta de aplicacion la obligacion de reserva prevista en el '
        'articulo 42 del Real Decreto Legislativo 1/2013.'))

    story.append(PageBreak())

    story.append(Paragraph('ANEXO VIII: DECLARACION SOBRE IGUALDAD DE GENERO',
                            styles['H1']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        f'D./Da. {REPRESENTANTE}, con DNI {DNI_REP}, en representacion de '
        f'{EMPRESA}, con NIF {NIF},', styles['Body']))

    story.append(Paragraph('<b>DECLARA:</b>', styles['BodyBold']))
    story.append(Spacer(1, 3*mm))

    story.append(completar(
        '[COMPLETAR: Seleccionar una de las siguientes opciones]'))
    story.append(bullet(
        'Que la empresa dispone de un Plan de Igualdad registrado, conforme a lo '
        'establecido en la Ley Organica 3/2007 de Igualdad Efectiva de Mujeres y '
        'Hombres y el RD 901/2020.'))
    story.append(Paragraph('<b>O bien:</b>', styles['Body']))
    story.append(bullet(
        'Que la empresa tiene menos de 50 trabajadores en plantilla y, por tanto, '
        'no le resulta exigible la elaboracion e implantacion de un Plan de Igualdad.'))

    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        f'En {LOCALIDAD}, a ______ de _________________ de 2026', styles['Body']))
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph(f'Fdo.: {REPRESENTANTE}', styles['Body']))

    build_doc('Anexos_VII_VIII_Discapacidad_Igualdad_2026_CO_ASUM_0013.pdf',
              'Anexos VII y VIII', story)


# ============================================================
# DOCUMENTO 8: CHECKLIST / GUIA DE PRESENTACION
# ============================================================
def generar_checklist():
    story = portada(
        'GUIA DE PRESENTACION',
        'Checklist de documentacion y carga en la plataforma'
    )

    story.append(Paragraph('CHECKLIST DE DOCUMENTACION', styles['H1']))
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph(
        'Utilice esta guia para verificar que toda la documentacion esta completa '
        'y correctamente firmada antes de la carga en la Plataforma de Contratacion '
        'de Euskadi (contratacion.euskadi.eus).', styles['Body']))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph('SOBRE 1: CAPACIDAD Y SOLVENCIA', styles['H2']))
    cl_data = [
        [Paragraph('<b>Campo web</b>', styles['TableHeader']),
         Paragraph('<b>Documento</b>', styles['TableHeader']),
         Paragraph('<b>Firma</b>', styles['TableHeader']),
         Paragraph('<b>OK</b>', styles['TableHeader'])],
        [Paragraph('DEUC', styles['TableCell']),
         Paragraph('DEUC_Respuesta_2026_CO_ASUM_0013.xml/.pdf', styles['TableCell']),
         Paragraph('SI', styles['TableCell']),
         Paragraph('[ ]', styles['TableCell'])],
        [Paragraph('Anexo V', styles['TableCell']),
         Paragraph('Anexo_V_Grupo_Empresarial', styles['TableCell']),
         Paragraph('SI', styles['TableCell']),
         Paragraph('[ ]', styles['TableCell'])],
        [Paragraph('Anexo IV', styles['TableCell']),
         Paragraph('Anexo_IV_Condiciones_Especiales', styles['TableCell']),
         Paragraph('SI', styles['TableCell']),
         Paragraph('[ ]', styles['TableCell'])],
        [Paragraph('Anexo II', styles['TableCell']),
         Paragraph('No aplica (licitador unico)', styles['TableCell']),
         Paragraph('-', styles['TableCell']),
         Paragraph('N/A', styles['TableCell'])],
        [Paragraph('(Adicional)', styles['TableCell']),
         Paragraph('Anexos_VII_VIII + ROLECE/DNI', styles['TableCell']),
         Paragraph('SI', styles['TableCell']),
         Paragraph('[ ]', styles['TableCell'])],
    ]
    cl_table = Table(cl_data, colWidths=[3*cm, 7*cm, 2*cm, 2*cm])
    cl_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (2, 0), (3, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(cl_table)

    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('SOBRE 2: JUICIOS DE VALOR', styles['H2']))
    cl2_data = [
        [Paragraph('<b>Campo web</b>', styles['TableHeader']),
         Paragraph('<b>Documento</b>', styles['TableHeader']),
         Paragraph('<b>Firma</b>', styles['TableHeader']),
         Paragraph('<b>OK</b>', styles['TableHeader'])],
        [Paragraph('Memoria tecnica', styles['TableCell']),
         Paragraph('Memoria_Tecnica_Sobre2', styles['TableCell']),
         Paragraph('SI', styles['TableCell']),
         Paragraph('[ ]', styles['TableCell'])],
        [Paragraph('Anexo III', styles['TableCell']),
         Paragraph('Anexo_III_Confidencialidad_Sobre2', styles['TableCell']),
         Paragraph('SI', styles['TableCell']),
         Paragraph('[ ]', styles['TableCell'])],
    ]
    cl2_table = Table(cl2_data, colWidths=[3*cm, 7*cm, 2*cm, 2*cm])
    cl2_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (2, 0), (3, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(cl2_table)

    story.append(Spacer(1, 6*mm))
    story.append(Paragraph('SOBRE 3: FORMULAS', styles['H2']))
    cl3_data = [
        [Paragraph('<b>Campo web</b>', styles['TableHeader']),
         Paragraph('<b>Documento</b>', styles['TableHeader']),
         Paragraph('<b>Firma</b>', styles['TableHeader']),
         Paragraph('<b>OK</b>', styles['TableHeader'])],
        [Paragraph('Anexo X', styles['TableCell']),
         Paragraph('Anexo_X_Proposicion_Economica', styles['TableCell']),
         Paragraph('SI', styles['TableCell']),
         Paragraph('[ ]', styles['TableCell'])],
        [Paragraph('Anexo III', styles['TableCell']),
         Paragraph('Anexo_III_Confidencialidad_Sobre3', styles['TableCell']),
         Paragraph('SI', styles['TableCell']),
         Paragraph('[ ]', styles['TableCell'])],
    ]
    cl3_table = Table(cl3_data, colWidths=[3*cm, 7*cm, 2*cm, 2*cm])
    cl3_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (2, 0), (3, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    story.append(cl3_table)

    story.append(Spacer(1, 8*mm))
    story.append(Paragraph('VERIFICACIONES FINALES', styles['H2']))
    story.append(bullet(
        '[ ] Todos los PDFs firmados electronicamente con certificado digital vigente.'))
    story.append(bullet(
        '[ ] La Memoria Tecnica NO contiene cifras de precio, descuento ni n. de cuentas.'))
    story.append(bullet(
        '[ ] El Anexo X tiene marcado el Tramo 4 (Ilimitadas) con una "X".'))
    story.append(bullet(
        '[ ] Todos los marcadores [COMPLETAR: ...] han sido sustituidos por datos reales.'))
    story.append(bullet(
        '[ ] Capturas de pantalla reales insertadas en el Anexo B de la Memoria.'))
    story.append(bullet(
        '[ ] Descargado resguardo de presentacion de la plataforma.'))

    build_doc('Guia_Presentacion_Checklist.pdf', 'Guia de Presentacion', story)


# ============================================================
# GENERAR TODOS
# ============================================================
if __name__ == '__main__':
    print('='*60)
    print(f'Generando documentacion para Expediente {EXPEDIENTE}')
    print(f'Directorio de salida: {OUTPUT_DIR}')
    print('='*60)
    print()

    generar_memoria_tecnica()
    generar_anexo_x()
    generar_anexo_iv()
    generar_anexo_v()
    generar_anexo_iii_sobre2()
    generar_anexo_iii_sobre3()
    generar_anexos_vii_viii()
    generar_checklist()

    print()
    print('='*60)
    print(f'Documentacion generada exitosamente en:')
    print(f'  {OUTPUT_DIR}')
    print()
    print('IMPORTANTE: Antes de firmar y presentar:')
    print('  1. Reemplazar TODOS los marcadores [COMPLETAR: ...]')
    print('  2. Insertar capturas de pantalla reales en la Memoria')
    print('  3. Firmar electronicamente cada PDF con AutoFirma')
    print('  4. Verificar la firma con la herramienta del Gobierno Vasco')
    print('='*60)
