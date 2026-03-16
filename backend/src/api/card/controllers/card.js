'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::card.card', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const columnId = Number(ctx.request.body?.data?.column);
    const column = await strapi.entityService.findOne('api::column.column', columnId, {
      populate: { board: { populate: { owner: { fields: ['id'] } } } }
    });
    if (!column || column.board?.owner?.id !== user.id) return ctx.notFound();

    const count = await strapi.entityService.count('api::card.card', { filters: { column: columnId } });
    const card = await strapi.entityService.create('api::card.card', {
      data: {
        title: String(ctx.request.body?.data?.title || '').trim() || 'Nouvelle carte',
        description: String(ctx.request.body?.data?.description || ''),
        dueDate: ctx.request.body?.data?.dueDate || null,
        priority: String(ctx.request.body?.data?.priority || 'medium'),
        coverColor: String(ctx.request.body?.data?.coverColor || '#f72585'),
        labels: ctx.request.body?.data?.labels || [],
        column: columnId,
        order: count
      },
      populate: { labels: true }
    });

    return this.transformResponse(card);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const id = Number(ctx.params.id);

    const card = await strapi.entityService.findOne('api::card.card', id, {
      populate: {
        labels: { fields: ['id'] },
        column: { populate: { board: { populate: { owner: { fields: ['id'] } } } } }
      }
    });
    if (!card || card.column?.board?.owner?.id !== user.id) return ctx.notFound();

    const data = ctx.request.body?.data || {};
    const updated = await strapi.entityService.update('api::card.card', id, {
      data: {
        title: String(data.title ?? card.title).trim(),
        description: String(data.description ?? card.description ?? ''),
        dueDate: data.dueDate ?? card.dueDate ?? null,
        priority: String(data.priority ?? card.priority ?? 'medium'),
        coverColor: String(data.coverColor ?? card.coverColor ?? '#f72585'),
        labels: data.labels ?? (card.labels || []).map((l) => l.id),
        order: Number.isInteger(data.order) ? data.order : card.order,
        column: data.column ?? card.column.id
      },
      populate: { labels: true }
    });
    return this.transformResponse(updated);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const id = Number(ctx.params.id);

    const card = await strapi.entityService.findOne('api::card.card', id, {
      populate: { column: { populate: { board: { populate: { owner: { fields: ['id'] } } } } } }
    });
    if (!card || card.column?.board?.owner?.id !== user.id) return ctx.notFound();

    const deleted = await strapi.entityService.delete('api::card.card', id);
    return this.transformResponse(deleted);
  }
}));
