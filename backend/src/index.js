module.exports = {
  register() {},
  async bootstrap({ strapi }) {
    const actions = [
      'api::board.board.find',
      'api::board.board.findOne',
      'api::board.board.create',
      'api::board.board.update',
      'api::board.board.delete',
      'api::column.column.create',
      'api::column.column.update',
      'api::column.column.delete',
      'api::card.card.create',
      'api::card.card.update',
      'api::card.card.delete',
      'api::label.label.find',
      'api::label.label.create'
    ];

    const role = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!role) return;

    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    for (const action of actions) {
      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: {
          action,
          role: role.id
        }
      });

      if (!existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: {
            action,
            role: role.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            publishedAt: new Date()
          }
        });
      }
    }

    const users = await strapi.db.query('plugin::users-permissions.user').findMany({
      select: ['id']
    });

    for (const user of users) {
      const links = await strapi.db.connection('up_users_role_lnk').where({ user_id: user.id });
      if (links.length === 0) {
        await strapi.db.connection('up_users_role_lnk').insert({
          user_id: user.id,
          role_id: role.id,
          user_ord: 1
        });
        continue;
      }

      if (publicRole && links.some((l) => l.role_id === publicRole.id)) {
        await strapi.db.connection('up_users_role_lnk').where({ user_id: user.id }).update({
          role_id: role.id
        });
      }
    }
  }
};
