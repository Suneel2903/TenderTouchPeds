import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bookingsRouter from './routes/bookings';
import adminRouter from './routes/admin';
import availabilityRouter from './routes/availability';
import holidaysRouter from './routes/holidays';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.set('trust proxy', 1);

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        // Frontend will primarily talk to this API; including localhost:4000 here
        // follows the requested example and is safe.
        connectSrc: ["'self'", 'http://localhost:4000'],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);

const allowedOrigins = ['http://localhost:4000'];

const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: false,
};

app.use(cors(corsOptions));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('tiny'));
}

app.use(express.json());

app.use(bookingsRouter);
app.use(adminRouter);
app.use(availabilityRouter);
app.use(holidaysRouter);

app.use(errorHandler);

const port = Number(process.env.PORT) || 6060;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${port}`);
});


