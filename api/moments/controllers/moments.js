'use strict';

const { send } = require("../../friend-requests/controllers/friend-requests");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async send(ctx) {
        console.log(ctx.request.body);
        const knex = strapi.connections.default;

        console.log(JSON.stringify(strapi.services));
        // Verify sender_id is friends with receiver_id
        const friend = await strapi.services['user-friends'].findOne({ user_id: ctx.state.user.id, friend_id: Number(ctx.request.body.receiverId) });

        console.log(friend);

        if(!friend || friend?.length === 0) {
            ctx.throw(401, "You are not friends with the receiving user");
        }

        if(!(ctx.request.body.content || ctx.request.body.background)) {
            ctx.throw(404, "You must send either content or a background");
        }

        let moment = {
            created_at: new Date().toUTCString(),
            updated_at: new Date().toUTCString(),
            sender_id: Number(ctx.state.user.id),
            receiver_id: Number(ctx.request.body.receiverId),
            content: ctx.request.body.content,
            background: ctx.request.body.background,
            background_url: ctx.request.body.backgroundUrl
        };

        // Create Moment(content, background, sender_id, receiver_id, ...)
        let returned = await strapi.services.moments.create(moment);

        ctx.send(returned);
    },

    async retrieve(ctx) {
        console.log('made it here')
        const moments = await strapi.services.moments.find({ receiver_id: Number(ctx.state.user.id)});

        if(!moments || moments?.length === 0) {
            ctx.send([]);
        }

        ctx.send(moments);
    }
};
