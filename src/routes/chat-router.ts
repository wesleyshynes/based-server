import SocketIO from 'socket.io';
import StatusCodes from 'http-status-codes';
import { Router, Request, Response } from 'express';

import chatService from '@services/chat-service';
import { ParamMissingError, RoomNotFoundError } from '@shared/errors';


// Chat router
const router = Router();
const { OK } = StatusCodes;

// Paths
export const p = {
    connect: '/connect-socket-room/:socketId',
    emit: '/emit-message',
} as const;



/**
 * Connect to socket room.
 */
router.get(p.connect, (req: Request, res: Response) => {
    const { socketId } = req.params;
    // Check params
    if (!socketId) {
        console.log('missing socketId')
        throw new ParamMissingError();
    }
    // Get room
    const io: SocketIO.Server = req.app.get('socketio');
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) {
        console.log('socket not found')
        throw new RoomNotFoundError();
    }
    // Connect
    chatService.connectSocketToRm(socket);

    socket.on('created-char', (data: any) => {
        chatService.emitMessage(socket, data, socketId)
    })

    socket.on('disconnect', () => {
        socket.to('jet-logger-chat-room').emit('remove-player', socketId)
    })

    // Get people in room
    const peopleInRoom: any = io.sockets.adapter.rooms.get('jet-logger-chat-room');
    console.log(peopleInRoom)

    // Return
    return res.status(OK).json({ok: true, peopleInRoom: Array.from(peopleInRoom)});
    // return res.status(OK).end();
});


/**
 * Send a chat message.
 */
router.post(p.emit, (req: Request, res: Response) => {
    // const { sessionUser } = res.locals;
    // console.log(res.locals)
    const { message, socketId } = req.body;
    // Check params
    if (!socketId || !message) {
        throw new ParamMissingError();
    }
    // Get room
    const io: SocketIO.Server = req.app.get('socketio');
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) {
        throw new RoomNotFoundError();
    }
    // Connect
    chatService.emitMessage(socket, message, socketId);
    // chatService.emitMessage(socket, message, sessionUser.name);
    // Return
    return res.status(OK).json({
        senderName: socketId,
        // senderName: sessionUser.name,
    });
});


// Export router
export default router;
