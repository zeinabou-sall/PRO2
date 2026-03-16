'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::board.board', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const data = await strapi.entityService.findMany('api::board.board', {
      filters: { owner: user.id },
      sort: { id: 'asc' },
      fields: ['id', 'title', 'createdAt']
    });

    return this.transformResponse(data);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const title = String(ctx.request.body?.data?.title || '').trim();
    if (!title) return ctx.badRequest('title is required');

    const board = await strapi.entityService.create('api::board.board', {
      data: { title, owner: user.id }
    });

    return this.transformResponse(board);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const id = Number(ctx.params.id);
    const board = await strapi.entityService.findOne('api::board.board', id, {
      populate: {
        owner: { fields: ['id'] },
        columns: {
          sort: { order: 'asc' },
          populate: {
            cards: {
              sort: { order: 'asc' },
              populate: {
                labels: { fields: ['id', 'name', 'color'] }
              }
            }
          }
        }
      }
    });

    if (!board || board.owner?.id !== user.id) return ctx.notFound();
    return this.transformResponse(board);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const id = Number(ctx.params.id);

    const board = await strapi.entityService.findOne('api::board.board', id, {
      populate: { owner: { fields: ['id'] } }
    });
    if (!board || board.owner?.id !== user.id) return ctx.notFound();

    const updated = await strapi.entityService.update('api::board.board', id, {
      data: {
        title: String(ctx.request.body?.data?.title || board.title).trim()
      }
    });
    return this.transformResponse(updated);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const id = Number(ctx.params.id);

    const board = await strapi.entityService.findOne('api::board.board', id, {
      populate: { owner: { fields: ['id'] } }
    });
    if (!board || board.owner?.id !== user.id) return ctx.notFound();

    const deleted = await strapi.entityService.delete('api::board.board', id);
    return this.transformResponse(deleted);
  }
}));
