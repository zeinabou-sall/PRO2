'use strict';

module.exports = {
  async beforeDelete(event) {
    const boardId = Number(event.params?.where?.id);
    if (!boardId) return;

    const columns = await strapi.entityService.findMany('api::column.column', {
      filters: { board: boardId },
      fields: ['id']
    });

    for (const col of columns) {
      const cards = await strapi.entityService.findMany('api::card.card', {
        filters: { column: col.id },
        fields: ['id']
      });

      for (const card of cards) {
        await strapi.entityService.delete('api::card.card', card.id);
      }

      await strapi.entityService.delete('api::column.column', col.id);
    }
  }
};
