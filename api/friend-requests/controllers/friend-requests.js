'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async send(ctx) {
        const knex = strapi.connections.default;

        const { senderId, receiverId } = ctx.request.body;
        if(!senderId || !receiverId) {
            ctx.throw(404, "Sender/receiver not provided");
        }

        if(ctx.state.user.id !== Number(senderId)) {
            ctx.throw(401, "Cannot send a friend request as a user other than yourself");
        }

        let params = {
            senderId: senderId,
            receiverId: receiverId,
            createdAt: new Date().toUTCString(),
            updatedAt: new Date().toUTCString(),
        };

        const existingRequests = (await knex.raw(`
            SELECT fr.*
            FROM friend_requests fr
            WHERE
                fr.sender_id = :senderId AND
                fr.receiver_id = :receiverId
        `, params))[0];

        if(!!existingRequests) {
            ctx.throw(400, "An identical friend request already exists")
        }

        if(!!existingRequests && existingRequests?.length > 0) {
            ctx.throw(400, "An identical friend request already exists")
        }

        await knex.raw(`
            INSERT INTO friend_requests(created_at, updated_at, sender_id, receiver_id)
            VALUES (:createdAt, :updatedAt, :senderId, :receiverId)
        `, params);

        ctx.send({
            message: 'Friend request created.'
        }, 201);
    },

    async accept(ctx) {
        const knex = strapi.connections.default;

        const { requestId } = ctx.request.body;

        if(!requestId) {
            ctx.throw(404, "Request ID not provided");
        }
        
        const request = await strapi.services['friend-requests'].findOne({ id: Number(requestId) });
        if (!request) {
            ctx.throw(404, "Friend request not found");
        }

        if(ctx.state.user.id !== request.receiver_id) {
            ctx.throw(401, "You cannot accept a friend request on behalf of another user")
        }

        let params = {
            senderId: request.sender_id,
            receiverId: request.receiver_id,
            createdAt: new Date().toUTCString(),
            updatedAt: new Date().toUTCString(),
            requestId: Number(request.id)
        };

        const existingFriends = (await knex.raw(`
            SELECT uf.*
            FROM user_friends uf
            WHERE
                (
                    uf.friend_id = :senderId AND
                    uf.user_id = :receiverId
                ) OR
                (
                    uf.user_id = :senderId AND
                    uf.friend_id = :receiverId
                )
        `, params))[0];

        if(!!existingFriends) {
            ctx.throw(400, "An identical friend already exists")
        }

        if(!!existingFriends && existingFriends?.length > 0) {
            ctx.throw(400, "An identical friend already exists")
        }

        await knex.raw(`
            INSERT INTO user_friends(created_at, updated_at, friend_id, user_id)
            VALUES (:createdAt, :updatedAt, :senderId, :receiverId)
        `, params);

        await knex.raw(`
            INSERT INTO user_friends(created_at, updated_at, user_id, friend_id)
            VALUES (:createdAt, :updatedAt, :senderId, :receiverId)
        `, params);

        await knex.raw(`
            DELETE FROM friend_requests fr WHERE fr.id = :requestId
        `, params);

        ctx.send({
            message: 'Friend request accepted.'
        }, 201);        
    },

    async deny(ctx) {
        const knex = strapi.connections.default;

        const { requestId } = ctx.request.body;

        if(!requestId) {
            ctx.throw(404, "Request ID not provided");
        }
        
        const request = await strapi.services['friend-requests'].findOne({ id: Number(requestId) });
        if (!request) {
            ctx.throw(404, "Friend request not found");
        }

        if(ctx.state.user.id !== request.receiver_id) {
            ctx.throw(401, "You cannot deny a friend request on behalf of another user")
        }

        let params = {
            requestId: Number(request.id)
        };        

        await knex.raw(`
            DELETE FROM friend_requests WHERE id = :requestId
        `, params);

        ctx.send({
            message: 'Friend request denied.'
        }, 201);        
    }
};
