'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async retrieve(ctx) {       
        const knex = strapi.connections.default;
        
        let params = {
            userId: Number(ctx.state.user.id)
        };


        const userfriends = await strapi.services['user-friends'].find({ user_id: Number(ctx.state.user.id)});
        if(!userfriends || userfriends?.length === 0) {
            ctx.send([]);
        }

        const users = await strapi.query('user', 'users-permissions').find();

        let userFriendIds = userfriends.map(uf => uf.friend_id);
        let friends = users.filter(u => userFriendIds.includes(u.id));

        ctx.send(friends);
    }
};
