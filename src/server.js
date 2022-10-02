import dotenv from 'dotenv';
import express from 'express';

import cors from 'cors';

import polls from './routes/poll.Routes.js';
import choices from './routes/choice.Routes.js';

dotenv.config();

const server = express();

// express 
server.use(express.json());
server.use(cors());

//routes
server.use(polls);
server.use(choices);

server.listen(process.env.PORT, () => {
    console.log('Server running on port ' + process.env.PORT);
})
