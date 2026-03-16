'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::label.label', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const labels = await strapi.entityService.findMany('api::label.label', {
      filters: { owner: user.id },
      fields: ['id', 'name', 'color']
    });
    return this.transformResponse(labels);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const created = await strapi.entityService.create('api::label.label', {
      data: {
        name: String(ctx.request.body?.data?.name || '').trim(),
        color: String(ctx.request.body?.data?.color || '#D946EF'),
        owner: user.id
      }
    });
    return this.transformResponse(created);
  }
}));
