import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { stripeWebhook } from './controllers/payment.controller.js'

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.post('/api/v1/payments/stripe-webhook', bodyParser.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({limit: "16kb"})) // any data that is being sent to us in JSON format would have a limit of 16kb, data of larger size is not permitted.

app.use(express.urlencoded({extended:true, limit:"16kb"})); //to parse the request body (if the request sent is in such format that it needs to be parsed) into javascript object.

app.use(express.static(path.join(__dirname, '../public')));

app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

app.use(cookieParser());



import userRouter from './routes/user.route.js';
import paymentRouter from './routes/payment.route.js';
import metricRouter from './routes/metric.route.js';
import industryRouter from './routes/industry.route.js';
import metricDataRouter from './routes/metricData.route.js';

app.use('/api/v1/users', userRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/metrics', metricRouter);
app.use('/api/v1/industries', industryRouter);
app.use('/api/v1/metric-data', metricDataRouter);

import adminRouter from './routes/admin/admin.route.js';
import mmRouter from './routes/admin/mm.route.js';
import imRouter from './routes/admin/im.route.js';
import umRouter from './routes/admin/um.route.js';
import pmRouter from './routes/admin/pm.route.js';
import mdmRouter from './routes/admin/mdm.route.js';    
import dashboardRouter from './routes/admin/dashboard.route.js';

app.use('/api/v1/admins', adminRouter);
app.use('/api/v1/metric-management', mmRouter);
app.use('/api/v1/industry-management', imRouter);
app.use('/api/v1/user-management', umRouter);
app.use("/api/v1/payment-management", pmRouter);
app.use("/api/v1/metric-data-management", mdmRouter);
app.use('/api/v1/dashboard', dashboardRouter);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
});
export {app};