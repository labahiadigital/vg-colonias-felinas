import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

const spec = {
	openapi: '3.0.3',
	info: {
		title: 'Gatopolis API',
		description: 'API pública para gestión de colonias felinas urbanas. Requiere autenticación mediante API key.',
		version: '1.0.0',
		contact: { name: 'Gatopolis', url: 'https://gatopolis.com' }
	},
	servers: [{ url: '/api/v1', description: 'API v1' }],
	security: [{ BearerAuth: [] }],
	components: {
		securitySchemes: {
			BearerAuth: {
				type: 'http',
				scheme: 'bearer',
				description: 'API key con formato gtp_xxx. Obtén tu key en Configuración > API.'
			}
		},
		schemas: {
			Colony: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					name: { type: 'string' },
					address: { type: 'string' },
					latitude: { type: 'number' },
					longitude: { type: 'number' },
					environment: { type: 'string' },
					isActive: { type: 'boolean' },
					catCount: { type: 'integer' },
					createdAt: { type: 'string', format: 'date-time' }
				}
			},
			Cat: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					name: { type: 'string' },
					sex: { type: 'string', enum: ['male', 'female'] },
					sterilized: { type: 'boolean' },
					microchip: { type: 'string' },
					status: { type: 'string' },
					estimatedAge: { type: 'string' },
					colonyId: { type: 'string', format: 'uuid' },
					colonyName: { type: 'string' }
				}
			},
			Stats: {
				type: 'object',
				properties: {
					colonies: { type: 'integer' },
					cats: { type: 'integer' },
					sterilized: { type: 'integer' },
					sterilizationRate: { type: 'number' },
					visits: { type: 'integer' },
					incidents: { type: 'integer' },
					healthRecords: { type: 'integer' }
				}
			},
			Pagination: {
				type: 'object',
				properties: {
					page: { type: 'integer' },
					limit: { type: 'integer' },
					total: { type: 'integer' },
					totalPages: { type: 'integer' }
				}
			}
		}
	},
	paths: {
		'/colonies': {
			get: {
				summary: 'Listar colonias',
				tags: ['Colonias'],
				parameters: [
					{ name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
					{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } }
				],
				responses: {
					'200': {
						description: 'Lista de colonias',
						content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Colony' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } }
					},
					'401': { description: 'API key inválida o ausente' }
				}
			}
		},
		'/cats': {
			get: {
				summary: 'Listar gatos',
				tags: ['Gatos'],
				parameters: [
					{ name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
					{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
					{ name: 'colony_id', in: 'query', schema: { type: 'string', format: 'uuid' } }
				],
				responses: {
					'200': {
						description: 'Lista de gatos',
						content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Cat' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } }
					}
				}
			}
		},
		'/stats': {
			get: {
				summary: 'Estadísticas generales',
				tags: ['Estadísticas'],
				responses: {
					'200': {
						description: 'Estadísticas agregadas',
						content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Stats' }, generatedAt: { type: 'string', format: 'date-time' } } } } }
					}
				}
			}
		}
	}
};

export const GET: RequestHandler = async () => {
	return json(spec, {
		headers: { 'Access-Control-Allow-Origin': '*' }
	});
};
