'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::column.column', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const boardId = Number(ctx.request.body?.data?.board);
    const board = await strapi.entityService.findOne('api::board.board', boardId, {
      populate: { owner: { fields: ['id'] } }
    });
    if (!board || board.owner?.id !== user.id) return ctx.notFound();

    const existingColumns = await strapi.entityService.findMany('api::column.column', {
      filters: { board: boardId },
      fields: ['id', 'order'],
      sort: { order: 'asc' }
    });

    for (const existing of existingColumns) {
      await strapi.entityService.update('api::column.column', existing.id, {
        data: { order: Number(existing.order || 0) + 1 }
      });
    }

    const column = await strapi.entityService.create('api::column.column', {
      data: {
        title: String(ctx.request.body?.data?.title || '').trim() || 'Nouvelle colonne',
        color: String(ctx.request.body?.data?.color || '#b5179e'),
        wipLimit: Number.isInteger(ctx.request.body?.data?.wipLimit) ? ctx.request.body.data.wipLimit : 0,
        board: boardId,
        order: 0
      }
    });

    return this.transformResponse(column);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const id = Number(ctx.params.id);

    const column = await strapi.entityService.findOne('api::column.column', id, {
      populate: { board: { populate: { owner: { fields: ['id'] } } } }
    });
    if (!column || column.board?.owner?.id !== user.id) return ctx.notFound();

    const updated = await strapi.entityService.update('api::column.column', id, {
      data: {
        title: String(ctx.request.body?.data?.title || column.title).trim(),
        color: String(ctx.request.body?.data?.color || column.color || '#b5179e'),
        wipLimit: Number.isInteger(ctx.request.body?.data?.wipLimit) ? ctx.request.body.data.wipLimit : (column.wipLimit || 0),
        order: Number.isInteger(ctx.request.body?.data?.order) ? ctx.request.body.data.order : column.order
      }
    });
    return this.transformResponse(updated);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const id = Number(ctx.params.id);

    const column = await strapi.entityService.findOne('api::column.column', id, {
      populate: { board: { populate: { owner: { fields: ['id'] } } } }
    });
    if (!column || column.board?.owner?.id !== user.id) return ctx.notFound();

    const cards = await strapi.entityService.findMany('api::card.card', {
      filters: { column: id },
      fields: ['id']
    });
    for (const card of cards) {
      await strapi.entityService.delete('api::card.card', card.id);
    }
    const deleted = await strapi.entityService.delete('api::column.column', id);
    return this.transformResponse(deleted);
  }
}));
